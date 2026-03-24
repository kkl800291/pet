<template>
  <div class="flex justify-end gap-2">
    <button
      v-for="action in actions"
      :key="action.label"
      class="inline-flex w-11 flex-col items-center justify-center rounded-lg px-1 py-2 text-[11px] font-semibold leading-none transition-all"
      :class="toneClass(action.tone)"
      :title="action.label"
      :aria-label="action.label"
      :disabled="action.disabled"
      @click="action.onClick?.()"
    >
      <span class="material-symbols-outlined text-base">{{ action.icon }}</span>
      <span class="mt-1">{{ action.label }}</span>
    </button>
  </div>
</template>

<script setup>
defineProps({
  actions: {
    type: Array,
    default: () => []
  }
});

function toneClass(tone) {
  if (tone === 'danger') return 'text-error hover:bg-error/10 disabled:opacity-40';
  if (tone === 'primary') return 'text-primary hover:bg-primary/10 disabled:opacity-40';
  return 'text-slate-500 hover:bg-slate-100 disabled:opacity-40';
}
</script>
