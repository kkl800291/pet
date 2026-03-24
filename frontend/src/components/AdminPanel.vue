<template>
  <section class="rounded-2xl bg-surface-container-lowest p-6 shadow-sm" :class="panelClass">
    <div v-if="title || subtitle || $slots.header" class="mb-6">
      <slot name="header">
        <div class="flex items-start gap-4">
          <div v-if="icon" class="rounded-xl bg-emerald-50 p-2 text-emerald-600">
            <span class="material-symbols-outlined">{{ icon }}</span>
          </div>
          <div>
            <h3 v-if="title" class="text-base font-bold text-slate-800">{{ title }}</h3>
            <p v-if="subtitle" class="mt-1 text-sm text-on-surface-variant">{{ subtitle }}</p>
          </div>
        </div>
      </slot>
    </div>
    <slot />
  </section>
</template>

<script setup>
defineProps({
  title: { type: String, default: '' },
  subtitle: { type: String, default: '' },
  icon: { type: String, default: '' },
  panelClass: { type: String, default: '' }
});
</script>
