<template>
  <button
    class="inline-flex items-center gap-2 rounded-xl border border-outline-variant/20 bg-surface-container-lowest px-5 py-2.5 text-sm font-semibold text-primary transition-colors hover:bg-surface-container-low"
    @click="$emit('click')"
  >
    <span class="material-symbols-outlined text-lg">arrow_back</span>
    {{ label }}
  </button>
</template>

<script setup>
defineProps({
  label: {
    type: String,
    default: '返回列表'
  }
});

defineEmits(['click']);
</script>
