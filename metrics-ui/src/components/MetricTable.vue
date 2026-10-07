<script setup lang="ts">
import { computed } from 'vue'

import type { ClientGroup } from '@/lib/clientTable'
import { clientTableRows } from '@/lib/clientTable'
import type { CardQueryResult } from '@/types/metrics'

const props = defineProps<{
  result: CardQueryResult
  group?: ClientGroup
}>()

const group = computed(() => props.group ?? 'version')
const rows = computed(() => clientTableRows(props.result, group.value))
</script>

<template>
  <div class="h-64 overflow-hidden rounded-lg border border-slate-200">
    <div class="h-full overflow-y-auto">
      <table class="min-w-full text-sm">
        <thead
          class="sticky top-0 z-10 bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-600 shadow-[0_1px_0_0_rgb(226_232_240)]"
        >
          <tr>
            <th class="px-3 py-2">Client</th>
            <th class="px-3 py-2">{{ group === 'client' ? 'Versions' : 'Version' }}</th>
            <th class="px-3 py-2 text-right">Sessions</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-slate-100">
          <tr v-for="(row, index) in rows" :key="index" class="text-slate-800">
            <td class="px-3 py-2 font-medium">{{ row.client }}</td>
            <td class="px-3 py-2 font-mono text-xs text-slate-600">
              {{ group === 'client' ? row.versions : row.version }}
            </td>
            <td class="px-3 py-2 text-right font-mono tabular-nums">{{ row.sessions }}</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>
