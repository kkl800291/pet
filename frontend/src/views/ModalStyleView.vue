<template>
  <AdminLayout title="通用弹出框样式 3.0" subtitle="统一确认框、详情框与操作反馈弹窗" breadcrumb="通用弹窗" search-placeholder="搜索弹窗样式...">
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <section class="bg-surface-container-lowest rounded-2xl border border-outline-variant/10 p-6">
        <h3 class="text-lg font-bold mb-3">确认弹窗</h3>
        <div class="rounded-xl border border-outline-variant/20 p-4 bg-surface-container-low">
          <p class="text-sm font-semibold">确定要封禁该用户吗？</p>
          <p class="text-xs text-slate-500 mt-2">该操作将立即生效，并写入审计日志。</p>
          <div class="mt-4 flex justify-end gap-2">
            <button class="px-4 py-2 rounded-lg bg-surface-container text-sm" @click="openConfirm = true">打开示例</button>
          </div>
        </div>
      </section>

      <section class="bg-surface-container-lowest rounded-2xl border border-outline-variant/10 p-6">
        <h3 class="text-lg font-bold mb-3">详情弹窗</h3>
        <div class="rounded-xl border border-outline-variant/20 p-4 bg-surface-container-low space-y-3">
          <p class="text-sm font-semibold">举报详情预览</p>
          <p class="text-xs text-slate-600">目标：帖子 #PA-78291</p>
          <p class="text-xs text-slate-600">原因：疑似广告引流内容。</p>
          <button class="w-full px-4 py-2 rounded-lg bg-primary text-on-primary text-sm font-bold" @click="openInfo = true">打开示例</button>
        </div>
      </section>

      <section class="bg-surface-container-lowest rounded-2xl border border-outline-variant/10 p-6">
        <h3 class="text-lg font-bold mb-3">反馈弹窗</h3>
        <div class="rounded-xl border border-outline-variant/20 p-4 bg-surface-container-low">
          <div class="flex items-center gap-2 text-primary font-bold text-sm">
            <span class="material-symbols-outlined">check_circle</span>
            操作已完成
          </div>
          <p class="text-xs text-slate-500 mt-2">举报单已标记为“已处理”。</p>
          <button class="mt-4 w-full px-4 py-2 rounded-lg bg-primary text-on-primary text-sm font-bold" @click="openFeedback = true">打开示例</button>
        </div>
      </section>
    </div>
  </AdminLayout>

  <CommonModal
    :open="openConfirm"
    title="确认封禁用户"
    description="用户：张伟杰\n该操作将立即生效，并写入审计日志。"
    confirm-text="确认封禁"
    cancel-text="取消"
    icon="gavel"
    tone="danger"
    @close="openConfirm = false"
    @confirm="openConfirm = false"
  />

  <CommonModal
    :open="openInfo"
    title="举报详情预览"
    description="目标：帖子 #PA-78291\n原因：疑似广告引流内容。"
    confirm-text="进入处理页"
    icon="visibility"
    tone="primary"
    :show-cancel="false"
    @close="openInfo = false"
    @confirm="openInfo = false"
  />

  <CommonModal
    :open="openFeedback"
    title="操作已完成"
    description="举报单已标记为“已处理”。"
    confirm-text="知道了"
    icon="check_circle"
    tone="success"
    :show-cancel="false"
    @close="openFeedback = false"
    @confirm="openFeedback = false"
  />
</template>

<script setup>
import AdminLayout from '../layouts/AdminLayout.vue';
import { ref } from 'vue';
import CommonModal from '../components/CommonModal.vue';

const openConfirm = ref(false);
const openInfo = ref(false);
const openFeedback = ref(false);
</script>
