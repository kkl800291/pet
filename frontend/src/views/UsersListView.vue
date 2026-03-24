<template>
  <AdminLayout title="用户管理" subtitle="聚焦账号状态、注册分层与风险处置，保留封禁交互" breadcrumb="用户管理" search-placeholder="搜索用户 ID 或昵称...">
    <template #actions>
      <button class="flex items-center gap-2 rounded-full bg-surface-container-lowest px-6 py-3 font-bold text-primary shadow-sm transition-all hover:bg-primary-container/10" @click="exportUsers">
        <span class="material-symbols-outlined">download</span>
        导出数据
      </button>
      <button class="flex items-center gap-2 rounded-full bg-primary px-6 py-3 font-bold text-on-primary shadow-lg shadow-primary/20" @click="loadUsers">
        <span class="material-symbols-outlined">refresh</span>
        刷新
      </button>
    </template>

    <div class="mb-8 grid grid-cols-1 gap-6 md:grid-cols-4">
      <AdminStatCard label="总用户数" :value="users.length" tone="primary" />
      <AdminStatCard label="正常账号" :value="activeCount" />
      <AdminStatCard label="封禁账号" :value="bannedCount" tone="danger" />
      <AdminStatCard label="筛选结果" :value="filteredUsers.length" />
    </div>

    <div class="mb-6 grid grid-cols-1 gap-4 rounded-[1.75rem] bg-surface-container-low p-4 lg:grid-cols-4">
      <div>
        <label class="mb-1.5 ml-1 block text-xs font-semibold text-slate-500">用户状态</label>
        <select v-model="statusFilter" class="w-full rounded-xl border-none bg-surface-container-lowest px-4 py-3 text-sm shadow-sm">
          <option value="">全部状态</option>
          <option value="active">正常</option>
          <option value="banned">封禁</option>
        </select>
      </div>
      <div class="lg:col-span-3">
        <label class="mb-1.5 ml-1 block text-xs font-semibold text-slate-500">搜索关键词</label>
        <input v-model.trim="query" class="w-full rounded-xl border-none bg-surface-container-lowest px-4 py-3 text-sm shadow-sm" placeholder="姓名 / 手机号" />
      </div>
    </div>

    <AdminDataTable :columns="columns" :has-rows="Boolean(filteredUsers.length)" empty-text="暂无用户数据">
      <tr v-for="user in filteredUsers" :key="user.id" class="transition-colors hover:bg-primary/5">
              <td class="px-8 py-5 font-mono text-sm text-slate-400">#{{ user.id.slice(-6).toUpperCase() }}</td>
              <td class="px-8 py-5">
                <div class="flex items-center gap-3">
                  <div class="flex h-10 w-10 items-center justify-center rounded-full bg-[#E0F7FA] text-xs font-bold text-primary">{{ user.name?.slice(0, 1) || 'U' }}</div>
                  <div>
                    <p class="font-bold text-on-surface">{{ user.name }}</p>
                    <p class="text-xs text-slate-400">{{ user.id }}</p>
                  </div>
                </div>
              </td>
              <td class="px-8 py-5 text-sm font-medium text-on-surface-variant">{{ user.phone }}</td>
              <td class="px-8 py-5">
                <span class="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold" :class="user.status === 'banned' ? 'bg-error/10 text-error' : 'bg-primary-container/20 text-primary'">
                  {{ labelOf(OWNER_STATUS, user.status) }}
                </span>
              </td>
              <td class="px-8 py-5 text-sm text-slate-500">{{ formatDate(user.createdAt) }}</td>
              <td class="px-8 py-5 text-right">
                <AdminTableActions :actions="actionsFor(user)" />
              </td>
      </tr>
    </AdminDataTable>
  </AdminLayout>

  <ActionReasonModal
    :open="Boolean(pendingUser)"
    :title="pendingUser?.status === 'banned' ? '填写解封原因' : '填写封禁原因'"
    :description="pendingUser ? `用户：${pendingUser.name}\n手机号：${pendingUser.phone}\n该原因会写入审计日志，并用于后续展示。` : ''"
    :reason="actionReason"
    :confirm-text="pendingUser?.status === 'banned' ? '确认解封' : '确认封禁'"
    icon="gavel"
    tone="danger"
    @close="closeReasonModal"
    @confirm="confirmToggleBan"
    @update:reason="actionReason = $event"
  />

  <CommonModal
    :open="feedbackOpen"
    title="操作已完成"
    :description="feedbackText"
    confirm-text="知道了"
    icon="check_circle"
    tone="success"
    :show-cancel="false"
    @close="feedbackOpen = false"
    @confirm="feedbackOpen = false"
  />
</template>

<script setup>
import { computed, onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import AdminLayout from '../layouts/AdminLayout.vue';
import AdminDataTable from '../components/AdminDataTable.vue';
import AdminStatCard from '../components/AdminStatCard.vue';
import AdminTableActions from '../components/AdminTableActions.vue';
import ActionReasonModal from '../components/ActionReasonModal.vue';
import CommonModal from '../components/CommonModal.vue';
import { adminApi } from '../api/admin';
import { OWNER_STATUS, formatDate, labelOf } from '../assets/labels';

const router = useRouter();
const users = ref([]);
const query = ref('');
const statusFilter = ref('');
const pendingUser = ref(null);
const actionReason = ref('');
const feedbackOpen = ref(false);
const feedbackText = ref('');

const columns = [
  { key: 'id', label: '用户ID' },
  { key: 'profile', label: '用户详情' },
  { key: 'phone', label: '手机号' },
  { key: 'status', label: '状态' },
  { key: 'createdAt', label: '注册时间' },
  { key: 'actions', label: '操作', align: 'right' }
];

const filteredUsers = computed(() => users.value.filter((u) => {
  const passStatus = statusFilter.value ? u.status === statusFilter.value : true;
  const passText = `${u.name} ${u.phone}`.toLowerCase().includes(query.value.toLowerCase());
  return passStatus && passText;
}));

const activeCount = computed(() => users.value.filter((u) => u.status === 'active').length);
const bannedCount = computed(() => users.value.filter((u) => u.status === 'banned').length);

async function loadUsers() {
  const data = await adminApi.users();
  users.value = data.items || [];
}

function exportUsers() {
  const headers = ['用户ID', '姓名', '手机号', '状态', '注册时间'];
  const rows = filteredUsers.value.map((user) => [
    user.id,
    user.name,
    user.phone,
    labelOf(OWNER_STATUS, user.status),
    formatDate(user.createdAt)
  ]);
  const csv = [headers, ...rows]
    .map((row) => row.map((cell) => `"${String(cell ?? '').replaceAll('"', '""')}"`).join(','))
    .join('\n');

  const blob = new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `users-${new Date().toISOString().slice(0, 10)}.csv`;
  link.click();
  URL.revokeObjectURL(link.href);
}

function openDetail(id) {
  router.push(`/users/detail?id=${id}`);
}

function toggleBan(user) {
  pendingUser.value = user;
  actionReason.value = '';
}

function actionsFor(user) {
  return [
    { label: '详情', icon: 'visibility', tone: 'primary', onClick: () => openDetail(user.id) },
    {
      label: user.status === 'banned' ? '解封' : '封禁',
      icon: user.status === 'banned' ? 'check_circle' : 'block',
      tone: user.status === 'banned' ? 'primary' : 'danger',
      onClick: () => toggleBan(user)
    }
  ];
}

async function confirmToggleBan() {
  if (!pendingUser.value) return;
  const user = pendingUser.value;
  pendingUser.value = null;
  if (user.status === 'banned') {
    await adminApi.unbanOwner(user.id, actionReason.value);
    feedbackText.value = `用户 ${user.name} 已解封。`;
  } else {
    await adminApi.banOwner(user.id, actionReason.value);
    feedbackText.value = `用户 ${user.name} 已封禁。`;
  }
  actionReason.value = '';
  await loadUsers();
  feedbackOpen.value = true;
}

function closeReasonModal() {
  pendingUser.value = null;
  actionReason.value = '';
}

onMounted(loadUsers);
</script>
