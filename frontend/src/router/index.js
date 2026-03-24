import { createRouter, createWebHistory } from 'vue-router';
import { useSessionStore } from '../stores/session';

const routes = [
  { path: '/', redirect: '/dashboard' },
  { path: '/dashboard', component: () => import('../views/DashboardView.vue'), meta: { requiresAuth: true } },
  { path: '/review', redirect: '/review/list' },
  { path: '/reports', redirect: '/reports/list' },
  { path: '/users', redirect: '/users/list' },
  { path: '/pets', redirect: '/pets/list' },
  { path: '/audits', redirect: '/audits/list' },
  { path: '/comments', redirect: '/comments/list' },
  { path: '/settings', redirect: '/settings/list' },
  { path: '/login', component: () => import('../views/LoginView.vue'), meta: { guestOnly: true } },

  { path: '/review/list', component: () => import('../views/ReviewListView.vue'), meta: { requiresAuth: true } },
  { path: '/review/detail', component: () => import('../views/ReviewDetailView.vue'), meta: { requiresAuth: true } },

  { path: '/pets/list', component: () => import('../views/PetsListView.vue'), meta: { requiresAuth: true } },
  { path: '/pets/detail', component: () => import('../views/PetsDetailView.vue'), meta: { requiresAuth: true } },

  { path: '/reports/list', component: () => import('../views/ReportsListView.vue'), meta: { requiresAuth: true } },
  { path: '/reports/detail', component: () => import('../views/ReportsDetailView.vue'), meta: { requiresAuth: true } },

  { path: '/users/list', component: () => import('../views/UsersListView.vue'), meta: { requiresAuth: true } },
  { path: '/users/detail', component: () => import('../views/UsersDetailView.vue'), meta: { requiresAuth: true } },

  { path: '/audits/list', component: () => import('../views/AuditsListView.vue'), meta: { requiresAuth: true } },
  { path: '/audits/detail', component: () => import('../views/AuditsDetailView.vue'), meta: { requiresAuth: true } },

  { path: '/comments/list', component: () => import('../views/CommentsListView.vue'), meta: { requiresAuth: true } },

  { path: '/settings/list', component: () => import('../views/SettingsListView.vue'), meta: { requiresAuth: true } },
  { path: '/modal/style', component: () => import('../views/ModalStyleView.vue'), meta: { requiresAuth: true } },

  { path: '/design-system/one', component: () => import('../views/DesignSystemOneView.vue'), meta: { requiresAuth: true } },
  { path: '/design-system/two', component: () => import('../views/DesignSystemTwoView.vue'), meta: { requiresAuth: true } },
  { path: '/design-system/three', component: () => import('../views/DesignSystemThreeView.vue'), meta: { requiresAuth: true } }
];

export const router = createRouter({
  history: createWebHistory(),
  routes
});

router.beforeEach(async (to) => {
  const session = useSessionStore();
  if (!session.ready) {
    await session.bootstrap();
  }

  if (to.meta.requiresAuth && !session.isAuthed) {
    return '/login';
  }

  if (to.meta.guestOnly && session.isAuthed) {
    return '/review/list';
  }

  return true;
});
