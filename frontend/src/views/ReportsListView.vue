<template>
  <AdminLayout title="举报处理列表 3.0" subtitle="实时监控社区安全，快速处理违规上报内容" breadcrumb="举报处理" search-placeholder="搜索举报单号或用户名...">
    <template #actions>
      <AdminActionButton :label="showFilters ? '收起筛选' : '高级筛选'" icon="tune" tone="outline" @click="showFilters = !showFilters" />
      <AdminActionButton label="刷新" icon="refresh" tone="primary" @click="loadReports" />
    </template>

    <div class="mb-8 grid grid-cols-1 gap-6 md:grid-cols-4">
      <AdminStatCard label="待处理举报" :value="openCount" tone="success" />
      <AdminStatCard label="今日已处理" :value="resolvedCount" />
      <AdminStatCard label="总举报量" :value="reports.length" />
      <AdminStatCard label="紧急待办" :value="urgentCount" tone="danger" />
    </div>

    <AdminFilterBar v-if="showFilters">
      <div>
        <label class="mb-1.5 ml-1 block text-xs font-semibold text-slate-500">处理状态</label>
        <select v-model="statusFilter" class="w-full rounded-xl border-none bg-surface-container-lowest px-4 py-3 text-sm shadow-sm">
          <option value="">全部状态</option>
          <option value="open">未处理</option>
          <option value="resolved">已处理</option>
        </select>
      </div>
      <div>
        <label class="mb-1.5 ml-1 block text-xs font-semibold text-slate-500">处理动作</label>
        <select v-model="actionFilter" class="w-full rounded-xl border-none bg-surface-container-lowest px-4 py-3 text-sm shadow-sm">
          <option value="">全部动作</option>
          <option value="ignore_report">忽略举报</option>
          <option value="warn_owner">警告用户</option>
          <option value="remove_content">下架内容</option>
          <option value="ban_owner">封禁账号</option>
        </select>
      </div>
      <div class="lg:col-span-2">
        <label class="mb-1.5 ml-1 block text-xs font-semibold text-slate-500">搜索关键词</label>
        <input v-model.trim="query" class="w-full rounded-xl border-none bg-surface-container-lowest px-4 py-3 text-sm shadow-sm" placeholder="举报原因 / 举报人 / 目标对象" />
      </div>
    </AdminFilterBar>

    <AdminTableSkeleton v-if="loading" :cols="8" />
    <AdminDataTable v-else :columns="columns" :has-rows="Boolean(filteredReports.length)" empty-text="暂无举报数据">
      <tr v-for="report in filteredReports" :key="report.id" class="transition-colors hover:bg-primary/5">
              <td class="whitespace-nowrap px-8 py-5">
                <span class="rounded-full border px-3 py-1 text-[10px] font-bold" :class="badgeClass(report)">
                  {{ reasonBadge(report) }}
                </span>
              </td>
              <td class="px-6 py-5">
                <div class="space-y-1">
                  <p class="max-w-[260px] truncate text-sm font-medium text-on-surface">{{ report.reason }}</p>
                  <p class="text-xs text-on-surface-variant">证据 {{ report.evidence?.length || 0 }} 项</p>
                </div>
              </td>
              <td class="px-6 py-5">
                <div class="flex items-center gap-3">
                  <AdminAvatar :name="report.reporter?.name || report.reporterOwnerId" size="xs" fallback="R" />
                  <div>
                    <p class="text-sm font-medium text-on-surface">{{ report.reporter?.name || report.reporterOwnerId }}</p>
                    <p class="text-xs text-on-surface-variant">{{ report.reporterOwnerId }}</p>
                  </div>
                </div>
              </td>
              <td class="px-6 py-5">
                <div>
                  <p class="text-sm font-medium text-primary">{{ report.targetSummary || report.targetId }}</p>
                  <p class="text-xs text-on-surface-variant">{{ report.targetId }}</p>
                </div>
              </td>
              <td class="whitespace-nowrap px-6 py-5">
                <div class="space-y-2">
                  <AdminStatusBadge
                    :label="labelOf(REPORT_STATUS, report.status)"
                    :tone="report.status === 'open' ? 'error' : 'neutral'"
                    dot
                    :pulse="report.status === 'open'"
                  />
                  <p v-if="report.status === 'resolved' && report.actionType" class="text-xs text-on-surface-variant">
                    {{ actionTypeLabel(report) }}
                  </p>
                </div>
              </td>
              <td class="px-6 py-5 text-xs text-on-surface-variant">
                <div v-if="report.status === 'resolved'" class="space-y-1">
                  <p>{{ report.handledByAdminId || '-' }}</p>
                  <p class="line-clamp-2 max-w-[220px]">{{ report.resolution || '无处理备注' }}</p>
                </div>
                <span v-else>-</span>
              </td>
              <td class="px-6 py-5 text-xs text-on-surface-variant">{{ formatDate(report.createdAt) }}</td>
              <td class="px-8 py-5 text-right">
                <AdminTableActions :actions="actionsFor(report)" />
              </td>
      </tr>
    </AdminDataTable>
  </AdminLayout>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import AdminLayout from '../layouts/AdminLayout.vue';
import AdminDataTable from '../components/AdminDataTable.vue';
import AdminStatCard from '../components/AdminStatCard.vue';
import AdminTableActions from '../components/AdminTableActions.vue';
import AdminTableSkeleton from '../components/AdminTableSkeleton.vue';
import AdminStatusBadge from '../components/AdminStatusBadge.vue';
import AdminFilterBar from '../components/AdminFilterBar.vue';
import AdminActionButton from '../components/AdminActionButton.vue';
import AdminAvatar from '../components/AdminAvatar.vue';
import { adminApi } from '../api/admin';
import { REPORT_STATUS, formatDate, labelOf } from '../assets/labels';

const router = useRouter();
const reports = ref([]);
const loading = ref(false);
const showFilters = ref(false);
const statusFilter = ref('');
const actionFilter = ref('');
const query = ref('');
const columns = [
  { key: 'type', label: '举报类型' },
  { key: 'reason', label: '摘要' },
  { key: 'reporter', label: '举报人' },
  { key: 'target', label: '目标对象' },
  { key: 'status', label: '状态' },
  { key: 'handler', label: '处理信息' },
  { key: 'createdAt', label: '提交时间' },
  { key: 'actions', label: '操作', align: 'right' }
];

const openCount = computed(() => reports.value.filter((v) => v.status === 'open').length);
const resolvedCount = computed(() => reports.value.filter((v) => v.status === 'resolved').length);
const urgentCount = computed(() => reports.value.filter((v) => v.status === 'open' && /暴力|诈骗|虐待|营销/.test(v.reason || '')).length);
const filteredReports = computed(() => reports.value.filter((report) => {
  const passStatus = statusFilter.value ? report.status === statusFilter.value : true;
  const passAction = actionFilter.value ? report.actionType === actionFilter.value : true;
  const haystack = `${report.reason || ''} ${report.reporter?.name || ''} ${report.reporterOwnerId || ''} ${report.targetId || ''}`.toLowerCase();
  const passQuery = query.value ? haystack.includes(query.value.toLowerCase()) : true;
  return passStatus && passAction && passQuery;
}));

async function loadReports() {
  loading.value = true;
  try {
    const data = await adminApi.reports();
    reports.value = data.items || [];
  } finally {
    loading.value = false;
  }
}

function reasonBadge(report) {
  const reason = report.reason || '';
  if (reason.includes('虐待')) return '虐待倾向';
  if (reason.includes('广告') || reason.includes('营销')) return '广告骚扰';
  if (reason.includes('不当')) return '言语不当';
  return '有害内容';
}

function badgeClass(report) {
  const badge = reasonBadge(report);
  if (badge === '虐待倾向') return 'border-error bg-error-container text-on-error-container';
  if (badge === '广告骚扰') return 'border-tertiary/20 bg-tertiary-container/10 text-tertiary';
  if (badge === '言语不当') return 'border-slate-200 bg-slate-100 text-slate-600';
  return 'border-error-container/20 bg-error-container/10 text-error-dim';
}

function openDetail(id) {
  router.push(`/reports/detail?id=${id}`);
}

function actionTypeLabel(report) {
  if (report.actionType === 'ignore_report') return '已忽略';
  if (report.actionType === 'warn_owner') return '已警告';
  if (report.actionType === 'remove_content') return '已下架';
  if (report.actionType === 'ban_owner') return '已封禁';
  return '已处理';
}

function actionsFor(report) {
  return [
    { label: '详情', icon: 'visibility', tone: 'primary', onClick: () => openDetail(report.id) },
    {
      label: report.status === 'open' ? '处理' : '完成',
      icon: report.status === 'open' ? 'task_alt' : 'check_circle',
      tone: report.status === 'open' ? 'danger' : 'neutral',
      onClick: () => openDetail(report.id)
    }
  ];
}

onMounted(loadReports);
</script>
