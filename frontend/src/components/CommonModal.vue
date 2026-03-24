<template>
  <Teleport to="body">
    <div
      v-if="open"
      class="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/35 px-4"
      @click.self="$emit('close')"
    >
      <div class="w-full max-w-md rounded-[1.5rem] bg-surface-container-lowest border border-outline-variant/15 shadow-2xl overflow-hidden">
        <div class="p-6">
          <div class="flex items-start gap-3">
            <div
              class="w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0"
              :class="tone === 'danger' ? 'bg-error-container/20 text-error' : tone === 'success' ? 'bg-primary-container/25 text-primary' : 'bg-surface-container text-on-surface'"
            >
              <span class="material-symbols-outlined">{{ icon }}</span>
            </div>
            <div class="min-w-0 flex-1">
              <h3 class="text-lg font-extrabold text-on-surface">{{ title }}</h3>
              <p v-if="description" class="mt-2 text-sm leading-6 text-on-surface-variant whitespace-pre-wrap">{{ description }}</p>
            </div>
          </div>
        </div>

        <div class="px-6 pb-6 flex justify-end gap-3">
          <button
            v-if="showCancel"
            class="px-4 py-2 rounded-xl bg-surface-container text-sm font-semibold text-on-surface hover:bg-surface-container-high transition-colors"
            type="button"
            @click="$emit('close')"
          >
            {{ cancelText }}
          </button>
          <button
            class="px-4 py-2 rounded-xl text-sm font-bold transition-colors"
            :class="tone === 'danger' ? 'bg-error text-on-error hover:bg-error-dim' : 'bg-primary text-on-primary hover:bg-primary-dim'"
            type="button"
            @click="$emit('confirm')"
          >
            {{ confirmText }}
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
defineProps({
  open: { type: Boolean, default: false },
  title: { type: String, default: '' },
  description: { type: String, default: '' },
  confirmText: { type: String, default: '确认' },
  cancelText: { type: String, default: '取消' },
  icon: { type: String, default: 'info' },
  tone: { type: String, default: 'primary' },
  showCancel: { type: Boolean, default: true }
});

defineEmits(['close', 'confirm']);
</script>
