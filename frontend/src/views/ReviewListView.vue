<template>
  <AdminLayout title="内容审核中心" subtitle="处理社区宠物动态、评论及多媒体信息的合规性审查" breadcrumb="内容审核" search-placeholder="搜索审核内容 ID 或关键词...">
    <template #actions>
      <div class="flex gap-1 rounded-xl bg-surface-container-low p-1">
        <button
          v-for="option in filters"
          :key="option.value"
          class="rounded-lg px-4 py-1.5 text-xs font-semibold transition-all"
          :class="statusFilter === option.value ? 'bg-white text-primary shadow-sm' : 'text-on-surface-variant hover:bg-white/50'"
          @click="setFilter(option.value)"
        >
          {{ option.label }}
        </button>
      </div>
      <AdminActionButton label="导出审核" icon="download" tone="outline" @click="exportPosts" />
      <AdminActionButton label="刷新数据" icon="refresh" tone="primary" @click="loadPosts" />
    </template>

    <div class="mb-8 grid grid-cols-1 gap-4 md:grid-cols-4">
      <AdminStatCard label="待审核" :value="summary.pending" hint="当前筛选结果中的待处理内容" tone="primary" />
      <AdminStatCard label="已通过" :value="summary.approved" :hint="`占比 ${approvedRate}%`" />
      <AdminStatCard label="已驳回" :value="summary.rejected" :hint="`驳回率 ${rejectRate}%`" tone="danger" />
      <AdminStatCard label="总内容量" :value="posts.length" hint="包含已审与待审内容" tone="solid" />
    </div>

    <AdminFilterBar>
      <div>
        <label class="mb-1.5 ml-1 block text-xs font-semibold text-slate-500">内容状态</label>
        <select v-model="statusFilter" class="w-full rounded-xl border-none bg-surface-container-lowest px-4 py-3 text-sm shadow-sm">
          <option value="">全部状态</option>
          <option value="pending">待审核</option>
          <option value="approved">已通过</option>
          <option value="rejected">已驳回</option>
        </select>
      </div>
      <div class="lg:col-span-3">
        <label class="mb-1.5 ml-1 block text-xs font-semibold text-slate-500">搜索关键词</label>
        <input v-model.trim="query" class="w-full rounded-xl border-none bg-surface-container-lowest px-4 py-3 text-sm shadow-sm" placeholder="标题 / 正文 / 作者 / 宠物" />
      </div>
    </AdminFilterBar>

    <AdminTableSkeleton v-if="loading" :cols="6" />
    <AdminDataTable v-else :columns="columns" :has-rows="Boolean(filteredPosts.length)" empty-text="暂无审核数据">
      <tr v-for="post in filteredPosts" :key="post.id" class="transition-colors hover:bg-primary/5">
              <td class="px-6 py-5">
                <div class="flex items-center gap-4">
                  <div class="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-slate-100">
                    <img v-if="post.images?.[0]" :src="post.images[0]" alt="内容封面" class="h-full w-full object-cover" />
                    <span v-else class="material-symbols-outlined text-slate-400">image</span>
                  </div>
                  <div class="min-w-0">
                    <p class="truncate text-sm font-bold text-on-surface">{{ post.title || '未命名内容' }}</p>
                    <p class="mt-1 line-clamp-2 max-w-[340px] text-xs leading-5 text-on-surface-variant">{{ post.content }}</p>
                    <p v-if="post.status === 'rejected' && post.reviewReason" class="mt-2 text-xs font-medium text-error">
                      驳回原因：{{ post.reviewReason }}
                    </p>
                  </div>
                </div>
              </td>
              <td class="px-6 py-5">
                <div class="text-sm">
                  <p class="font-semibold text-on-surface">{{ post.pet?.name || '未关联宠物' }}</p>
                  <p class="text-xs text-on-surface-variant">{{ post.pet?.breed || '未知品种' }}</p>
                </div>
              </td>
              <td class="px-6 py-5">
                <div class="flex items-center gap-3">
                  <AdminAvatar :name="post.owner?.name" size="xs" />
                  <div class="text-sm">
                    <p class="font-semibold">{{ post.owner?.name || '-' }}</p>
                    <p class="text-xs text-on-surface-variant">{{ post.likes?.length || 0 }} 赞 · {{ post.comments?.length || 0 }} 评论</p>
                  </div>
                </div>
              </td>
              <td class="whitespace-nowrap px-6 py-5">
                <AdminStatusBadge
                  :label="labelOf(POST_STATUS, post.status)"
                  :tone="post.status === 'pending' ? 'primary' : post.status === 'rejected' ? 'danger' : 'neutral'"
                  :dot="post.status !== 'approved'"
                  :pulse="post.status === 'pending'"
                />
              </td>
              <td class="px-6 py-5 text-xs text-slate-400">{{ formatDate(post.createdAt) }}</td>
              <td class="px-6 py-5">
                <AdminTableActions :actions="actionsFor(post)" />
              </td>
      </tr>
    </AdminDataTable>
  </AdminLayout>

  <CommonModal
    :open="confirmOpen && confirmAction === 'approve'"
    :title="'确认快速通过内容'"
    :description="selectedPost ? `标题：${selectedPost.title}\n作者：${selectedPost.owner?.name || '-'}\n该操作会立即写入审计日志。` : ''"
    confirm-text="确认通过"
    cancel-text="取消"
    icon="task_alt"
    tone="primary"
    @close="closeActionModal"
    @confirm="confirmApprove"
  />

  <ActionReasonModal
    :open="confirmOpen && confirmAction === 'reject'"
    title="填写驳回原因"
    :description="selectedPost ? `标题：${selectedPost.title}\n作者：${selectedPost.owner?.name || '-'}\n驳回原因会展示在审核详情和审计日志中。` : ''"
    :reason="actionReason"
    confirm-text="确认驳回"
    icon="block"
    tone="danger"
    @close="closeActionModal"
    @confirm="confirmReject"
    @update:reason="actionReason = $event"
  />
</template>

<script setup>
import { computed, onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import AdminLayout from '../layouts/AdminLayout.vue';
import ActionReasonModal from '../components/ActionReasonModal.vue';
import AdminDataTable from '../components/AdminDataTable.vue';
import AdminTableSkeleton from '../components/AdminTableSkeleton.vue';
import AdminStatCard from '../components/AdminStatCard.vue';
import AdminTableActions from '../components/AdminTableActions.vue';
import AdminStatusBadge from '../components/AdminStatusBadge.vue';
import AdminFilterBar from '../components/AdminFilterBar.vue';
import AdminAvatar from '../components/AdminAvatar.vue';
import CommonModal from '../components/CommonModal.vue';
import { adminApi } from '../api/admin';
import { POST_STATUS, formatDate, labelOf } from '../assets/labels';
import { useToast } from '../composables/useToast';
import { useExportCsv } from '../composables/useExportCsv';

const { success, error } = useToast();
const { exportCsv } = useExportCsv();

const router = useRouter();
const statusFilter = ref('');
const posts = ref([]);
const loading = ref(false);
const query = ref('');
const confirmOpen = ref(false);
const confirmAction = ref('approve');
const selectedPost = ref(null);
const actionReason = ref('');

const filters = [
  { label: '全部', value: '' },
  { label: '待审核', value: 'pending' },
  { label: '已通过', value: 'approved' },
  { label: '已驳回', value: 'rejected' }
];

const columns = [
  { key: 'content', label: '内容概览' },
  { key: 'pet', label: '宠物 / 品种' },
  { key: 'owner', label: '作者' },
  { key: 'status', label: '状态' },
  { key: 'createdAt', label: '提交时间' },
  { key: 'actions', label: '动作', align: 'right' }
];

const summary = computed(() => ({
  pending: posts.value.filter((v) => v.status === 'pending').length,
  approved: posts.value.filter((v) => v.status === 'approved').length,
  rejected: posts.value.filter((v) => v.status === 'rejected').length
}));

const rejectRate = computed(() => {
  if (!posts.value.length) return '0.0';
  return ((summary.value.rejected / posts.value.length) * 100).toFixed(1);
});

const approvedRate = computed(() => {
  if (!posts.value.length) return '0.0';
  return ((summary.value.approved / posts.value.length) * 100).toFixed(1);
});
const filteredPosts = computed(() => posts.value.filter((post) => {
  const passStatus = statusFilter.value ? post.status === statusFilter.value : true;
  const haystack = `${post.title || ''} ${post.content || ''} ${post.owner?.name || ''} ${post.pet?.name || ''}`.toLowerCase();
  const passQuery = query.value ? haystack.includes(query.value.toLowerCase()) : true;
  return passStatus && passQuery;
}));

async function loadPosts() {
  loading.value = true;
  try {
    const data = await adminApi.posts(statusFilter.value || undefined);
    posts.value = data.items || [];
  } finally {
    loading.value = false;
  }
}

function setFilter(value) {
  statusFilter.value = value;
}

function openDetail(id) {
  router.push(`/review/detail?id=${id}`);
}

function actionsFor(post) {
  return [
    { label: '通过', icon: 'task_alt', tone: 'primary', onClick: () => quickApprove(post) },
    { label: '驳回', icon: 'block', tone: 'danger', onClick: () => quickReject(post) },
    { label: '详情', icon: 'visibility', tone: 'neutral', onClick: () => openDetail(post.id) }
  ];
}

function quickApprove(post) {
  selectedPost.value = post;
  confirmAction.value = 'approve';
  confirmOpen.value = true;
  actionReason.value = '';
}

function quickReject(post) {
  selectedPost.value = post;
  confirmAction.value = 'reject';
  confirmOpen.value = true;
  actionReason.value = '';
}

async function confirmApprove() {
  if (!selectedPost.value) return;
  const id = selectedPost.value.id;
  closeActionModal();
  try {
    await adminApi.approvePost(id);
    success('内容已通过审核');
  } catch {
    error('操作失败，请重试');
  }
  selectedPost.value = null;
  await loadPosts();
}

async function confirmReject() {
  if (!selectedPost.value) return;
  const id = selectedPost.value.id;
  closeActionModal();
  try {
    await adminApi.rejectPost(id, actionReason.value);
    success('内容已驳回');
  } catch {
    error('操作失败，请重试');
  }
  selectedPost.value = null;
  await loadPosts();
}

function closeActionModal() {
  confirmOpen.value = false;
  actionReason.value = '';
}

function exportPosts() {
  const headers = ['内容ID', '标题', '作者', '宠物', '状态', '审核备注', '提交时间'];
  const rows = filteredPosts.value.map((post) => [
    post.id,
    post.title,
    post.owner?.name || '',
    post.pet?.name || '',
    labelOf(POST_STATUS, post.status),
    post.reviewReason || '',
    formatDate(post.createdAt)
  ]);
  exportCsv('review-posts', headers, rows);
}

onMounted(loadPosts);
</script>
