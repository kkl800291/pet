<template>
  <span
    class="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-3 py-1 text-[11px] font-bold"
    :class="toneClass"
  >
    <span v-if="dot" class="h-1.5 w-1.5 rounded-full" :class="[dotColorClass, pulse ? 'animate-pulse' : '']" />
    {{ label }}
  </span>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
  label: { type: String, required: true },
  tone: {
    type: String,
    default: 'neutral',
    validator: (v) => ['primary', 'danger', 'error', 'success', 'neutral', 'warning'].includes(v)
  },
  dot: { type: Boolean, default: false },
  pulse: { type: Boolean, default: false }
});

const toneClass = computed(() => ({
  primary:  'bg-primary-container/30 text-primary',
  success:  'bg-primary-container/20 text-primary',
  danger:   'bg-error/10 text-error',
  error:    'bg-error text-on-error',
  warning:  'bg-amber-100 text-amber-700',
  neutral:  'bg-slate-100 text-slate-500'
}[props.tone]));

const dotColorClass = computed(() => ({
  primary:  'bg-primary',
  success:  'bg-primary',
  danger:   'bg-error',
  error:    'bg-white',
  warning:  'bg-amber-500',
  neutral:  'bg-slate-400'
}[props.tone]));
</script>
