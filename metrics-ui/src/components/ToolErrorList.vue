<script setup lang="ts">
import { computed, ref, watch } from 'vue'

import { fetchErrors } from '@/api/client'
import { formatErrorPaste } from '@/lib/formatErrorPaste'
import type { ErrorEventRow } from '@/types/errors'
import type { MetricsWindow } from '@/types/metrics'

const props = defineProps<{
  window: MetricsWindow
}>()

const rows = ref<ErrorEventRow[]>([])
const loading = ref(true)
const loadError = ref<string | null>(null)
const copyHint = ref<string | null>(null)

const hasRows = computed(() => rows.value.length > 0)

async function load(): Promise<void> {
  loading.value = true
  loadError.value = null
  try {
    const result = await fetchErrors(props.window)
    rows.value = result.errors
  } catch (e) {
    loadError.value = e instanceof Error ? e.message : 'load failed'
  } finally {
    loading.value = false
  }
}

async function copyRow(row: ErrorEventRow): Promise<void> {
  const text = formatErrorPaste(row)
  try {
    await navigator.clipboard.writeText(text)
    copyHint.value = `Copied error #${row.id}`
  } catch {
    copyHint.value = 'Copy failed'
  }
  window.setTimeout(() => {
    copyHint.value = null
  }, 2000)
}

watch(
  () => props.window,
  () => {
    void load()
  },
  { immediate: true },
)
</script>

<template>
  <section class="mt-2 border-t border-slate-100 pt-4" aria-label="Error causes">
    <div class="mb-2 flex items-center justify-between gap-2">
      <h3 class="text-xs font-semibold uppercase tracking-wide text-slate-500">Causes</h3>
      <p v-if="copyHint" class="text-xs text-violet-600">{{ copyHint }}</p>
    </div>
    <p v-if="loading" class="text-sm text-slate-500">Loading causes…</p>
    <p v-else-if="loadError" class="text-sm text-red-600">{{ loadError }}</p>
    <p v-else-if="!hasRows" class="text-sm text-slate-500">No errors in this range.</p>
    <ul v-else class="flex flex-col gap-3">
      <li
        v-for="row in rows"
        :key="row.id"
        class="rounded-lg border border-slate-200 bg-slate-50/80 p-3 text-sm"
      >
        <div class="flex flex-wrap items-start justify-between gap-2">
          <div class="min-w-0 flex-1 space-y-1 font-mono text-xs text-slate-800">
            <p class="font-sans text-sm font-medium text-slate-900">
              {{ new Date(row.ts).toISOString().replace('T', ' ').slice(0, 19) }} UTC ·
              {{ row.tool }}
              <span v-if="row.diagnostic" class="text-violet-700"> · {{ row.diagnostic.code }}</span>
            </p>
            <p v-if="row.diagnostic?.field" class="text-slate-600">field: {{ row.diagnostic.field }}</p>
            <p v-if="row.diagnostic" class="whitespace-pre-wrap break-words text-slate-700">
              {{ row.diagnostic.message }}
            </p>
            <p v-else class="text-slate-500 italic">Message not recorded (pre-diagnostics row).</p>
            <dl v-if="row.diagnostic?.facts" class="grid gap-0.5 text-slate-600">
              <div v-for="(value, key) in row.diagnostic.facts" :key="key" class="flex gap-2">
                <dt class="shrink-0">{{ key }}:</dt>
                <dd>{{ value }}</dd>
              </div>
            </dl>
          </div>
          <button
            type="button"
            class="min-h-10 shrink-0 rounded-lg border border-slate-200 bg-white px-3 text-xs font-medium text-slate-700 hover:border-violet-300 sm:min-h-8"
            @click="copyRow(row)"
          >
            Copy
          </button>
        </div>
      </li>
    </ul>
  </section>
</template>
