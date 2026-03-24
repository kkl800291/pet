<template>
  <AdminLayout title="举报处理详情" subtitle="查看被举报内容、证据材料、处理记录和风险研判结果" breadcrumb="举报详情" search-placeholder="搜索工单...">
    <div v-if="item" class="space-y-6">
      <AdminBackButton @click="goList" />

      <section class="flex items-center justify-between rounded-2xl border border-emerald-50/60 bg-surface-container-lowest px-6 py-4 shadow-sm">
        <div class="flex items-center gap-4">
          <div class="flex flex-col">
            <span class="text-[10px] font-label text-slate-400">TICKET ID</span>
            <span class="text-sm font-bold text-emerald-800">{{ ticketId }}</span>
          </div>
          <span class="whitespace-nowrap rounded-full px-3 py-1 text-xs font-medium" :class="isHighPriority ? 'bg-[#fb5151] text-on-error' : 'bg-primary-container/30 text-primary'">
            {{ reportPriorityLabel }}
          </span>
        </div>
        <div class="text-right">
          <p class="text-xs text-slate-400">当前状态</p>
          <p class="text-sm font-semibold text-on-surface">{{ labelOf(REPORT_STATUS, item.status) }}</p>
        </div>
      </section>

      <div class="grid grid-cols-12 gap-6">
        <div class="col-span-12 space-y-6 xl:col-span-8">
          <section class="rounded-2xl border border-transparent bg-surface-container-lowest p-6 shadow-sm">
            <div class="mb-6 flex items-center justify-between">
              <h2 class="flex items-center gap-2 text-lg font-bold text-primary">
                <span class="material-symbols-outlined">visibility</span>
                被举报内容预览
              </h2>
              <span class="text-xs text-slate-400">发布于 {{ formatDate(item.createdAt) }}</span>
            </div>

            <div class="rounded-xl border border-surface-container bg-surface p-5">
              <div class="mb-4 flex items-center gap-3">
                <div class="flex h-10 w-10 items-center justify-center rounded-full bg-primary-container/30 text-xs font-bold text-primary">
                  {{ contentOwnerLetter }}
                </div>
                <div>
                  <p class="text-sm font-bold">{{ contentOwner }}</p>
                  <p class="text-xs text-slate-400">目标ID: {{ item.targetId }} · 举报人: {{ item.reporterOwnerId || '-' }}</p>
                </div>
              </div>

              <p class="mb-4 leading-relaxed text-on-surface">
                {{ contentPreview }}
              </p>

              <div class="grid grid-cols-3 gap-3">
                <img
                  v-for="(image, index) in previewImages.slice(0, 2)"
                  :key="`${image}-${index}`"
                  :src="image"
                  :alt="`被举报内容图片 ${index + 1}`"
                  class="aspect-square cursor-pointer rounded-xl object-cover transition-opacity hover:opacity-90"
                />
                <div v-if="previewImages[2]" class="group relative cursor-pointer">
                  <img :src="previewImages[2]" alt="更多图片" class="aspect-square rounded-xl object-cover opacity-60" />
                  <div class="absolute inset-0 flex items-center justify-center text-lg font-bold text-white">+{{ extraImageCount }}</div>
                </div>
                <div v-if="!previewImages.length" class="col-span-3 flex aspect-[3/1] items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50 text-sm text-slate-400">
                  暂无被举报内容图片
                </div>
              </div>
            </div>
          </section>

          <section class="rounded-2xl bg-surface-container-lowest p-6 shadow-sm">
            <h2 class="mb-6 flex items-center gap-2 text-lg font-bold text-primary">
              <span class="material-symbols-outlined">fact_check</span>
              举报人证据
            </h2>
            <div class="grid grid-cols-2 gap-4 lg:grid-cols-4">
              <div v-for="(evidence, index) in evidenceImages" :key="`${evidence.src}-${index}`" class="group relative">
                <img :src="evidence.src" :alt="evidence.label" class="aspect-[3/4] w-full rounded-xl border border-slate-100 object-cover" />
                <div class="glass-effect absolute bottom-2 left-2 right-2 rounded-lg bg-white/20 px-2 py-1 text-center text-[10px] text-white opacity-0 transition-opacity group-hover:opacity-100">
                  {{ evidence.label }}
                </div>
              </div>
              <div v-if="!evidenceImages.length" class="flex aspect-[3/4] flex-col items-center justify-center gap-1 rounded-xl border-2 border-dashed border-slate-200 bg-slate-50 text-slate-400">
                <span class="material-symbols-outlined text-3xl">image_not_supported</span>
                <span class="text-xs">举报人未提交图片证据</span>
              </div>
            </div>
          </section>
        </div>

        <div class="col-span-12 space-y-6 xl:col-span-4">
          <section class="rounded-2xl border border-emerald-50/50 bg-surface-container-lowest p-6 shadow-sm">
            <h2 class="mb-4 text-md font-bold text-slate-800">举报详情</h2>
            <div class="space-y-4">
              <div class="flex justify-between gap-4">
                <span class="text-sm text-slate-400">举报类型</span>
                <span class="text-right text-sm font-semibold text-emerald-800">{{ reportTypeLabel }}</span>
              </div>
              <div class="flex flex-col gap-2">
                <span class="text-sm text-slate-400">描述说明</span>
                <div class="rounded-xl bg-surface p-3 text-sm leading-relaxed text-slate-600">
                  {{ reportDescription }}
                </div>
              </div>
              <div class="grid grid-cols-2 gap-4">
                <div>
                  <span class="text-sm text-slate-400">处理动作</span>
                  <p class="mt-1 text-sm font-semibold text-on-surface">{{ actionTypeLabel }}</p>
                </div>
                <div>
                  <span class="text-sm text-slate-400">处理人</span>
                  <p class="mt-1 text-sm font-semibold text-on-surface">{{ item.handledByAdminId || '-' }}</p>
                </div>
              </div>
              <div class="flex items-center justify-between border-t border-slate-50 pt-2">
                <div class="flex items-center gap-2">
                  <div class="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-100 text-xs font-bold text-emerald-700">{{ reporterLetter }}</div>
                  <span class="text-xs font-medium">{{ reporterName }}</span>
                </div>
                <span class="text-[10px] text-slate-400">{{ formatDate(item.createdAt) }}</span>
              </div>
            </div>
          </section>

          <section class="relative overflow-hidden rounded-2xl border border-primary-container bg-primary-container/10 p-6 shadow-sm">
            <div class="absolute -right-4 -top-4 opacity-10">
              <span class="material-symbols-outlined text-8xl text-primary" style="font-variation-settings: 'FILL' 1">psychology</span>
            </div>
            <h2 class="mb-6 flex items-center gap-2 text-md font-bold text-primary">
              <span class="material-symbols-outlined text-lg" style="font-variation-settings: 'FILL' 1">auto_awesome</span>
              风险研判
            </h2>

            <div class="mb-6 flex flex-col items-center">
              <div class="relative flex h-32 w-32 items-center justify-center">
                <svg class="h-full w-full -rotate-90">
                  <circle class="text-emerald-100" cx="64" cy="64" r="58" fill="transparent" stroke="currentColor" stroke-width="8"></circle>
                  <circle class="text-emerald-500" cx="64" cy="64" r="58" fill="transparent" stroke="currentColor" stroke-width="8" stroke-dasharray="364.4" :stroke-dashoffset="riskDashOffset"></circle>
                </svg>
                <div class="absolute flex flex-col items-center">
                  <span class="text-3xl font-extrabold text-emerald-900">{{ riskScore }}</span>
                  <span class="text-[10px] uppercase tracking-tighter text-emerald-700">风险分值</span>
                </div>
              </div>
              <p class="mt-4 text-sm font-bold text-emerald-900">{{ riskLevelText }}</p>
            </div>

            <div class="space-y-3">
              <div class="flex items-center gap-3 rounded-xl bg-white/60 p-3">
                <span class="material-symbols-outlined text-lg text-error">dangerous</span>
                <div class="flex-1">
                  <p class="text-[10px] text-slate-400">命中关键词</p>
                  <p class="text-xs font-bold text-error">{{ keywordText }}</p>
                </div>
              </div>
              <div class="flex items-center gap-3 rounded-xl bg-white/60 p-3">
                <span class="material-symbols-outlined text-lg text-primary">history</span>
                <div class="flex-1">
                  <p class="text-[10px] text-slate-400">关联记录分析</p>
                  <p class="text-xs font-medium">{{ historyText }}</p>
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>

      <footer class="flex items-center justify-between rounded-2xl border-t-4 border-primary bg-surface-container-lowest p-6 shadow-xl shadow-emerald-900/5">
        <div class="flex flex-col">
          <span class="text-xs text-slate-400">审核建议</span>
          <span class="text-sm font-semibold text-primary">{{ actionSuggestion }}</span>
        </div>
        <div class="flex gap-3">
          <AdminActionButton label="忽略举报" tone="outline" :disabled="isResolved" @click="ignoreReport" />
          <AdminActionButton label="警告用户" tone="neutral" :disabled="!canWarnTargetOwner" @click="warnOwner" />
          <AdminActionButton label="下架内容" tone="neutral" :disabled="!canRemoveContent" @click="resolve" />
          <AdminActionButton label="封禁账号" :disabled="!canBanTargetOwner" @click="banTargetOwner" />
        </div>
      </footer>
    </div>

    <div v-else class="rounded-2xl border border-outline-variant/10 bg-surface-container-lowest p-12 text-center text-slate-400">未找到举报单</div>

    <ActionReasonModal
      :open="confirmOpen"
      :title="reasonModalTitle"
      :description="reasonModalDescription"
      :reason="actionReason"
      confirm-text="确认提交"
      icon="rule"
      tone="danger"
      @close="closeReasonModal"
      @confirm="confirmReasonAction"
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
import ActionReasonModal from '../components/ActionReasonModal.vue';
import { adminApi } from '../api/admin';
import { REPORT_STATUS, TARGET_TYPE, formatDate, labelOf } from '../assets/labels';
import { useToast } from '../composables/useToast';

const { success, error: showError } = useToast();

const route = useRoute();
const router = useRouter();
const report = ref(null);
const confirmOpen = ref(false);
const pendingAction = ref('');
const actionReason = ref('');

const item = computed(() => report.value);
const relatedPost = computed(() => item.value?.post || null);

const ticketId = computed(() => {
  if (!item.value) return '-';
  return `REP-${String(item.value.createdAt || '').slice(0, 10).replaceAll('-', '')}-${String(item.value.id).slice(-4).toUpperCase()}`;
});

const contentOwner = computed(() => relatedPost.value?.owner?.name || item.value?.targetOwner?.name || reporterName.value);
const contentOwnerLetter = computed(() => (contentOwner.value || 'U').slice(0, 1).toUpperCase());
const reporterName = computed(() => item.value?.reporter?.name || item.value?.reporterOwnerId || '匿名举报人');
const reporterLetter = computed(() => (reporterName.value || 'R').slice(0, 1).toUpperCase());
const previewImages = computed(() => {
  const imgs = relatedPost.value?.images?.filter(Boolean) || [];
  return imgs.slice(0, 3);
});
const extraImageCount = computed(() => Math.max((relatedPost.value?.images?.length || 0) - 2, 1));
const evidenceImages = computed(() => (item.value?.evidence || []).map((src, index) => ({ src, label: `证据 ${index + 1}` })));
const contentPreview = computed(() => relatedPost.value?.content || '当前举报未关联正文内容。');

const moderation = computed(() => item.value?.moderation || {});
const reportTypeLabel = computed(() => moderation.value.reportTypeLabel || '内容违规举报');
const reportDescription = computed(() => item.value?.resolution || item.value?.reason || '暂无举报说明。');
const actionTypeLabel = computed(() => {
  const actionType = item.value?.actionType || '';
  if (actionType === 'ignore_report') return '忽略举报';
  if (actionType === 'warn_owner') return '警告用户';
  if (actionType === 'remove_content') return '下架内容';
  if (actionType === 'ban_owner') return '封禁账号';
  return item.value?.status === 'resolved' ? '已处理' : '待处理';
});
const riskScore = computed(() => Number(moderation.value.score || 0));
const riskThreshold = computed(() => Number(moderation.value.threshold || 80));
const normalizedRiskScore = computed(() => Math.max(0, Math.min(riskScore.value, 100)));
const isHighPriority = computed(() => moderation.value.priority === 'high' || normalizedRiskScore.value >= riskThreshold.value);
const riskDashOffset = computed(() => Number((364.4 * (1 - normalizedRiskScore.value / 100)).toFixed(1)));
const riskLevelText = computed(() => moderation.value.levelText || '待评估');
const reportPriorityLabel = computed(() => isHighPriority.value ? '高优先级' : '常规处理');
const keywordText = computed(() => moderation.value.keywordText || '-');
const historyText = computed(() => moderation.value.historyText || '-');
const actionSuggestion = computed(() => moderation.value.actionSuggestion || '建议继续人工复核');
const isResolved = computed(() => item.value?.status === 'resolved');
const canRemoveContent = computed(() => !isResolved.value && (item.value?.targetType === TARGET_TYPE.post || item.value?.targetType === 'post') && Boolean(relatedPost.value?.id));
const targetOwnerId = computed(() => {
  if (!item.value) return '';
  if (item.value.targetType === TARGET_TYPE.owner || item.value.targetType === 'owner') return item.value.targetId;
  return item.value.targetOwner?.id || relatedPost.value?.ownerId || '';
});
const canWarnTargetOwner = computed(() => !isResolved.value && Boolean(targetOwnerId.value));
const canBanTargetOwner = computed(() => !isResolved.value && Boolean(targetOwnerId.value));
const reasonModalTitle = computed(() => {
  if (pendingAction.value === 'ignore') return '填写忽略原因';
  if (pendingAction.value === 'warn') return '填写警告原因';
  if (pendingAction.value === 'ban') return '填写封禁原因';
  return '填写处理原因';
});
const reasonModalDescription = computed(() => {
  if (!item.value) return '';
  return `举报单：${ticketId.value}\n目标：${item.value.targetId}\n该原因会写入审计日志，并作为处理备注展示。`;
});

async function loadData() {
  const id = String(route.query.id || '');
  if (!id) {
    report.value = null;
    return;
  }
  try {
    const data = await adminApi.reportDetail(id);
    report.value = data.report || null;
  } catch (error) {
    if (error.message === 'not_found') {
      report.value = null;
      return;
    }
    throw error;
  }
}

function resolve() {
  if (!item.value || !canRemoveContent.value) return;
  pendingAction.value = 'remove';
  confirmOpen.value = true;
  actionReason.value = item.value.reason || '';
}

function closeReasonModal() {
  confirmOpen.value = false;
  pendingAction.value = '';
  actionReason.value = '';
}

async function ignoreReport() {
  if (!item.value || isResolved.value) return;
  pendingAction.value = 'ignore';
  actionReason.value = item.value.reason || '';
  confirmOpen.value = true;
}

async function warnOwner() {
  if (!item.value || !canWarnTargetOwner.value) return;
  pendingAction.value = 'warn';
  actionReason.value = item.value.reason || '';
  confirmOpen.value = true;
}

async function banTargetOwner() {
  if (!canBanTargetOwner.value) {
    showError('当前举报未关联可封禁的用户账号');
    return;
  }
  pendingAction.value = 'ban';
  actionReason.value = item.value.reason || '';
  confirmOpen.value = true;
}

async function confirmReasonAction() {
  if (!item.value) return;
  const reason = actionReason.value.trim() || item.value.reason || '管理员处理';
  const action = pendingAction.value;

  const actionMessages = {
    remove: '举报已处理：内容已下架',
    ignore: '举报已忽略',
    warn: targetOwnerId.value ? `已对账号 ${targetOwnerId.value} 记录警告` : '已记录警告',
    ban: `账号 ${targetOwnerId.value} 已封禁`
  };

  const apiActionMap = {
    remove: 'remove_content',
    ignore: 'ignore_report',
    warn: 'warn_owner',
    ban: 'ban_owner'
  };

  if (apiActionMap[action]) {
    try {
      await adminApi.resolveReport(item.value.id, reason, apiActionMap[action]);
      await loadData();
      success(actionMessages[action] || '处理完成');
    } catch {
      showError('操作失败，请重试');
    }
  }
}

function goList() {
  router.push('/reports/list');
}

onMounted(loadData);
</script>
