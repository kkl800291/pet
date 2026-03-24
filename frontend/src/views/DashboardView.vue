<template>
  <AdminLayout title="概览" subtitle="社区核心指标一览，快速进入待处理工作" breadcrumb="概览">
    <div class="mb-8 grid grid-cols-1 gap-4 md:grid-cols-5">
      <AdminStatCard label="注册用户" :value="stats.owners ?? '-'" hint="累计注册主人数" tone="primary" />
      <AdminStatCard label="宠物档案" :value="stats.pets ?? '-'" hint="已创建的宠物档案总数" />
      <AdminStatCard label="待审帖子" :value="stats.pendingPosts ?? '-'" hint="等待人工审核的内容" tone="primary" />
      <AdminStatCard label="待处理举报" :value="stats.openReports ?? '-'" hint="未解决的举报记录" tone="danger" />
      <AdminStatCard label="审计日志" :value="stats.auditLogs ?? '-'" hint="累计管理员操作记录" tone="solid" />
    </div>

    <div class="grid grid-cols-1 gap-6 lg:grid-cols-2">
      <div class="rounded-[1.75rem] bg-white p-6 shadow-sm shadow-slate-200/60">
        <div class="mb-5 flex items-center gap-3">
          <div class="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10">
            <span class="material-symbols-outlined text-primary">fact_check</span>
          </div>
          <div>
            <h3 class="text-base font-bold text-on-surface">内容审核</h3>
            <p class="text-xs text-on-surface-variant">当前有 {{ stats.pendingPosts ?? 0 }} 条内容等待审核</p>
          </div>
        </div>
        <div class="flex items-center justify-between rounded-2xl bg-surface-container-low px-5 py-4">
          <span class="text-sm text-on-surface-variant">待审队列</span>
          <RouterLink
            to="/review/list?status=pending"
            class="flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2 text-sm font-bold text-on-primary shadow-sm shadow-primary/20 transition-all hover:brightness-105 active:scale-95"
          >
            <span class="material-symbols-outlined text-base">arrow_forward</span>
            去审核
          </RouterLink>
        </div>
      </div>

      <div class="rounded-[1.75rem] bg-white p-6 shadow-sm shadow-slate-200/60">
        <div class="mb-5 flex items-center gap-3">
          <div class="flex h-10 w-10 items-center justify-center rounded-2xl bg-error/10">
            <span class="material-symbols-outlined text-error">report</span>
          </div>
          <div>
            <h3 class="text-base font-bold text-on-surface">举报处理</h3>
            <p class="text-xs text-on-surface-variant">当前有 {{ stats.openReports ?? 0 }} 条举报待处理</p>
          </div>
        </div>
        <div class="flex items-center justify-between rounded-2xl bg-surface-container-low px-5 py-4">
          <span class="text-sm text-on-surface-variant">待处理举报</span>
          <RouterLink
            to="/reports/list"
            class="flex items-center gap-1.5 rounded-xl bg-error px-4 py-2 text-sm font-bold text-white shadow-sm shadow-error/20 transition-all hover:brightness-105 active:scale-95"
          >
            <span class="material-symbols-outlined text-base">arrow_forward</span>
            去处理
          </RouterLink>
        </div>
      </div>

      <div class="rounded-[1.75rem] bg-white p-6 shadow-sm shadow-slate-200/60">
        <div class="mb-5 flex items-center gap-3">
          <div class="flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-100">
            <span class="material-symbols-outlined text-slate-500">group</span>
          </div>
          <div>
            <h3 class="text-base font-bold text-on-surface">用户管理</h3>
            <p class="text-xs text-on-surface-variant">共 {{ stats.owners ?? 0 }} 位注册主人</p>
          </div>
        </div>
        <div class="flex items-center justify-between rounded-2xl bg-surface-container-low px-5 py-4">
          <span class="text-sm text-on-surface-variant">用户列表</span>
          <RouterLink
            to="/users/list"
            class="flex items-center gap-1.5 rounded-xl border border-outline-variant/20 bg-white px-4 py-2 text-sm font-bold text-on-surface shadow-sm transition-all hover:bg-slate-50 active:scale-95"
          >
            <span class="material-symbols-outlined text-base">arrow_forward</span>
            查看
          </RouterLink>
        </div>
      </div>

      <div class="rounded-[1.75rem] bg-white p-6 shadow-sm shadow-slate-200/60">
        <div class="mb-5 flex items-center gap-3">
          <div class="flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-100">
            <span class="material-symbols-outlined text-slate-500">security</span>
          </div>
          <div>
            <h3 class="text-base font-bold text-on-surface">风控记录</h3>
            <p class="text-xs text-on-surface-variant">累计 {{ stats.auditLogs ?? 0 }} 条操作日志</p>
          </div>
        </div>
        <div class="flex items-center justify-between rounded-2xl bg-surface-container-low px-5 py-4">
          <span class="text-sm text-on-surface-variant">审计日志</span>
          <RouterLink
            to="/audits/list"
            class="flex items-center gap-1.5 rounded-xl border border-outline-variant/20 bg-white px-4 py-2 text-sm font-bold text-on-surface shadow-sm transition-all hover:bg-slate-50 active:scale-95"
          >
            <span class="material-symbols-outlined text-base">arrow_forward</span>
            查看
          </RouterLink>
        </div>
      </div>
    </div>
  </AdminLayout>
</template>

<script setup>
import { onMounted, ref } from 'vue';
import { RouterLink } from 'vue-router';
import AdminLayout from '../layouts/AdminLayout.vue';
import AdminStatCard from '../components/AdminStatCard.vue';
import { adminApi } from '../api/admin';

const stats = ref({});

async function loadStats() {
  const data = await adminApi.dashboard();
  stats.value = data;
}

onMounted(loadStats);
</script>
