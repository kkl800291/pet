<template>
  <div class="flex h-full flex-col justify-between rounded-3xl border p-5 shadow-sm" :class="cardClass">
    <div>
      <p class="text-xs font-medium" :class="labelClass">{{ label }}</p>
      <div class="mt-2 flex items-baseline gap-1">
        <h3 class="text-3xl font-bold" :class="valueClass">{{ value }}</h3>
        <span v-if="unit" class="text-sm font-normal" :class="unitClass">{{ unit }}</span>
      </div>
    </div>
    <span v-if="hint" class="mt-4 self-start rounded-full px-2 py-0.5 text-[11px]" :class="hintClass">
      {{ hint }}
    </span>
  </div>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
  label: { type: String, required: true },
  value: { type: [String, Number], required: true },
  hint: { type: String, default: '' },
  unit: { type: String, default: '' },
  tone: { type: String, default: 'default' }
});

const toneMap = {
  default: {
    card: 'border-transparent bg-surface-container-lowest',
    label: 'text-slate-400',
    value: 'text-on-surface',
    unit: 'text-on-surface-variant',
    hint: 'bg-surface-container-low text-on-surface-variant'
  },
  primary: {
    card: 'border-primary-container/20 bg-surface-container-lowest',
    label: 'text-slate-400',
    value: 'text-primary',
    unit: 'text-primary',
    hint: 'bg-primary/10 text-primary'
  },
  success: {
    card: 'border-primary-container/30 bg-primary-container/20',
    label: 'text-on-primary-container/60',
    value: 'text-primary',
    unit: 'text-primary',
    hint: 'bg-white/60 text-primary'
  },
  danger: {
    card: 'border-error/10 bg-error/5',
    label: 'text-error',
    value: 'text-error',
    unit: 'text-error',
    hint: 'bg-error/10 text-error'
  },
  solid: {
    card: 'border-primary bg-primary text-on-primary shadow-lg shadow-primary/20',
    label: 'text-white/80',
    value: 'text-on-primary',
    unit: 'text-white/90',
    hint: 'bg-white/20 text-white'
  }
};

const styles = computed(() => toneMap[props.tone] || toneMap.default);
const cardClass = computed(() => styles.value.card);
const labelClass = computed(() => styles.value.label);
const valueClass = computed(() => styles.value.value);
const unitClass = computed(() => styles.value.unit);
const hintClass = computed(() => styles.value.hint);
</script>
