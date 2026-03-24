<template>
  <AdminLayout title="宠物管理详情" subtitle="查看宠物档案、主人信息和关联社区动态" breadcrumb="宠物详情" search-placeholder="搜索宠物...">
    <div v-if="item" class="space-y-6">
      <AdminBackButton @click="goList" />

      <div class="grid grid-cols-1 gap-6 xl:grid-cols-12">
        <section class="space-y-6 xl:col-span-8">
        <article class="rounded-3xl bg-surface-container-lowest p-6 shadow-sm">
          <div class="flex flex-col gap-6 md:flex-row md:items-center">
            <div v-if="item.avatar" class="h-24 w-24 overflow-hidden rounded-3xl ring-4 ring-primary-container/20">
              <img :src="item.avatar" alt="Pet Avatar" class="h-full w-full object-cover" />
            </div>
            <div v-else class="flex h-24 w-24 items-center justify-center rounded-3xl bg-primary-container/20 text-3xl font-bold text-primary ring-4 ring-primary-container/20">
              {{ item.name?.slice(0, 1) || 'P' }}
            </div>
            <div class="flex-1">
              <h2 class="text-2xl font-extrabold text-primary">{{ item.name }}</h2>
              <p class="mt-1 text-sm text-on-surface-variant">{{ item.species }} · {{ item.breed || '未知品种' }}</p>
              <div class="mt-4 grid grid-cols-1 gap-4 md:grid-cols-3">
                <div class="rounded-2xl bg-surface-container-low p-4">
                  <p class="text-xs uppercase tracking-widest text-slate-400">可见性</p>
                  <p class="mt-2 font-bold">{{ labelOf(VISIBILITY, item.visibility) }}</p>
                </div>
                <div class="rounded-2xl bg-surface-container-low p-4">
                  <p class="text-xs uppercase tracking-widest text-slate-400">年龄 / 性别</p>
                  <p class="mt-2 font-bold">{{ item.age || '-' }} 岁 · {{ item.sex || '-' }}</p>
                </div>
                <div class="rounded-2xl bg-surface-container-low p-4">
                  <p class="text-xs uppercase tracking-widest text-slate-400">创建时间</p>
                  <p class="mt-2 font-bold">{{ formatDate(item.createdAt) }}</p>
                </div>
              </div>
            </div>
          </div>
        </article>

        <article class="rounded-3xl bg-surface-container-lowest p-6 shadow-sm">
          <h3 class="mb-4 text-base font-bold">成长标签与备注</h3>
          <div class="mb-4 flex flex-wrap gap-2">
            <span v-for="tag in item.tags || []" :key="tag" class="rounded-full bg-primary-container/20 px-3 py-1 text-xs font-bold text-primary">{{ tag }}</span>
            <span v-if="!(item.tags || []).length" class="rounded-full bg-surface-container px-3 py-1 text-xs font-bold text-on-surface-variant">暂无标签</span>
          </div>
          <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div class="rounded-2xl bg-surface-container-low p-4">
              <p class="text-xs uppercase tracking-widest text-slate-400">习惯</p>
              <p class="mt-2 text-sm leading-7 text-on-surface">{{ item.habits || '暂无习惯记录' }}</p>
            </div>
            <div class="rounded-2xl bg-surface-container-low p-4">
              <p class="text-xs uppercase tracking-widest text-slate-400">备注</p>
              <p class="mt-2 text-sm leading-7 text-on-surface">{{ item.notes || '暂无备注' }}</p>
            </div>
          </div>
        </article>

        <article class="rounded-3xl bg-surface-container-lowest p-6 shadow-sm">
          <h3 class="mb-4 text-base font-bold">关联社区动态</h3>
          <div class="space-y-4">
            <div v-for="post in relatedPosts.slice(0, 3)" :key="post.id" class="rounded-2xl bg-surface-container-low/50 p-4">
              <div class="mb-2 flex items-center justify-between">
                <span class="rounded-full bg-primary-container/20 px-3 py-1 text-xs font-bold text-primary">{{ post.title }}</span>
                <span class="text-xs text-on-surface-variant">{{ formatDate(post.createdAt) }}</span>
              </div>
              <p class="text-sm leading-7 text-on-surface">{{ post.content }}</p>
            </div>
            <div v-if="!relatedPosts.length" class="rounded-2xl bg-surface-container-low/50 p-6 text-center text-sm text-slate-400">暂无关联动态</div>
          </div>
        </article>
        </section>

        <aside class="space-y-6 xl:col-span-4">
        <article class="rounded-3xl bg-surface-container-lowest p-6 shadow-sm">
          <h3 class="mb-6 text-base font-bold text-emerald-900">主人档案</h3>
          <div v-if="owner" class="space-y-4">
            <div class="flex items-center gap-4">
              <div class="flex h-14 w-14 items-center justify-center rounded-full border-2 border-emerald-50 bg-primary-container/30 text-lg font-bold text-primary">
                {{ owner.name?.slice(0, 1) || 'U' }}
              </div>
              <div>
                <p class="font-bold">{{ owner.name }}</p>
                <p class="text-sm text-on-surface-variant">{{ owner.phone }}</p>
              </div>
            </div>
            <AdminActionButton label="查看用户详情" tone="primary" full-width @click="router.push(`/users/detail?id=${owner.id}`)" />
          </div>
          <p v-else class="text-sm text-slate-400">未找到主人信息</p>
        </article>

        <article class="rounded-3xl bg-primary p-6 text-on-primary shadow-xl">
          <h3 class="font-bold">社区影响力</h3>
          <div class="mt-4 grid grid-cols-2 gap-4">
            <div class="rounded-xl bg-white/10 p-3 backdrop-blur-md">
              <p class="text-[11px] uppercase tracking-widest opacity-70">Posts</p>
              <p class="mt-2 text-2xl font-bold">{{ relatedPosts.length }}</p>
            </div>
            <div class="rounded-xl bg-white/10 p-3 backdrop-blur-md">
              <p class="text-[11px] uppercase tracking-widest opacity-70">Visibility</p>
              <p class="mt-2 text-lg font-bold">{{ labelOf(VISIBILITY, item.visibility) }}</p>
            </div>
          </div>
        </article>
        </aside>
      </div>
    </div>
    <div v-else class="rounded-2xl border border-outline-variant/10 bg-surface-container-lowest p-12 text-center text-slate-400">未找到宠物</div>
  </AdminLayout>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import AdminLayout from '../layouts/AdminLayout.vue';
import AdminActionButton from '../components/AdminActionButton.vue';
import AdminBackButton from '../components/AdminBackButton.vue';
import { adminApi } from '../api/admin';
import { VISIBILITY, formatDate, labelOf } from '../assets/labels';

const route = useRoute();
const router = useRouter();
const pet = ref(null);
const posts = ref([]);
const ownerRecord = ref(null);

const item = computed(() => pet.value);

const relatedPosts = computed(() => item.value ? posts.value.filter((p) => p.petId === item.value.id) : []);
const owner = computed(() => ownerRecord.value);

async function loadData() {
  const id = String(route.query.id || '');
  if (!id) {
    pet.value = null;
    posts.value = [];
    ownerRecord.value = null;
    return;
  }
  try {
    const data = await adminApi.petDetail(id);
    pet.value = data.pet || null;
    posts.value = data.posts || [];
    ownerRecord.value = data.owner || null;
  } catch (error) {
    if (error.message === 'not_found') {
      pet.value = null;
      posts.value = [];
      ownerRecord.value = null;
      return;
    }
    throw error;
  }
}

function goList() {
  router.push('/pets/list');
}

onMounted(loadData);
</script>
