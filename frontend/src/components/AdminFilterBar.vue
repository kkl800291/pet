<template>
  <div class="mb-6 grid grid-cols-1 gap-4 rounded-[1.75rem] bg-surface-container-low p-4" :class="`lg:grid-cols-${cols}`">
    <slot />
  </div>
</template>

<script setup>
defineProps({
  cols: { type: Number, default: 4 }
});
</script>
