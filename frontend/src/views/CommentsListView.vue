<template>
  <AdminLayout title="评论管理" subtitle="查看和删除社区帖子评论，配合评论审核开关使用" breadcrumb="评论管理">
    <template #actions>
      <button
        class="flex items-center gap-2 rounded-xl bg-primary px-5 py-2 text-sm font-bold text-on-primary shadow-lg shadow-primary/20 transition-all active:scale-95"
        @click="loadComments"
      >
        <span class="material-symbols-outlined text-lg">refresh</span>
        刷新
      </button>
    </template>

    <div class="mb-8 grid grid-cols-1 gap-4 md:grid-cols-3">
      <AdminStatCard label="总评论数" :value="comments.length" hint="当前所有帖子的评论总量" tone="primary" />
      <AdminStatCard label="筛选结果" :value="filtered.length" hint="符合当前筛选条件的数量" />
      <AdminStatCard label="已封禁用户评论" :value="bannedCount" hint="来自已封禁账号的评论" tone="danger" />
    </div>

    <AdminFilterBar>
      <div>
        <label class="mb-1.5 ml-1 block text-xs font-semibold text-slate-500">用户状态</label>
        <select v-model="ownerFilter" class="w-full rounded-xl border-none bg-surface-container-lowest px-4 py-3 text-sm shadow-sm">
          <option value="">全部用户</option>
          <option value="active">正常账号</option>
          <option value="banned">封禁账号</option>
        </select>
      </div>
      <div class="lg:col-span-3">
        <label class="mb-1.5 ml-1 block text-xs font-semibold text-slate-500">搜索关键词</label>
        <input v-model.trim="query" class="w-full rounded-xl border-none bg-surface-container-lowest px-4 py-3 text-sm shadow-sm" placeholder="评论内容 / 用户名 / 帖子标题" />
      </div>
    </AdminFilterBar>

    <AdminTableSkeleton v-if="loading" :cols="5" />
    <AdminDataTable v-else :columns="columns" :has-rows="Boolean(filtered.length)" empty-text="暂无评论数据">
      <tr v-for="comment in filtered" :key="comment.id" class="transition-colors hover:bg-primary/5">
        <td class="px-6 py-5">
          <p class="max-w-sm text-sm text-on-surface line-clamp-2">{{ comment.content }}</p>
        </td>
        <td class="px-6 py-5">
          <div class="flex items-center gap-2">
            <AdminAvatar :name="comment.ownerName" size="sm" />
            <div>
              <p class="text-sm font-semibold text-on-surface">{{ comment.ownerName || '-' }}</p>
              <AdminStatusBadge
                :label="comment.ownerStatus === 'banned' ? '已封禁' : '正常'"
                :tone="comment.ownerStatus === 'banned' ? 'danger' : 'success'"
              />
            </div>
          </div>
        </td>
        <td class="px-6 py-5">
          <p class="max-w-[200px] truncate text-sm text-on-surface-variant">{{ comment.postTitle || '未知帖子' }}</p>
        </td>
        <td class="px-6 py-5 text-xs text-slate-400">{{ formatDate(comment.createdAt) }}</td>
        <td class="px-6 py-5">
          <AdminTableActions :actions="actionsFor(comment)" />
        </td>
      </tr>
    </AdminDataTable>

    <CommonModal
      :open="Boolean(pendingDelete)"
      title="确认删除评论"
      :description="pendingDelete ? `用户：${pendingDelete.ownerName || '-'}\n内容：${pendingDelete.content?.slice(0, 80)}\n删除后不可恢复，操作会写入审计日志。` : ''"
      confirm-text="确认删除"
      cancel-text="取消"
      icon="delete"
      tone="danger"
      @close="pendingDelete = null"
      @confirm="confirmDelete"
    />
  </AdminLayout>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue';
import AdminLayout from '../layouts/AdminLayout.vue';
import AdminDataTable from '../components/AdminDataTable.vue';
import AdminTableSkeleton from '../components/AdminTableSkeleton.vue';
import AdminStatCard from '../components/AdminStatCard.vue';
import AdminTableActions from '../components/AdminTableActions.vue';
import AdminStatusBadge from '../components/AdminStatusBadge.vue';
import AdminFilterBar from '../components/AdminFilterBar.vue';
import AdminAvatar from '../components/AdminAvatar.vue';
import CommonModal from '../components/CommonModal.vue';
import { adminApi } from '../api/admin';
import { formatDate } from '../assets/labels';
import { useToast } from '../composables/useToast';

const { success, error } = useToast();

const comments = ref([]);
const query = ref('');
const ownerFilter = ref('');
const pendingDelete = ref(null);

const columns = [
  { key: 'content', label: '评论内容' },
  { key: 'owner', label: '用户' },
  { key: 'post', label: '所属帖子' },
  { key: 'createdAt', label: '发布时间' },
  { key: 'actions', label: '操作', align: 'right' }
];

const bannedCount = computed(() => comments.value.filter((c) => c.ownerStatus === 'banned').length);

const filtered = computed(() => comments.value.filter((c) => {
  const passOwner = ownerFilter.value ? c.ownerStatus === ownerFilter.value : true;
  const haystack = `${c.content || ''} ${c.ownerName || ''} ${c.postTitle || ''}`.toLowerCase();
  const passQuery = query.value ? haystack.includes(query.value.toLowerCase()) : true;
  return passOwner && passQuery;
}));

async function loadComments() {
  const data = await adminApi.comments();
  comments.value = data.items || [];
}

function actionsFor(comment) {
  return [
    {
      label: '删除',
      icon: 'delete',
      tone: 'danger',
      onClick: () => { pendingDelete.value = comment; }
    }
  ];
}

async function confirmDelete() {
  if (!pendingDelete.value) return;
  const id = pendingDelete.value.id;
  pendingDelete.value = null;
  try {
    await adminApi.deleteComment(id);
    success('评论已删除');
    await loadComments();
  } catch {
    error('删除失败，请重试');
  }
}

onMounted(loadComments);
</script>
