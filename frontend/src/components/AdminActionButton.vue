<template>
  <button class="inline-flex items-center justify-center gap-2 rounded-xl px-5 py-2.5 text-sm font-bold transition-all disabled:cursor-not-allowed disabled:opacity-50" :class="buttonClass" :disabled="disabled" @click="$emit('click')">
    <span v-if="icon" class="material-symbols-outlined" :class="iconClass">{{ icon }}</span>
    {{ label }}
  </button>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
  label: { type: String, required: true },
  icon: { type: String, default: '' },
  tone: { type: String, default: 'primary' },
  fullWidth: { type: Boolean, default: false },
  disabled: { type: Boolean, default: false }
});

defineEmits(['click']);

const toneMap = {
  primary: 'bg-primary text-on-primary shadow-lg shadow-primary/20 hover:opacity-90',
  danger: 'bg-error text-on-error hover:opacity-90',
  neutral: 'bg-surface-container-low text-on-surface hover:bg-surface-container',
  outline: 'border border-outline-variant/20 bg-surface-container-lowest text-primary hover:bg-surface-container-low'
};

const buttonClass = computed(() => {
  const width = props.fullWidth ? 'w-full' : '';
  return [toneMap[props.tone] || toneMap.primary, width].join(' ').trim();
});

const iconClass = computed(() => (props.fullWidth ? 'text-lg' : 'text-base'));
</script>
