<template>
  <div class="min-h-screen bg-surface flex items-center justify-center p-6">
    <div class="w-full max-w-md bg-surface-container-lowest rounded-2xl shadow-lg border border-outline-variant/20 p-8">
      <div class="flex items-center gap-3 mb-6">
        <div class="w-11 h-11 rounded-xl bg-primary flex items-center justify-center text-on-primary">
          <span class="material-symbols-outlined">pets</span>
        </div>
        <div>
          <h1 class="text-xl font-extrabold text-[#006853]">宠社管理系统</h1>
          <p class="text-xs text-slate-400 uppercase tracking-widest">v3.0 专业版</p>
        </div>
      </div>

      <form class="space-y-4" @submit.prevent="onSubmit">
        <label class="block">
          <span class="text-xs font-semibold text-slate-500">邮箱</span>
          <input v-model.trim="form.email" class="mt-1 w-full rounded-xl border-none bg-surface-container-low px-4 py-3 text-sm focus:ring-2 focus:ring-primary-container" type="email" required>
        </label>
        <label class="block">
          <span class="text-xs font-semibold text-slate-500">密码</span>
          <input v-model="form.password" class="mt-1 w-full rounded-xl border-none bg-surface-container-low px-4 py-3 text-sm focus:ring-2 focus:ring-primary-container" type="password" required>
        </label>

        <button class="w-full rounded-xl bg-primary text-on-primary py-3 text-sm font-bold shadow-lg shadow-primary/20 hover:bg-primary-dim transition-all" :disabled="submitting" type="submit">
          {{ submitting ? '登录中...' : '登录后台' }}
        </button>
      </form>

      <p v-if="error" class="mt-4 text-sm text-error">{{ error }}</p>
      <p class="mt-3 text-xs text-slate-400">演示账号：admin@pet.local / admin123</p>
    </div>
  </div>
</template>

<script setup>
import { reactive, ref } from 'vue';
import { useRouter } from 'vue-router';
import { adminApi } from '../api/admin';
import { useSessionStore } from '../stores/session';

const router = useRouter();
const session = useSessionStore();

const form = reactive({
  email: 'admin@pet.local',
  password: 'admin123'
});

const submitting = ref(false);
const error = ref('');

async function onSubmit() {
  submitting.value = true;
  error.value = '';
  try {
    await adminApi.login(form);
    await session.refresh();
    router.replace('/review/list');
  } catch (err) {
    error.value = err.message || '登录失败';
  } finally {
    submitting.value = false;
  }
}
</script>
