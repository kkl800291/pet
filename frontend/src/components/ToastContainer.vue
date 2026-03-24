<template>
  <Teleport to="body">
    <div class="pointer-events-none fixed bottom-6 right-6 z-[9999] flex flex-col gap-2">
      <TransitionGroup name="toast">
        <div
          v-for="toast in toasts"
          :key="toast.id"
          class="pointer-events-auto flex min-w-[280px] max-w-sm items-start gap-3 rounded-2xl px-4 py-3 shadow-lg shadow-slate-900/10 backdrop-blur-sm"
          :class="toneClass(toast.tone)"
        >
          <span class="material-symbols-outlined mt-0.5 shrink-0 text-lg" :style="`font-variation-settings: 'FILL' 1`">
            {{ toneIcon(toast.tone) }}
          </span>
          <p class="flex-1 text-sm font-semibold leading-5">{{ toast.message }}</p>
          <button class="shrink-0 opacity-60 transition-opacity hover:opacity-100" @click="dismiss(toast.id)">
            <span class="material-symbols-outlined text-base">close</span>
          </button>
        </div>
      </TransitionGroup>
    </div>
  </Teleport>
</template>

<script setup>
import { useToast } from '../composables/useToast';

const { toasts, dismiss } = useToast();

function toneClass(tone) {
  if (tone === 'error') return 'bg-error text-white';
  return 'bg-on-surface text-surface';
}

function toneIcon(tone) {
  if (tone === 'error') return 'error';
  return 'check_circle';
}
</script>

<style scoped>
.toast-enter-active,
.toast-leave-active {
  transition: all 0.25s ease;
}
.toast-enter-from {
  opacity: 0;
  transform: translateY(12px) scale(0.96);
}
.toast-leave-to {
  opacity: 0;
  transform: translateX(16px);
}
</style>
