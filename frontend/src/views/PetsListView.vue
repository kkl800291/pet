<template>
  <AdminLayout title="宠物档案库" subtitle="对齐 Stitch 的宠物列表页布局，突出档案数量、可见性与快速进入详情" breadcrumb="宠物管理" search-placeholder="搜索宠物 ID 或名称...">
    <template #actions>
      <button class="flex items-center gap-2 rounded-full border border-outline-variant/20 bg-surface-container-lowest px-6 py-3 font-bold text-primary transition-all hover:bg-primary-container/10" @click="exportPets">
        <span class="material-symbols-outlined">download</span>
        导出档案
      </button>
      <button class="flex items-center gap-2 rounded-full bg-primary px-6 py-3 font-bold text-on-primary shadow-lg shadow-primary/20 transition-all hover:scale-[1.02]" @click="loadPets">
        <span class="material-symbols-outlined" style="font-variation-settings: 'FILL' 1">refresh</span>
        刷新档案
      </button>
    </template>

    <div class="mb-10 grid grid-cols-1 gap-6 md:grid-cols-4">
      <AdminStatCard label="总宠物数" :value="pets.length" />
      <AdminStatCard label="公开档案" :value="publicCount" tone="primary" />
      <AdminStatCard label="关注可见" :value="followersCount" />
      <AdminStatCard label="私密档案" :value="privateCount" tone="danger" />
    </div>

    <div class="mb-6 grid grid-cols-1 gap-4 rounded-[1.75rem] bg-surface-container-low p-4 lg:grid-cols-4">
      <div>
        <label class="mb-1.5 ml-1 block text-xs font-semibold text-slate-500">可见性</label>
        <select v-model="visibilityFilter" class="w-full rounded-xl border-none bg-surface-container-lowest px-4 py-3 text-sm shadow-sm">
          <option value="">全部可见性</option>
          <option value="public">公开</option>
          <option value="followers">关注可见</option>
          <option value="private">仅自己可见</option>
        </select>
      </div>
      <div class="lg:col-span-3">
        <label class="mb-1.5 ml-1 block text-xs font-semibold text-slate-500">搜索关键词</label>
        <input v-model.trim="query" class="w-full rounded-xl border-none bg-surface-container-lowest px-4 py-3 text-sm shadow-sm" placeholder="宠物名 / 品种 / 主人 ID" />
      </div>
    </div>

    <AdminDataTable :columns="columns" :has-rows="Boolean(filteredPets.length)" empty-text="暂无宠物档案">
      <tr v-for="pet in filteredPets" :key="pet.id" class="group transition-colors hover:bg-surface-container-low">
              <td class="px-6 py-4 font-mono text-xs text-slate-500">{{ pet.id }}</td>
              <td class="px-6 py-4">
                <div class="flex items-center gap-3">
                  <div v-if="pet.avatar" class="h-10 w-10 overflow-hidden rounded-xl bg-primary-container/10">
                    <img :src="pet.avatar" alt="Pet Avatar" class="h-full w-full object-cover" />
                  </div>
                  <div v-else class="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-container/10 text-xs font-bold text-primary">
                    {{ pet.name?.slice(0, 1) || 'P' }}
                  </div>
                  <span class="font-bold text-primary">{{ pet.name }}</span>
                </div>
              </td>
              <td class="px-6 py-4 text-on-surface-variant">{{ pet.species }} · {{ pet.breed || '未知品种' }}</td>
              <td class="px-6 py-4 text-on-surface-variant">{{ pet.ownerId }}</td>
              <td class="px-6 py-4 text-center">
                <span class="rounded-full px-3 py-1 text-xs font-bold" :class="pet.visibility === 'public' ? 'bg-primary-container/20 text-primary' : pet.visibility === 'followers' ? 'bg-surface-container text-on-surface-variant' : 'bg-slate-100 text-slate-500'">
                  {{ labelOf(VISIBILITY, pet.visibility) }}
                </span>
              </td>
              <td class="px-6 py-4 text-xs text-slate-400">{{ formatDate(pet.createdAt) }}</td>
              <td class="px-6 py-4 text-right">
                <AdminTableActions :actions="actionsFor(pet)" />
              </td>
      </tr>
    </AdminDataTable>
  </AdminLayout>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import AdminLayout from '../layouts/AdminLayout.vue';
import AdminDataTable from '../components/AdminDataTable.vue';
import AdminStatCard from '../components/AdminStatCard.vue';
import AdminTableActions from '../components/AdminTableActions.vue';
import { adminApi } from '../api/admin';
import { VISIBILITY, formatDate, labelOf } from '../assets/labels';

const router = useRouter();
const pets = ref([]);
const visibilityFilter = ref('');
const query = ref('');
const columns = [
  { key: 'id', label: '宠物 ID' },
  { key: 'profile', label: '宠物信息' },
  { key: 'breed', label: '品种' },
  { key: 'owner', label: '主人' },
  { key: 'visibility', label: '可见性', align: 'center' },
  { key: 'createdAt', label: '创建时间' },
  { key: 'actions', label: '操作', align: 'right' }
];

const publicCount = computed(() => pets.value.filter((v) => v.visibility === 'public').length);
const followersCount = computed(() => pets.value.filter((v) => v.visibility === 'followers').length);
const privateCount = computed(() => pets.value.filter((v) => v.visibility === 'private').length);
const filteredPets = computed(() => pets.value.filter((pet) => {
  const passVisibility = visibilityFilter.value ? pet.visibility === visibilityFilter.value : true;
  const haystack = `${pet.name || ''} ${pet.breed || ''} ${pet.ownerId || ''}`.toLowerCase();
  const passQuery = query.value ? haystack.includes(query.value.toLowerCase()) : true;
  return passVisibility && passQuery;
}));

async function loadPets() {
  const data = await adminApi.pets();
  pets.value = data.items || [];
}

function openDetail(id) {
  router.push(`/pets/detail?id=${id}`);
}

function actionsFor(pet) {
  return [{ label: '详情', icon: 'visibility', tone: 'primary', onClick: () => openDetail(pet.id) }];
}

function exportPets() {
  const headers = ['宠物ID', '宠物名', '物种', '品种', '主人ID', '可见性', '创建时间'];
  const rows = filteredPets.value.map((pet) => [
    pet.id,
    pet.name,
    pet.species,
    pet.breed || '',
    pet.ownerId,
    labelOf(VISIBILITY, pet.visibility),
    formatDate(pet.createdAt)
  ]);
  const csv = [headers, ...rows]
    .map((row) => row.map((cell) => `"${String(cell ?? '').replaceAll('"', '""')}"`).join(','))
    .join('\n');

  const blob = new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `pets-${new Date().toISOString().slice(0, 10)}.csv`;
  link.click();
  URL.revokeObjectURL(link.href);
}

onMounted(loadPets);
</script>
