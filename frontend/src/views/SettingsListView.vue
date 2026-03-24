<template>
  <AdminLayout title="基础配置" subtitle="按 Stitch 配置台布局拆成权限与可见性、审核模式、审计策略和同步状态四个区块" breadcrumb="基础配置" search-placeholder="搜索配置项...">
    <template #actions>
      <button class="rounded-2xl bg-emerald-50 px-5 py-2.5 text-sm font-semibold text-emerald-800 transition-all hover:bg-emerald-100 active:scale-95" @click="resetToDefaults">
        恢复默认
      </button>
      <button class="flex items-center gap-2 rounded-2xl bg-primary px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-emerald-900/10 transition-all hover:brightness-110 active:scale-95" :disabled="saving" @click="saveConfig">
        <span class="material-symbols-outlined">save</span>
        {{ saving ? '保存中...' : '保存配置' }}
      </button>
    </template>

    <div class="grid grid-cols-12 gap-6">
      <AdminPanel title="权限与可见性" subtitle="控制帖子默认可见范围和私聊规则。" icon="visibility" panel-class="col-span-12 flex flex-col gap-6 lg:col-span-4">
        <div class="rounded-2xl bg-slate-50 p-3">
          <div class="mb-3 flex items-center justify-between">
            <span class="text-sm font-medium text-slate-500">默认可见性</span>
            <span class="text-xs font-bold text-primary">{{ visibilityLabel }}</span>
          </div>
          <div class="flex rounded-xl border border-slate-100 bg-white p-1 shadow-inner">
            <button class="flex-1 rounded-lg px-4 py-1.5 text-xs font-bold whitespace-nowrap" :class="form.defaultPostVisibility === 'public' ? 'bg-primary text-white' : 'text-slate-500'" @click="form.defaultPostVisibility = 'public'">公开</button>
            <button class="flex-1 rounded-lg px-4 py-1.5 text-xs font-semibold whitespace-nowrap" :class="form.defaultPostVisibility === 'private' ? 'bg-primary text-white' : 'text-slate-500'" @click="form.defaultPostVisibility = 'private'">私密</button>
            <button class="flex-1 rounded-lg px-4 py-1.5 text-xs font-semibold whitespace-nowrap" :class="form.defaultPostVisibility === 'followers' ? 'bg-primary text-white' : 'text-slate-500'" @click="form.defaultPostVisibility = 'followers'">仅好友</button>
          </div>
        </div>

        <div class="grid grid-cols-3 gap-2">
          <button class="flex flex-col items-center gap-2 rounded-2xl border p-3 shadow-sm transition-all" :class="form.dmRule === 'open' ? 'border-emerald-100 bg-white' : 'border-transparent bg-slate-50 hover:border-emerald-200'" @click="form.dmRule = 'open'">
            <span class="material-symbols-outlined text-primary">forum</span>
            <span class="text-xs font-bold">开放私聊</span>
          </button>
          <button class="flex flex-col items-center gap-2 rounded-2xl border p-3 transition-all" :class="form.dmRule === 'comment_then_chat' ? 'border-emerald-100 bg-white' : 'border-transparent bg-slate-50 hover:border-emerald-200'" @click="form.dmRule = 'comment_then_chat'">
            <span class="material-symbols-outlined text-primary">comment</span>
            <span class="text-xs font-semibold">评论后可聊</span>
          </button>
          <button class="flex flex-col items-center gap-2 rounded-2xl border p-3 transition-all" :class="form.dmRule === 'mutual_follow' ? 'border-emerald-100 bg-white' : 'border-transparent bg-slate-50 hover:border-emerald-200'" @click="form.dmRule = 'mutual_follow'">
            <span class="material-symbols-outlined text-primary">group</span>
            <span class="text-xs font-semibold">互相关注</span>
          </button>
        </div>
      </AdminPanel>

      <AdminPanel panel-class="col-span-12 lg:col-span-8">
        <div class="mb-6 flex items-center justify-between">
          <div class="flex items-start gap-4">
            <div class="rounded-xl bg-emerald-50 p-2 text-emerald-600">
              <span class="material-symbols-outlined">security</span>
            </div>
            <div>
              <h3 class="text-base font-bold text-slate-800">内容安全与审核模式</h3>
              <p class="mt-1 text-sm text-on-surface-variant">定义审核流程和评论审核策略。</p>
            </div>
          </div>
          <span class="rounded-full border border-primary/10 bg-primary/10 px-3 py-1 text-[11px] font-bold text-primary">配置数据来自后端接口</span>
        </div>

        <div class="grid grid-cols-1 gap-6 md:grid-cols-2">
          <div>
            <label class="text-xs font-bold uppercase tracking-wider text-slate-500">审核模式选择</label>
            <div class="mt-3 space-y-3">
              <label class="flex cursor-pointer items-center gap-3 rounded-2xl border-2 p-3 transition-all" :class="form.moderationMode === 'manual' ? 'border-emerald-500/30 bg-emerald-50/50' : 'border-transparent bg-slate-50 hover:border-emerald-200'">
                <input v-model="form.moderationMode" type="radio" value="manual" class="text-primary focus:ring-primary/20" />
                <div>
                  <p class="text-sm font-semibold">纯人工审核</p>
                  <p class="text-[10px] text-on-surface-variant">全部内容进入人工队列</p>
                </div>
              </label>
              <label class="flex cursor-pointer items-center gap-3 rounded-2xl border-2 p-3 transition-all" :class="form.moderationMode === 'auto' ? 'border-emerald-500/30 bg-emerald-50/50' : 'border-transparent bg-slate-50 hover:border-emerald-200'">
                <input v-model="form.moderationMode" type="radio" value="auto" class="text-primary focus:ring-primary/20" />
                <div>
                  <p class="text-sm font-semibold">先发后审</p>
                  <p class="text-[10px] text-on-surface-variant">低风险用户优先放行</p>
                </div>
              </label>
              <label class="flex cursor-pointer items-center gap-3 rounded-2xl border-2 p-3 transition-all" :class="form.moderationMode === 'hybrid' ? 'border-emerald-500/30 bg-emerald-50/50' : 'border-transparent bg-slate-50 hover:border-emerald-200'">
                <input v-model="form.moderationMode" type="radio" value="hybrid" class="text-primary focus:ring-primary/20" />
                <div>
                  <p class="text-sm font-semibold">机审 + 人审</p>
                  <p class="text-[11px] text-emerald-700/60">命中规则后进入人工复核</p>
                </div>
              </label>
            </div>
          </div>

          <div class="rounded-2xl border border-slate-100 bg-slate-50/50 p-4">
            <div class="space-y-4">
              <label class="block">
                <span class="text-xs font-bold text-slate-500">评论审核</span>
                <select v-model="form.commentModeration" class="mt-2 w-full rounded-xl border-slate-200 bg-white px-3 py-2 text-sm focus:border-primary focus:ring-primary/20">
                  <option value="false">关闭</option>
                  <option value="true">开启</option>
                </select>
              </label>
              <div>
                <div class="mb-2 flex items-center justify-between">
                  <span class="text-xs font-bold text-slate-500">AI 置信阈值</span>
                  <span class="rounded-lg bg-emerald-900 px-2 py-0.5 text-xs font-bold text-white">{{ form.aiThreshold }}%</span>
                </div>
                <input v-model="form.aiThreshold" type="range" min="0" max="100" class="h-1.5 w-full cursor-pointer appearance-none rounded-lg bg-emerald-100 accent-primary" />
              </div>
            </div>
          </div>
        </div>
      </AdminPanel>

      <AdminPanel title="系统审计策略" subtitle="控制审计保留时长和日志回溯窗口。" icon="history" panel-class="col-span-12 lg:col-span-6">
        <div class="flex flex-col gap-4 rounded-2xl bg-slate-900 p-5 text-emerald-400">
          <div class="flex items-center justify-between">
            <span class="text-xs uppercase tracking-widest">Retention Days</span>
            <span class="text-sm font-bold">{{ form.auditRetentionDays }} 天</span>
          </div>
          <input v-model="form.auditRetentionDays" type="range" min="30" max="365" class="h-2 w-full cursor-pointer appearance-none rounded-lg bg-emerald-900/50" />
          <div class="flex justify-between text-[10px] text-emerald-200/60">
            <span>30 天</span>
            <span>180 天</span>
            <span>365 天</span>
          </div>
        </div>
      </AdminPanel>

      <AdminPanel title="操作记录与同步状态" subtitle="最近一次保存动作和当前同步状态。" icon="sync" panel-class="col-span-12 flex flex-col justify-between lg:col-span-6">
        <div>
          <div class="space-y-3">
            <div class="flex items-center justify-between rounded-2xl border border-slate-100/50 bg-slate-50 p-4">
              <div class="flex items-center gap-3">
                <div class="flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white">
                  <span class="material-symbols-outlined text-primary">cloud_done</span>
                </div>
                <div>
                  <p class="text-sm font-semibold">配置同步状态</p>
                  <p class="text-xs text-on-surface-variant">{{ dirty ? '当前表单有未保存修改' : '当前表单与已加载配置一致' }}</p>
                </div>
              </div>
              <span class="rounded-lg px-2 py-0.5 text-[10px] font-bold uppercase" :class="dirty ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'">{{ dirty ? 'Pending' : 'Synced' }}</span>
            </div>
            <div class="flex items-center justify-between rounded-2xl border border-slate-100/50 bg-slate-50 p-4">
              <div class="flex items-center gap-3">
                <div class="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-200 text-sm font-bold text-emerald-900">
                  A
                </div>
                <div>
                  <p class="text-sm font-semibold">最近一次加载</p>
                  <p class="text-xs text-on-surface-variant">{{ lastLoadedAt }}</p>
                </div>
              </div>
              <span class="rounded-lg bg-white px-2 py-1 text-[10px] font-bold text-slate-500">本地视图</span>
            </div>
          </div>
        </div>
        <div class="mt-6 rounded-xl border border-dashed border-slate-200 px-4 py-3 text-xs leading-5 text-slate-400">
          变更历史入口暂未接入，当前页面仅支持读取与保存平台配置。
        </div>
      </AdminPanel>

      <section class="col-span-12 rounded-2xl border border-white bg-white/40 p-6">
        <div class="grid grid-cols-1 gap-6 md:grid-cols-4">
          <AdminStatCard label="默认可见性" :value="visibilityLabel" tone="default" />
          <AdminStatCard label="审核模式" :value="moderationLabel" tone="default" />
          <AdminStatCard label="私聊规则" :value="dmRuleLabel" tone="default" />
          <AdminStatCard label="保留天数" :value="form.auditRetentionDays" unit="天" tone="default" />
        </div>
      </section>
    </div>
  </AdminLayout>
</template>

<script setup>
import { computed, onMounted, reactive, ref } from 'vue';
import AdminLayout from '../layouts/AdminLayout.vue';
import AdminPanel from '../components/AdminPanel.vue';
import AdminStatCard from '../components/AdminStatCard.vue';
import { adminApi } from '../api/admin';
import { useToast } from '../composables/useToast';

const { success, error } = useToast();

const defaults = {
  defaultPostVisibility: 'public',
  dmRule: 'mutual_follow',
  moderationMode: 'hybrid',
  commentModeration: 'false',
  auditRetentionDays: '90',
  aiThreshold: '85'
};

const form = reactive({ ...defaults });
const saving = ref(false);
const loadedSnapshot = ref(JSON.stringify(defaults));
const lastLoadedAt = ref('尚未加载');

const visibilityLabel = computed(() => {
  if (form.defaultPostVisibility === 'private') return '私密';
  if (form.defaultPostVisibility === 'followers') return '仅好友';
  return '公开';
});
const moderationLabel = computed(() => {
  if (form.moderationMode === 'manual') return '纯人工';
  if (form.moderationMode === 'auto') return '先发后审';
  return '机审 + 人审';
});
const dmRuleLabel = computed(() => {
  if (form.dmRule === 'open') return '开放私聊';
  if (form.dmRule === 'comment_then_chat') return '评论后可聊';
  return '互相关注';
});
const dirty = computed(() => JSON.stringify(form) !== loadedSnapshot.value);

async function loadConfig() {
  const data = await adminApi.config();
  Object.assign(form, defaults, data.settings || {});
  loadedSnapshot.value = JSON.stringify(form);
  lastLoadedAt.value = new Date().toLocaleString('zh-CN', { hour12: false });
}

async function saveConfig() {
  saving.value = true;
  try {
    const data = await adminApi.patchConfig(form);
    Object.assign(form, defaults, data.settings || {});
    loadedSnapshot.value = JSON.stringify(form);
    lastLoadedAt.value = new Date().toLocaleString('zh-CN', { hour12: false });
    success('配置已保存');
  } catch {
    error('保存失败，请重试');
  } finally {
    saving.value = false;
  }
}

function resetToDefaults() {
  Object.assign(form, defaults);
}

onMounted(loadConfig);
</script>
