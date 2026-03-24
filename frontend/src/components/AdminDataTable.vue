<template>
  <div class="overflow-hidden rounded-[2rem] border border-white/60 bg-surface-container-lowest shadow-sm">
    <div class="overflow-x-auto no-scrollbar">
      <table class="w-full border-collapse text-left">
        <thead>
          <tr class="bg-surface-container-low/60">
            <th
              v-for="column in columns"
              :key="column.key"
              class="whitespace-nowrap px-6 py-4 text-xs font-bold uppercase tracking-widest text-on-surface-variant"
              :class="column.align === 'right' ? 'text-right' : column.align === 'center' ? 'text-center' : 'text-left'"
            >
              {{ column.label }}
            </th>
          </tr>
        </thead>
        <tbody v-if="hasRows" class="divide-y divide-surface-container">
          <slot />
        </tbody>
        <tbody v-else>
          <tr>
            <td class="px-6 py-10 text-center text-slate-400" :colspan="columns.length">
              {{ emptyText }}
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup>
defineProps({
  columns: {
    type: Array,
    required: true
  },
  hasRows: {
    type: Boolean,
    default: true
  },
  emptyText: {
    type: String,
    default: '暂无数据'
  }
});
</script>
