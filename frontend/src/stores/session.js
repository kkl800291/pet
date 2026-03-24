import { defineStore } from 'pinia';
import { adminApi } from '../api/admin';

export const useSessionStore = defineStore('session', {
  state: () => ({
    ready: false,
    admin: null
  }),
  getters: {
    isAuthed: (state) => Boolean(state.admin)
  },
  actions: {
    async bootstrap() {
      try {
        const data = await adminApi.me();
        this.admin = data?.admin || null;
      } catch {
        this.admin = null;
      } finally {
        this.ready = true;
      }
    },
    async refresh() {
      this.ready = false;
      await this.bootstrap();
    },
    async logout() {
      try {
        await adminApi.logout();
      } finally {
        this.admin = null;
      }
    }
  }
});
