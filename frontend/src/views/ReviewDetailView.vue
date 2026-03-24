<template>
  <AdminLayout title="内容审核详情" subtitle="查看内容正文、素材、关联宠物信息和审核记录" breadcrumb="内容审核详情" search-placeholder="搜索内容 ID...">
    <div v-if="item" class="space-y-8">
        <AdminBackButton @click="goList" />

        <div class="grid grid-cols-12 gap-6">
          <section class="col-span-12 space-y-6 lg:col-span-8">
            <article class="rounded-3xl bg-surface-container-lowest p-6 shadow-sm md:p-8">
              <div class="mb-6 flex items-center gap-4">
                <div class="flex h-12 w-12 items-center justify-center rounded-full border-2 border-primary-container bg-primary/5 text-lg font-bold text-primary">
                  {{ ownerLetter }}
                </div>
                <div>
                  <h2 class="text-lg font-bold">{{ item.owner?.name || '匿名用户' }}</h2>
                  <p class="text-sm text-on-surface-variant">发布时间：{{ formatDate(item.createdAt) }}</p>
                </div>
              </div>

              <div class="mb-8 space-y-4">
                <h3 class="text-[1.35rem] font-bold tracking-tight">{{ item.title || '未命名内容' }}</h3>
                <p class="whitespace-pre-wrap text-base leading-8 text-on-surface">{{ item.content || '暂无正文内容。' }}</p>
              </div>

              <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <div
                  v-for="(image, index) in displayImages"
                  :key="`${image}-${index}`"
                  class="group relative aspect-square overflow-hidden rounded-2xl bg-surface-container"
                >
                  <img :src="image" :alt="`内容图片 ${index + 1}`" class="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
                </div>
                <div v-if="!displayImages.length" class="flex aspect-square items-center justify-center rounded-2xl border border-dashed border-surface-container-high bg-surface text-sm text-on-surface-variant">
                  暂无图片素材
                </div>
              </div>
            </article>

            <article class="flex flex-col gap-5 rounded-3xl bg-surface-container-low p-6 md:flex-row md:items-center md:justify-between">
              <div class="flex items-center gap-5">
                <div class="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary-container text-primary">
                  <span class="material-symbols-outlined text-4xl">pets</span>
                </div>
                <div>
                  <div class="mb-1 flex flex-wrap items-center gap-3">
                    <h3 class="text-lg font-bold">{{ item.pet?.name || '未关联宠物' }}</h3>
                    <span class="rounded-md bg-primary-fixed px-2 py-1 text-[11px] font-bold uppercase text-[#004536]">
                      {{ petBreed }}
                    </span>
                  </div>
                  <p class="text-sm text-on-surface-variant">{{ petSummary }}</p>
                </div>
              </div>
              <button class="text-sm font-semibold text-primary transition-opacity hover:opacity-80" @click="openPetDetail">
                查看档案
              </button>
            </article>
          </section>

          <aside class="col-span-12 space-y-6 lg:col-span-4">
            <article class="rounded-3xl border border-primary/8 bg-surface-container-lowest p-6 shadow-sm">
              <div class="mb-6 flex items-center justify-between gap-3">
                <h3 class="flex items-center gap-2 text-base font-bold">
                  <span class="material-symbols-outlined text-primary">psychology</span>
                  AI 风险分析
                </h3>
                <span class="rounded-lg bg-primary-container px-2 py-1 text-xs font-bold text-primary">{{ riskLabel }}</span>
              </div>
              <div class="space-y-4">
                <div class="flex items-center justify-between text-sm">
                  <span class="text-on-surface-variant">综合评分</span>
                  <span class="font-bold text-primary">{{ riskScore }}</span>
                </div>
                <div class="h-2 overflow-hidden rounded-full bg-surface-container-high">
                  <div class="h-full rounded-full bg-primary transition-all" :style="{ width: `${riskWidth}%` }"></div>
                </div>
                <div class="space-y-3 pt-2">
                  <div v-for="point in riskPoints" :key="point" class="flex items-center gap-3 text-sm">
                    <span class="material-symbols-outlined text-lg text-primary">check_circle</span>
                    <span class="text-on-surface-variant">{{ point }}</span>
                  </div>
                </div>
              </div>
            </article>

            <article class="rounded-3xl bg-surface-container-lowest p-6 shadow-sm">
              <h3 class="mb-4 text-base font-bold">快速驳回理由</h3>
              <div class="flex flex-wrap gap-2">
                <button
                  v-for="reason in rejectReasons"
                  :key="reason"
                  class="rounded-full border border-outline-variant/80 px-4 py-2 text-sm transition-colors hover:bg-surface-container-high"
                  @click="quickReject(reason)"
                >
                  {{ reason }}
                </button>
              </div>
            </article>

            <article class="space-y-3 rounded-3xl bg-surface-container-lowest p-6 shadow-sm">
              <AdminActionButton label="通过审核" icon="verified" full-width @click="approve" />
              <AdminActionButton label="驳回申请" icon="block" tone="neutral" full-width @click="reject" />
              <AdminActionButton label="删除内容" icon="delete" tone="danger" full-width @click="deleteContent" />
            </article>

            <article class="rounded-3xl border border-emerald-900/10 bg-emerald-900/5 p-6">
              <p class="text-xs leading-6 text-on-surface-variant">
                <span class="material-symbols-outlined mr-1 align-text-bottom text-sm">info</span>
                审核员提示：该内容来自 {{ item.owner?.name || '当前用户' }}，历史发帖状态为 {{ labelOf(POST_STATUS, item.status) }}，AI 评分为 {{ riskScore }}。<span v-if="item.reviewReason">最近一次审核备注：{{ item.reviewReason }}。</span>{{ actionSuggestion }}
              </p>
            </article>
          </aside>
        </div>
    </div>

    <div v-else class="rounded-3xl border border-outline-variant/20 bg-surface-container-lowest px-6 py-16 text-center text-on-surface-variant">
      未找到内容
    </div>

    <CommonModal
      :open="confirmOpen && confirmAction !== 'reject'"
      :title="confirmAction === 'approve' ? '确认通过内容' : '确认删除内容'"
      :description="confirmDescription"
      :confirm-text="confirmAction === 'approve' ? '确认通过' : '确认删除'"
      cancel-text="取消"
      :icon="confirmAction === 'approve' ? 'task_alt' : 'delete'"
      :tone="confirmAction === 'approve' ? 'primary' : 'danger'"
      @close="closeReasonModal"
      @confirm="confirmAction === 'approve' ? confirmApprove() : confirmDelete()"
    />

    <ActionReasonModal
      :open="confirmOpen && confirmAction === 'reject'"
      title="填写驳回原因"
      :description="item ? `标题：${item.title}\n作者：${item.owner?.name || '-'}\n驳回原因会展示在审核详情和审计日志中。` : ''"
      :reason="confirmReason"
      confirm-text="确认驳回"
      icon="block"
      tone="danger"
      @close="closeReasonModal"
      @confirm="confirmReject"
      @update:reason="confirmReason = $event"
    />

    <CommonModal
      :open="feedbackOpen"
      :title="feedbackTitle"
      :description="feedbackText"
      confirm-text="知道了"
      icon="check_circle"
      tone="success"
      :show-cancel="false"
      @close="feedbackOpen = false"
      @confirm="feedbackOpen = false"
    />
  </AdminLayout>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import AdminLayout from '../layouts/AdminLayout.vue';
import AdminActionButton from '../components/AdminActionButton.vue';
import ActionReasonModal from '../components/ActionReasonModal.vue';
import AdminBackButton from '../components/AdminBackButton.vue';
import CommonModal from '../components/CommonModal.vue';
import { adminApi } from '../api/admin';
import { POST_STATUS, formatDate, labelOf } from '../assets/labels';

const route = useRoute();
const router = useRouter();
const post = ref(null);
const confirmOpen = ref(false);
const confirmAction = ref('approve');
const confirmReason = ref('');
const feedbackOpen = ref(false);
const feedbackTitle = ref('');
const feedbackText = ref('');

const rejectReasons = ['垃圾营销 (Spam)', '语言不当 (Language)', '侵犯隐私 (Privacy)'];

const item = computed(() => post.value);
const moderation = computed(() => item.value?.moderation || {});

const displayImages = computed(() => (item.value?.images?.filter(Boolean) || []).slice(0, 3));

const ownerLetter = computed(() => (item.value?.owner?.name || '匿').slice(0, 1).toUpperCase());
const petBreed = computed(() => item.value?.pet?.breed || item.value?.pet?.species || '未填写');
const petSummary = computed(() => {
  if (!item.value?.pet) return '未关联宠物档案';
  const parts = [
    item.value.pet.species || '',
    item.value.pet.age ? `${item.value.pet.age}` : '',
    item.value.pet.sex || ''
  ].filter(Boolean);
  return parts.length ? parts.join(' · ') : '宠物基础信息未完善';
});

const statusBadgeClass = computed(() => {
  if (item.value?.status === 'approved') return 'bg-primary-container text-primary';
  if (item.value?.status === 'rejected') return 'bg-[#f9d9db] text-error-dim';
  return 'bg-surface-container-highest text-on-surface-variant';
});

const riskScore = computed(() => Number(moderation.value.score || 0));
const riskWidth = computed(() => Math.max(0, Math.min(riskScore.value, 100)));
const riskLabel = computed(() => moderation.value.badgeLabel || '待评估');
const riskPoints = computed(() => moderation.value.points || []);
const actionSuggestion = computed(() => moderation.value.actionSuggestion || '建议继续人工复核');

const confirmDescription = computed(() => {
  if (!item.value) return '';
  const reasonText = confirmReason.value ? `\n原因：${confirmReason.value}` : '';
  if (confirmAction.value === 'delete') {
    return `标题：${item.value.title}\n作者：${item.value.owner?.name || '-'}\n该内容将从系统中删除，并写入审计日志。`;
  }
  return `标题：${item.value.title}\n作者：${item.value.owner?.name || '-'}${reasonText}\n此操作会立即生效，并写入审计日志。`;
});

async function loadData() {
  const id = String(route.query.id || '');
  if (!id) {
    post.value = null;
    return;
  }
  try {
    const data = await adminApi.postDetail(id);
    post.value = data.post || null;
  } catch (error) {
    if (error.message === 'not_found') {
      post.value = null;
      return;
    }
    throw error;
  }
}

function approve() {
  if (!item.value) return;
  confirmReason.value = '';
  confirmAction.value = 'approve';
  confirmOpen.value = true;
}

async function confirmApprove() {
  if (!item.value) return;
  const currentTitle = item.value.title;
  confirmOpen.value = false;
  await adminApi.approvePost(item.value.id);
  await loadData();
  feedbackTitle.value = '审核已通过';
  feedbackText.value = `内容《${currentTitle}》已通过。`;
  feedbackOpen.value = true;
}

function reject() {
  if (!item.value) return;
  confirmReason.value = '';
  confirmAction.value = 'reject';
  confirmOpen.value = true;
}

function quickReject(reason) {
  if (!item.value) return;
  confirmReason.value = reason;
  confirmAction.value = 'reject';
  confirmOpen.value = true;
}

async function confirmReject() {
  if (!item.value) return;
  const currentTitle = item.value.title;
  const currentReason = confirmReason.value;
  closeReasonModal();
  await adminApi.rejectPost(item.value.id, currentReason);
  await loadData();
  feedbackTitle.value = '内容已驳回';
  feedbackText.value = currentReason ? `内容《${currentTitle}》已驳回，原因：${currentReason}` : `内容《${currentTitle}》已驳回。`;
  feedbackOpen.value = true;
  confirmReason.value = '';
}

function deleteContent() {
  if (!item.value) return;
  confirmReason.value = '';
  confirmAction.value = 'delete';
  confirmOpen.value = true;
}

async function confirmDelete() {
  if (!item.value) return;
  const currentTitle = item.value.title;
  closeReasonModal();
  await adminApi.deletePost(item.value.id);
  post.value = null;
  feedbackTitle.value = '内容已删除';
  feedbackText.value = `内容《${currentTitle}》已从系统中删除。`;
  feedbackOpen.value = true;
}

function closeReasonModal() {
  confirmOpen.value = false;
}

function openPetDetail() {
  if (!item.value?.pet?.id) return;
  router.push(`/pets/detail?id=${item.value.pet.id}`);
}

function goList() {
  router.push('/review/list');
}

onMounted(loadData);
</script>
