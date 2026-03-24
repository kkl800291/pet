<template>
  <Teleport to="body">
    <div
      v-if="open"
      class="fixed inset-0 z-[110] flex items-center justify-center bg-slate-950/35 px-4"
      @click.self="$emit('close')"
    >
      <div class="w-full max-w-lg overflow-hidden rounded-[1.5rem] border border-outline-variant/15 bg-surface-container-lowest shadow-2xl">
        <div class="p-6">
          <div class="flex items-start gap-3">
            <div class="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-2xl" :class="tone === 'danger' ? 'bg-error-container/20 text-error' : 'bg-primary-container/25 text-primary'">
              <span class="material-symbols-outlined">{{ icon }}</span>
            </div>
            <div class="min-w-0 flex-1">
              <h3 class="text-lg font-extrabold text-on-surface">{{ title }}</h3>
              <p v-if="description" class="mt-2 whitespace-pre-wrap text-sm leading-6 text-on-surface-variant">{{ description }}</p>
            </div>
          </div>

          <div class="mt-5">
            <label class="mb-2 block text-xs font-semibold text-slate-500">{{ label }}</label>
            <textarea
              :value="reason"
              class="min-h-[120px] w-full rounded-2xl border-none bg-surface-container-low px-4 py-3 text-sm focus:ring-2 focus:ring-primary/20"
              :placeholder="placeholder"
              @input="$emit('update:reason', $event.target.value)"
            />
            <p v-if="required" class="mt-2 text-xs text-slate-400">该字段必填，内容会进入审计或处理记录。</p>
          </div>
        </div>

        <div class="flex justify-end gap-3 px-6 pb-6">
          <button class="rounded-xl bg-surface-container px-4 py-2 text-sm font-semibold text-on-surface transition-colors hover:bg-surface-container-high" type="button" @click="$emit('close')">
            取消
          </button>
          <button
            class="rounded-xl px-4 py-2 text-sm font-bold transition-colors disabled:cursor-not-allowed disabled:opacity-50"
            :class="tone === 'danger' ? 'bg-error text-on-error hover:bg-error-dim' : 'bg-primary text-on-primary hover:bg-primary-dim'"
            type="button"
            :disabled="required && !reason.trim()"
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
  reason: { type: String, default: '' },
  label: { type: String, default: '处理原因' },
  placeholder: { type: String, default: '请输入处理原因，便于后续审计和展示。' },
  confirmText: { type: String, default: '确认提交' },
  icon: { type: String, default: 'edit_note' },
  tone: { type: String, default: 'danger' },
  required: { type: Boolean, default: true }
});

defineEmits(['close', 'confirm', 'update:reason']);
</script>
