<template>
  <AdminLayout title="风控记录" subtitle="审计动作列表按目标对象、执行人和细节统一呈现，靠近 Stitch 风控页信息密度" breadcrumb="风控记录" search-placeholder="搜索动作 / 目标ID...">
    <template #actions>
      <AdminActionButton label="导出记录" icon="download" tone="outline" @click="exportAudits" />
      <AdminActionButton label="刷新" icon="refresh" tone="primary" @click="loadAudits" />
    </template>

    <AdminFilterBar>
      <div>
        <label class="mb-1.5 ml-1 block text-xs font-semibold text-slate-500">动作类型</label>
        <select v-model="actionFilter" class="w-full rounded-xl border-none bg-surface-container-lowest px-4 py-3 text-sm shadow-sm">
          <option value="">全部动作</option>
          <option value="approve_post">通过内容</option>
          <option value="reject_post">驳回内容</option>
          <option value="delete_post">删除内容</option>
          <option value="ignore_report">忽略举报</option>
          <option value="warn_owner">警告用户</option>
          <option value="remove_content">下架内容</option>
          <option value="ban_owner">封禁用户</option>
          <option value="unban_owner">解封用户</option>
          <option value="update_config">修改配置</option>
        </select>
      </div>
      <div class="lg:col-span-3">
        <label class="mb-1.5 ml-1 block text-xs font-semibold text-slate-500">搜索关键词</label>
        <input v-model.trim="query" class="w-full rounded-xl border-none bg-surface-container-lowest px-4 py-3 text-sm shadow-sm" placeholder="动作 / 目标ID / 执行人 / 详情" />
      </div>
    </AdminFilterBar>

    <AdminTableSkeleton v-if="loading" :cols="6" />
    <AdminDataTable v-else :columns="columns" :has-rows="Boolean(filteredAudits.length)" empty-text="暂无风控记录">
      <tr v-for="item in filteredAudits" :key="item.id" class="transition-colors hover:bg-primary/5">
              <td class="px-6 py-4 text-sm font-semibold">{{ labelOf(AUDIT_ACTION, item.action) }}</td>
              <td class="px-6 py-4 text-sm">{{ labelOf(TARGET_TYPE, item.targetType) }} · {{ item.targetId }}</td>
              <td class="px-6 py-4 text-sm">{{ labelOf(ACTOR_TYPE, item.actorType) }} · {{ item.actorId }}</td>
              <td class="px-6 py-4 text-xs text-slate-500">{{ formatDate(item.createdAt) }}</td>
              <td class="max-w-[360px] px-6 py-4 text-xs text-slate-500">{{ item.detail || '-' }}</td>
              <td class="px-6 py-4 text-right">
                <AdminTableActions :actions="actionsFor(item)" />
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
import AdminTableActions from '../components/AdminTableActions.vue';
import AdminTableSkeleton from '../components/AdminTableSkeleton.vue';
import { adminApi } from '../api/admin';
import { ACTOR_TYPE, AUDIT_ACTION, TARGET_TYPE, formatDate, labelOf } from '../assets/labels';
import { useExportCsv } from '../composables/useExportCsv';
import AdminFilterBar from '../components/AdminFilterBar.vue';
import AdminActionButton from '../components/AdminActionButton.vue';

const { exportCsv } = useExportCsv();
const router = useRouter();
const audits = ref([]);
const loading = ref(false);
const actionFilter = ref('');
const query = ref('');
const columns = [
  { key: 'action', label: '动作' },
  { key: 'target', label: '目标' },
  { key: 'actor', label: '执行人' },
  { key: 'createdAt', label: '时间' },
  { key: 'detail', label: '详情' },
  { key: 'actions', label: '操作', align: 'right' }
];
const filteredAudits = computed(() => audits.value.filter((item) => {
  const passAction = actionFilter.value ? item.action === actionFilter.value : true;
  const haystack = `${item.action || ''} ${item.targetId || ''} ${item.actorId || ''} ${item.detail || ''}`.toLowerCase();
  const passQuery = query.value ? haystack.includes(query.value.toLowerCase()) : true;
  return passAction && passQuery;
}));

async function loadAudits() {
  loading.value = true;
  try {
    const data = await adminApi.audits();
    audits.value = data.items || [];
  } finally {
    loading.value = false;
  }
}

function exportAudits() {
  const headers = ['记录ID', '动作', '目标对象', '目标ID', '执行人', '时间', '详情'];
  const rows = filteredAudits.value.map((item) => [
    item.id,
    labelOf(AUDIT_ACTION, item.action),
    labelOf(TARGET_TYPE, item.targetType),
    item.targetId,
    `${labelOf(ACTOR_TYPE, item.actorType)} ${item.actorId}`,
    formatDate(item.createdAt),
    item.detail || ''
  ]);
  exportCsv('audits', headers, rows);
}

function openDetail(id) {
  router.push(`/audits/detail?id=${id}`);
}

function actionsFor(item) {
  return [{ label: '详情', icon: 'visibility', tone: 'primary', onClick: () => openDetail(item.id) }];
}

onMounted(loadAudits);
</script>
