<template>
  <AdminLayout title="风控记录详情" subtitle="围绕审计日志展开基础信息、时间线、执行人和风险评估四个区块" breadcrumb="风控详情" search-placeholder="搜索审计ID...">
    <div v-if="item" class="space-y-6">
      <AdminBackButton @click="goList" />

      <div class="grid grid-cols-1 gap-6 xl:grid-cols-12">
        <section class="space-y-6 xl:col-span-8">
        <article class="rounded-3xl bg-surface-container-lowest p-6 shadow-sm">
          <div class="mb-6 flex items-center gap-3">
            <div class="h-4 w-1 rounded-full bg-primary"></div>
            <h3 class="text-sm font-bold text-on-surface">基础信息</h3>
          </div>
          <div class="grid grid-cols-1 gap-x-12 gap-y-6 md:grid-cols-2">
            <div>
              <p class="text-xs uppercase tracking-widest text-slate-400">动作</p>
              <p class="mt-2 text-sm font-bold">{{ labelOf(AUDIT_ACTION, item.action) }}</p>
            </div>
            <div>
              <p class="text-xs uppercase tracking-widest text-slate-400">目标对象</p>
              <p class="mt-2 text-sm font-bold">{{ labelOf(TARGET_TYPE, item.targetType) }}</p>
            </div>
            <div>
              <p class="text-xs uppercase tracking-widest text-slate-400">执行人</p>
              <p class="mt-2 text-sm font-bold">{{ labelOf(ACTOR_TYPE, item.actorType) }} · {{ item.actorId }}</p>
            </div>
            <div>
              <p class="text-xs uppercase tracking-widest text-slate-400">记录时间</p>
              <p class="mt-2 text-sm font-bold">{{ formatDate(item.createdAt) }}</p>
            </div>
          </div>
          <div class="mt-6 flex items-center gap-2 rounded-xl bg-surface p-3">
            <span class="material-symbols-outlined text-primary">tag</span>
            <span class="text-sm text-on-surface-variant">记录ID：{{ item.id }}</span>
          </div>
        </article>

        <article class="rounded-3xl bg-surface-container-lowest p-6 shadow-sm">
          <div class="mb-6 flex items-center gap-3">
            <div class="h-4 w-1 rounded-full bg-primary"></div>
            <h3 class="text-sm font-bold text-on-surface">审计时序</h3>
          </div>
          <div class="space-y-5">
            <div v-for="(step, index) in timeline" :key="step.title" class="flex gap-4">
              <div class="flex flex-col items-center">
                <div class="flex h-10 w-10 items-center justify-center rounded-full shadow-sm" :class="index === 0 ? 'bg-primary-container text-primary' : index === timeline.length - 1 ? 'bg-emerald-500 text-white' : 'bg-surface-container text-outline'">
                  <span class="material-symbols-outlined text-lg">{{ step.icon }}</span>
                </div>
                <div v-if="index !== timeline.length - 1" class="mt-2 h-8 w-px bg-surface-container-high"></div>
              </div>
              <div class="pt-1">
                <p class="text-sm font-semibold">{{ step.title }}</p>
                <p class="mt-1 text-xs text-on-surface-variant">{{ step.desc }}</p>
              </div>
            </div>
          </div>
        </article>
        </section>

        <aside class="space-y-6 xl:col-span-4">
        <article class="rounded-3xl bg-surface-container-lowest p-6 shadow-sm">
          <div class="mb-6 flex items-center gap-3">
            <div class="h-4 w-1 rounded-full bg-primary"></div>
            <h3 class="text-sm font-bold text-on-surface">执行人</h3>
          </div>
          <div class="flex items-center gap-4">
            <div class="flex h-16 w-16 items-center justify-center rounded-2xl border-2 border-primary-container bg-slate-100 text-lg font-bold text-primary">
              {{ item.actorId?.slice(0, 1).toUpperCase() || 'A' }}
            </div>
            <div>
              <p class="font-bold">{{ labelOf(ACTOR_TYPE, item.actorType) }} {{ item.actorId }}</p>
              <span class="rounded-full bg-secondary-container px-2 py-0.5 text-[10px] font-bold text-on-secondary-container">{{ labelOf(ACTOR_TYPE, item.actorType) }}</span>
              <p class="mt-2 text-xs font-semibold">{{ formatDate(item.createdAt) }}</p>
            </div>
          </div>
        </article>

        <article class="relative overflow-hidden rounded-3xl bg-primary p-6 text-on-primary shadow-xl">
          <div class="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-white/10 blur-2xl"></div>
          <div class="mb-4 flex items-center gap-3">
            <div class="h-4 w-1 rounded-full bg-primary-container"></div>
            <h3 class="text-sm font-bold text-white">记录摘要</h3>
          </div>
          <div class="rounded-2xl border border-white/10 bg-white/10 p-4 backdrop-blur-md">
            <p class="text-[10px] uppercase tracking-widest text-white/60">动作摘要</p>
            <p class="mt-2 text-2xl font-bold">{{ labelOf(AUDIT_ACTION, item.action) }}</p>
          </div>
          <div class="mt-4 space-y-3">
            <div class="flex items-center justify-between rounded-xl bg-white/5 p-3">
              <span class="text-sm">目标 ID</span>
              <span class="text-sm font-bold">{{ item.targetId }}</span>
            </div>
            <div class="flex items-center justify-between rounded-xl bg-white/5 p-3">
              <span class="text-sm">详情内容</span>
              <span class="text-sm font-bold">{{ item.detail ? '已记录' : '无备注' }}</span>
            </div>
          </div>
        </article>

        <article class="rounded-3xl border-2 border-dashed border-surface-container-high bg-surface-container-low p-6">
          <h3 class="mb-4 text-sm font-bold text-on-surface">审计详情</h3>
          <div class="rounded-xl bg-surface-container-lowest p-4 text-sm leading-7 text-on-surface-variant">
            {{ item.detail || '该记录没有额外备注。' }}
          </div>
        </article>
        </aside>
      </div>
    </div>

    <div v-else class="rounded-2xl border border-outline-variant/10 bg-surface-container-lowest p-12 text-center text-slate-400">未找到记录</div>
  </AdminLayout>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import AdminLayout from '../layouts/AdminLayout.vue';
import AdminBackButton from '../components/AdminBackButton.vue';
import { adminApi } from '../api/admin';
import { ACTOR_TYPE, AUDIT_ACTION, TARGET_TYPE, formatDate, labelOf } from '../assets/labels';

const route = useRoute();
const router = useRouter();
const audit = ref(null);

const item = computed(() => audit.value);

const timeline = computed(() => {
  if (!item.value) return [];
  return [
    { icon: 'draft', title: '动作产生', desc: `${labelOf(AUDIT_ACTION, item.value.action)} 被系统捕获并入队。` },
    { icon: 'history', title: '日志写入', desc: `目标 ${item.value.targetId} 已完成审计落库。` },
    { icon: 'policy', title: '风控回溯', desc: `已关联 ${labelOf(TARGET_TYPE, item.value.targetType)} 上下文。` },
    { icon: 'done_all', title: '记录完成', desc: `于 ${formatDate(item.value.createdAt)} 完成追踪。` }
  ];
});

async function loadData() {
  const id = String(route.query.id || '');
  if (!id) {
    audit.value = null;
    return;
  }
  try {
    const data = await adminApi.auditDetail(id);
    audit.value = data.audit || null;
  } catch (error) {
    if (error.message === 'not_found') {
      audit.value = null;
      return;
    }
    throw error;
  }
}

function goList() {
  router.push('/audits/list');
}

onMounted(loadData);
</script>
