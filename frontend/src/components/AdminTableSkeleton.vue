<template>
  <div class="overflow-hidden rounded-[2rem] border border-slate-100 bg-white shadow-sm">
    <table class="w-full text-left">
      <thead>
        <tr class="border-b border-slate-100 bg-slate-50/60">
          <th v-for="i in cols" :key="i" class="px-6 py-4">
            <div class="h-3 w-20 animate-pulse rounded-full bg-slate-200" />
          </th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="r in rows" :key="r" class="border-b border-slate-50">
          <td v-for="c in cols" :key="c" class="px-6 py-5">
            <div class="h-4 animate-pulse rounded-full bg-slate-100" :style="{ width: `${48 + ((r * c * 37) % 40)}%` }" />
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script setup>
defineProps({
  rows: { type: Number, default: 6 },
  cols: { type: Number, default: 5 }
});
</script>
