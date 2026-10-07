<script setup lang="ts">
import { computed } from 'vue'

import type { CardQueryResult } from '@/types/metrics'

const props = defineProps<{
  result: CardQueryResult
}>()

const rows = computed(() =>
  props.result.series.map((row) => {
    const [client, version] = row.series.split('\t')
    return {
      client: client ?? row.series,
      version: version ?? '—',
      sessions: row.value,
    }
  }),
)
</script>

<template>
  <div class="overflow-x-auto rounded-lg border border-slate-200">
    <table class="min-w-full text-sm">
      <thead
        class="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-600"
      >
        <tr>
          <th class="px-4 py-3">Client</th>
          <th class="px-4 py-3">Version</th>
          <th class="px-4 py-3 text-right">Sessions</th>
        </tr>
      </thead>
      <tbody class="divide-y divide-slate-100">
        <tr v-for="(row, index) in rows" :key="index" class="text-slate-800">
          <td class="px-4 py-3 font-medium">{{ row.client }}</td>
          <td class="px-4 py-3 font-mono text-slate-600">{{ row.version }}</td>
          <td class="px-4 py-3 text-right font-mono tabular-nums">{{ row.sessions }}</td>
        </tr>
      </tbody>
    </table>
  </div>
</template>
