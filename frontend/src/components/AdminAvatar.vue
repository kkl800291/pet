<template>
  <div
    class="shrink-0 overflow-hidden font-bold text-primary"
    :class="[sizeClass, shapeClass, bgClass, 'flex items-center justify-center']"
  >
    <img v-if="src" :src="src" :alt="name" class="h-full w-full object-cover" />
    <span v-else>{{ letter }}</span>
  </div>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
  name:    { type: String, default: '' },
  src:     { type: String, default: '' },
  size:    { type: String, default: 'md' },
  shape:   { type: String, default: 'circle' },
  fallback:{ type: String, default: 'U' }
});

const letter = computed(() =>
  (props.name?.trim().slice(0, 1) || props.fallback).toUpperCase()
);

const sizeClass = computed(() => ({
  'xs':  'h-6 w-6 text-[10px]',
  'sm':  'h-8 w-8 text-[11px]',
  'md':  'h-10 w-10 text-xs',
  'lg':  'h-12 w-12 text-base',
  'xl':  'h-16 w-16 text-lg',
  '2xl': 'h-24 w-24 text-2xl',
  '3xl': 'h-32 w-32 text-4xl',
}[props.size] ?? 'h-10 w-10 text-xs'));

const shapeClass = computed(() => ({
  'circle':  'rounded-full',
  'rounded': 'rounded-xl',
  'rounded-2xl': 'rounded-2xl',
  'rounded-3xl': 'rounded-3xl',
}[props.shape] ?? 'rounded-full'));

const bgClass = computed(() =>
  props.src ? 'bg-surface-container' : 'bg-primary-container/30'
);
</script>
