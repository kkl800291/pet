<template>
  <aside class="fixed left-0 top-0 z-40 flex h-full w-64 flex-col border-r border-white/70 bg-slate-50/95 p-5 font-['Plus_Jakarta_Sans'] text-sm font-medium text-on-surface backdrop-blur-xl">
    <div class="mb-8 flex items-center gap-3 px-3 py-2">
      <div class="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary text-on-primary shadow-lg shadow-primary/15">
        <span class="material-symbols-outlined">pets</span>
      </div>
      <div>
        <h1 class="text-lg font-bold leading-none text-primary">宠社管理系统</h1>
        <p class="mt-1 text-[10px] uppercase tracking-[0.24em] text-slate-400">v3.0 专业版</p>
      </div>
    </div>

    <nav class="flex-1 space-y-1">
      <RouterLink
        v-for="item in navItems"
        :key="item.to"
        :to="item.to"
        class="flex items-center gap-3 rounded-2xl px-4 py-3 transition-all duration-200"
        :class="isActive(item) ? 'bg-primary-container/25 text-primary font-semibold shadow-sm shadow-primary/5' : 'text-slate-500 hover:bg-white hover:text-primary'"
      >
        <span class="material-symbols-outlined" :style="isActive(item) ? `font-variation-settings: 'FILL' 1` : ''">{{ item.icon }}</span>
        <span>{{ item.label }}</span>
      </RouterLink>
    </nav>

    <div class="mt-6 rounded-[1.75rem] border border-white/80 bg-white/80 p-4 shadow-sm shadow-slate-200/50">
      <div class="flex items-center gap-3">
        <div class="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full border border-primary/10 bg-primary-container/30 text-xs font-bold text-primary">
          {{ session.admin?.name?.slice(0, 1) || 'A' }}
        </div>
        <div class="min-w-0 flex-1">
          <p class="truncate text-xs font-bold text-on-surface">{{ session.admin?.name || 'Admin' }}</p>
          <p class="truncate text-[10px] text-slate-400">{{ session.admin?.email || '未登录' }}</p>
        </div>
      </div>
      <div class="mt-4 flex items-center justify-between rounded-2xl bg-surface-container-low px-3 py-2">
        <span class="text-[11px] font-semibold text-on-surface-variant">{{ session.isAuthed ? '已登录后台' : '未登录' }}</span>
        <button class="inline-flex items-center gap-1 rounded-full px-2 py-1 text-[11px] font-semibold text-slate-500 transition-colors hover:bg-white hover:text-error" @click="onLogout">
          <span class="material-symbols-outlined text-base">logout</span>
          退出
        </button>
      </div>
    </div>
  </aside>

  <header class="fixed left-64 right-0 top-0 z-30 flex h-[88px] items-center justify-between border-b border-white/80 bg-white/88 px-8 backdrop-blur-xl">
    <div>
      <nav class="flex items-center gap-3 text-sm">
        <span class="text-slate-400">首页</span>
        <span class="text-slate-300">/</span>
        <span class="font-semibold text-slate-500">{{ breadcrumb || title }}</span>
      </nav>
      <div class="mt-3 flex items-center gap-3">
        <div class="rounded-full bg-surface-container-low px-4 py-2 text-sm text-on-surface-variant">
          {{ searchPlaceholder || '当前模块概览' }}
        </div>
        <span class="inline-flex items-center gap-2 rounded-full bg-primary/8 px-3 py-1.5 text-xs font-semibold text-primary">
          <span class="h-2 w-2 rounded-full bg-emerald-500"></span>
          {{ session.isAuthed ? '后台连接正常' : '等待登录' }}
        </span>
      </div>
    </div>

    <div class="flex items-center gap-3 rounded-full border border-slate-100 bg-white px-3 py-2 shadow-sm">
      <div class="h-9 w-9 overflow-hidden rounded-full ring-2 ring-primary/10">
        <div class="flex h-full w-full items-center justify-center bg-primary-container/30 text-sm font-bold text-primary">
          {{ session.admin?.name?.slice(0, 1) || 'A' }}
        </div>
      </div>
      <div class="min-w-0 pr-1">
        <p class="truncate text-sm font-semibold text-on-surface">{{ session.admin?.name || 'Admin' }}</p>
        <p class="truncate text-xs text-on-surface-variant">{{ session.admin?.email || '未登录' }}</p>
      </div>
    </div>
  </header>

  <main class="min-h-screen bg-background pb-12 pl-64 pt-28">
    <div class="mx-auto max-w-[1440px] px-8">
      <div class="mb-8 flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <h2 class="font-headline text-3xl font-extrabold tracking-tight text-on-surface">{{ title }}</h2>
          <p v-if="subtitle" class="mt-2 max-w-3xl text-sm leading-6 text-on-surface-variant">{{ subtitle }}</p>
        </div>
        <div class="flex flex-wrap items-center gap-3">
          <slot name="actions" />
        </div>
      </div>
      <slot />
    </div>
  </main>
</template>

<script setup>
import { useRoute, useRouter } from 'vue-router';
import { useSessionStore } from '../stores/session';

defineProps({
  title: { type: String, required: true },
  subtitle: { type: String, default: '' },
  breadcrumb: { type: String, default: '' },
  searchPlaceholder: { type: String, default: '' }
});

const navItems = [
  { to: '/review/list', label: '内容审核', icon: 'fact_check', section: 'review' },
  { to: '/reports/list', label: '举报处理', icon: 'report', section: 'reports' },
  { to: '/users/list', label: '用户管理', icon: 'group', section: 'users' },
  { to: '/pets/list', label: '宠物管理', icon: 'pets', section: 'pets' },
  { to: '/audits/list', label: '风控记录', icon: 'security', section: 'audits' },
  { to: '/settings/list', label: '基础配置', icon: 'settings', section: 'settings' }
];

const route = useRoute();
const router = useRouter();
const session = useSessionStore();

function isActive(item) {
  return route.path.startsWith(`/${item.section}`);
}

async function onLogout() {
  await session.logout();
  router.replace('/login');
}
</script>
