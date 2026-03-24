<template>
  <AdminLayout title="用户详情" subtitle="查看账号档案、关联宠物、内容状态和风险记录" breadcrumb="用户详情" search-placeholder="搜索用户...">
    <template #actions>
      <AdminActionButton :label="item?.status === 'banned' ? '解封用户' : '封禁用户'" icon="block" tone="danger" :disabled="!item" @click="openToggleBan" />
    </template>

    <div v-if="item" class="space-y-6">
      <AdminBackButton @click="goList" />

      <div class="grid grid-cols-1 gap-6 xl:grid-cols-12">
        <section class="space-y-6 xl:col-span-8">
        <article class="relative flex flex-col gap-6 overflow-hidden rounded-3xl bg-surface-container-lowest p-6 shadow-sm md:flex-row md:items-start md:gap-8">
          <div class="absolute right-0 top-0 h-32 w-32 rounded-bl-full bg-primary/5"></div>
          <div class="relative">
            <div class="flex h-32 w-32 items-center justify-center overflow-hidden rounded-2xl bg-primary-container/25 text-4xl font-bold text-primary ring-4 ring-primary-container/20">
              {{ item.name?.slice(0, 1) || 'U' }}
            </div>
          </div>
          <div class="relative flex-1">
            <h2 class="mb-1 text-2xl font-bold tracking-tight">{{ item.name }} <span class="ml-2 text-sm font-medium text-outline">UID: {{ item.id.slice(-8) }}</span></h2>
            <div class="mb-4 flex flex-wrap items-center gap-2">
              <span class="inline-flex items-center rounded-full bg-primary-container px-2.5 py-0.5 text-[10px] font-bold text-on-primary-container">{{ labelOf(OWNER_STATUS, item.status) }}</span>
            </div>
            <div class="grid grid-cols-1 gap-x-8 gap-y-3 md:grid-cols-2">
              <div>
                <p class="text-xs uppercase tracking-widest text-slate-400">手机号</p>
                <p class="mt-1 text-sm font-semibold">{{ item.phone }}</p>
              </div>
              <div>
                <p class="text-xs uppercase tracking-widest text-slate-400">注册时间</p>
                <p class="mt-1 text-sm font-semibold">{{ formatDate(item.createdAt) }}</p>
              </div>
              <div>
                <p class="text-xs uppercase tracking-widest text-slate-400">关联宠物</p>
                <p class="mt-1 text-sm font-semibold">{{ petCount }} 只</p>
              </div>
              <div>
                <p class="text-xs uppercase tracking-widest text-slate-400">社区动态</p>
                <p class="mt-1 text-sm font-semibold">{{ postCount }} 条</p>
              </div>
            </div>
          </div>
        </article>

        <div class="grid grid-cols-1 gap-6 md:grid-cols-5">
          <AdminStatCard label="发帖总数" :value="postCount" />
          <AdminStatCard label="待审内容" :value="pendingPostCount" tone="primary" />
          <AdminStatCard label="已通过" :value="approvedPostCount" />
          <AdminStatCard label="驳回次数" :value="rejectedPostCount" tone="danger" />
          <AdminStatCard label="警告次数" :value="warningCount" tone="danger" />
        </div>

        <div class="grid grid-cols-1 gap-6 xl:grid-cols-2">
          <article class="overflow-hidden rounded-3xl bg-surface-container-lowest shadow-sm">
            <div class="flex items-center justify-between border-b border-surface-container px-6 py-4">
              <h3 class="text-sm font-bold text-on-surface">关联宠物列表 ({{ relatedPets.length }})</h3>
              <button class="text-xs font-bold text-primary hover:underline" @click="router.push(`/pets/list`)">查看列表</button>
            </div>
            <table class="w-full text-left">
              <tbody>
                <tr v-for="pet in relatedPets.slice(0, 4)" :key="pet.id" class="group border-t border-surface-container transition-colors hover:bg-primary/5">
                  <td class="px-6 py-4">
                    <div class="flex items-center gap-3">
                      <div class="flex h-8 w-8 items-center justify-center overflow-hidden rounded-full bg-primary-container text-[10px] font-bold text-primary">
                        {{ pet.name?.slice(0, 1) || 'P' }}
                      </div>
                      <div>
                        <p class="text-sm font-semibold">{{ pet.name }}</p>
                        <p class="text-xs text-on-surface-variant">{{ pet.species }} · {{ pet.breed || '未知品种' }}</p>
                      </div>
                    </div>
                  </td>
                  <td class="px-6 py-4 text-right">
                    <button class="text-[11px] font-bold text-primary transition-opacity group-hover:opacity-100" @click="router.push(`/pets/detail?id=${pet.id}`)">详情</button>
                  </td>
                </tr>
                <tr v-if="!relatedPets.length">
                  <td class="px-6 py-8 text-center text-slate-400">暂无关联宠物</td>
                </tr>
              </tbody>
            </table>
          </article>

          <article class="overflow-hidden rounded-3xl bg-surface-container-lowest shadow-sm">
            <div class="flex items-center justify-between border-b border-surface-container px-6 py-4">
              <h3 class="text-sm font-bold text-on-surface">最近社区动态</h3>
              <span class="flex items-center gap-2 text-xs text-on-surface-variant"><span class="h-2 w-2 rounded-full bg-emerald-500"></span>{{ relatedPosts.length }} 条记录</span>
            </div>
            <table class="w-full text-left">
              <tbody>
                <tr v-for="post in relatedPosts.slice(0, 4)" :key="post.id" class="border-t border-surface-container transition-colors hover:bg-primary/5">
                  <td class="px-6 py-4">
                    <p class="max-w-[300px] truncate text-sm font-semibold">{{ post.title }}</p>
                    <p class="mt-1 text-xs text-on-surface-variant">{{ formatDate(post.createdAt) }}</p>
                  </td>
                  <td class="px-6 py-4 text-right">
                    <span class="rounded px-2 py-0.5 text-[10px] font-bold" :class="post.status === 'approved' ? 'bg-emerald-50 text-emerald-600' : post.status === 'pending' ? 'bg-blue-50 text-blue-600' : 'bg-amber-50 text-amber-600'">
                      {{ labelOf({ approved: '已发布', pending: '待审核', rejected: '已驳回' }, post.status) }}
                    </span>
                    <button class="ml-3 rounded-full bg-primary/5 px-3 py-1 text-[11px] font-bold text-primary hover:bg-primary/10" @click="router.push(`/review/detail?id=${post.id}`)">查看审核</button>
                  </td>
                </tr>
                <tr v-if="!relatedPosts.length">
                  <td class="px-6 py-8 text-center text-slate-400">暂无社区动态</td>
                </tr>
              </tbody>
            </table>
          </article>
        </div>
        </section>

        <aside class="space-y-6 xl:col-span-4">
        <article class="rounded-3xl bg-surface-container-lowest p-6 shadow-sm">
          <h3 class="mb-4 flex items-center gap-2 text-sm font-bold"><span class="material-symbols-outlined text-primary">bolt</span>快捷操作</h3>
          <div class="space-y-3">
            <AdminActionButton label="查看待审内容" icon="fact_check" full-width @click="router.push('/review/list')" />
            <AdminActionButton label="查看宠物档案" icon="pets" tone="neutral" full-width @click="router.push('/pets/list')" />
            <AdminActionButton :label="item.status === 'banned' ? '恢复账号' : '封禁账号'" icon="gavel" tone="danger" full-width @click="openToggleBan" />
          </div>
        </article>

        <article class="overflow-hidden rounded-3xl bg-surface-container-lowest shadow-sm">
          <div class="flex items-center justify-between border-b border-surface-container px-6 py-4">
            <h3 class="text-sm font-bold text-on-surface">警告记录</h3>
            <span class="rounded bg-amber-50 px-2 py-0.5 text-[10px] font-black text-amber-700">累计 {{ warningCount }} 次</span>
          </div>
          <table class="w-full text-left">
            <tbody>
              <tr v-for="warning in userWarnings.slice(0, 4)" :key="warning.id" class="border-t border-surface-container transition-colors hover:bg-primary/5">
                <td class="px-6 py-4">
                  <p class="text-sm font-semibold">{{ warning.reason || '管理员警告' }}</p>
                  <p class="mt-1 text-xs text-on-surface-variant">{{ formatDate(warning.createdAt) }}</p>
                </td>
                <td class="px-6 py-4 text-right text-xs text-on-surface-variant">
                  {{ warning.adminId || warning.reportId }}
                </td>
              </tr>
              <tr v-if="!userWarnings.length">
                <td class="px-6 py-8 text-center text-slate-400">暂无警告记录</td>
              </tr>
            </tbody>
          </table>
        </article>

        <article class="overflow-hidden rounded-3xl bg-surface-container-lowest shadow-sm">
          <div class="flex items-center justify-between border-b border-surface-container px-6 py-4">
            <h3 class="text-sm font-bold text-on-surface">风险控制记录摘要</h3>
            <span class="rounded bg-red-50 px-2 py-0.5 text-[10px] font-black text-error">审计记录 {{ userAudits.length }} 条</span>
          </div>
          <table class="w-full text-left">
            <tbody>
              <tr v-for="audit in userAudits.slice(0, 4)" :key="audit.id" class="border-t border-surface-container transition-colors hover:bg-primary/5">
                <td class="px-6 py-4">
                  <p class="text-sm font-semibold">{{ labelOf(AUDIT_ACTION, audit.action) }}</p>
                  <p class="mt-1 text-xs text-on-surface-variant">{{ formatDate(audit.createdAt) }}</p>
                </td>
                <td class="px-6 py-4 text-right text-xs text-on-surface-variant">{{ audit.detail || audit.targetId }}</td>
              </tr>
              <tr v-if="!userAudits.length">
                <td class="px-6 py-8 text-center text-slate-400">暂无风险记录</td>
              </tr>
            </tbody>
          </table>
        </article>
        </aside>
      </div>
    </div>
    <div v-else class="rounded-2xl border border-outline-variant/10 bg-surface-container-lowest p-12 text-center text-slate-400">未找到用户</div>

    <ActionReasonModal
      :open="confirmOpen"
      :title="item?.status === 'banned' ? '填写解封原因' : '填写封禁原因'"
      :description="item ? `用户：${item.name}\n手机号：${item.phone}\n该原因会写入审计日志，并用于后续展示。` : ''"
      :reason="actionReason"
      :confirm-text="item?.status === 'banned' ? '确认解封' : '确认封禁'"
      icon="gavel"
      tone="danger"
      @close="closeReasonModal"
      @confirm="toggleBan"
      @update:reason="actionReason = $event"
    />

  </AdminLayout>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import AdminLayout from '../layouts/AdminLayout.vue';
import AdminActionButton from '../components/AdminActionButton.vue';
import AdminBackButton from '../components/AdminBackButton.vue';
import AdminStatCard from '../components/AdminStatCard.vue';
import ActionReasonModal from '../components/ActionReasonModal.vue';
import { adminApi } from '../api/admin';
import { AUDIT_ACTION, OWNER_STATUS, formatDate, labelOf } from '../assets/labels';
import { useToast } from '../composables/useToast';

const { success, error: showError } = useToast();

const route = useRoute();
const router = useRouter();
const owner = ref(null);
const pets = ref([]);
const posts = ref([]);
const audits = ref([]);
const warnings = ref([]);
const confirmOpen = ref(false);
const actionReason = ref('');

const item = computed(() => owner.value);

const relatedPets = computed(() => item.value ? pets.value.filter((p) => p.ownerId === item.value.id) : []);
const relatedPosts = computed(() => item.value ? posts.value.filter((p) => p.ownerId === item.value.id) : []);
const userAudits = computed(() => item.value ? audits.value.filter((a) => a.targetId === item.value.id || a.actorId === item.value.id) : []);
const userWarnings = computed(() => warnings.value);
const petCount = computed(() => relatedPets.value.length);
const postCount = computed(() => relatedPosts.value.length);
const pendingPostCount = computed(() => relatedPosts.value.filter((p) => p.status === 'pending').length);
const approvedPostCount = computed(() => relatedPosts.value.filter((p) => p.status === 'approved').length);
const rejectedPostCount = computed(() => relatedPosts.value.filter((p) => p.status === 'rejected').length);
const warningCount = computed(() => userWarnings.value.length);

async function loadData() {
  const id = String(route.query.id || '');
  if (!id) {
    owner.value = null;
    pets.value = [];
    posts.value = [];
    audits.value = [];
    warnings.value = [];
    return;
  }
  try {
    const data = await adminApi.userDetail(id);
    owner.value = data.owner || null;
    pets.value = data.pets || [];
    posts.value = data.posts || [];
    audits.value = data.audits || [];
    warnings.value = data.warnings || [];
  } catch (error) {
    if (error.message === 'not_found') {
      owner.value = null;
      pets.value = [];
      posts.value = [];
      audits.value = [];
      warnings.value = [];
      return;
    }
    throw error;
  }
}

function openToggleBan() {
  if (!item.value) return;
  confirmOpen.value = true;
  actionReason.value = '';
}

async function toggleBan() {
  if (!item.value) return;
  const currentName = item.value.name;
  const banned = item.value.status === 'banned';
  confirmOpen.value = false;
  try {
    if (banned) {
      await adminApi.unbanOwner(item.value.id, actionReason.value);
      success(`用户 ${currentName} 已解封`);
    } else {
      await adminApi.banOwner(item.value.id, actionReason.value);
      success(`用户 ${currentName} 已封禁`);
    }
  } catch {
    showError('操作失败，请重试');
  }
  actionReason.value = '';
  await loadData();
}

function closeReasonModal() {
  confirmOpen.value = false;
  actionReason.value = '';
}

function goList() {
  router.push('/users/list');
}

onMounted(loadData);
</script>
