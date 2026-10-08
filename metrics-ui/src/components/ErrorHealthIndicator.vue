<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'

import { fetchErrors } from '@/api/client'
import type { MetricsWindow } from '@/types/metrics'

const POLL_MS = 30_000

const props = defineProps<{
  window: MetricsWindow
}>()

const total = ref<number | null>(null)
const loadError = ref<string | null>(null)

const isGreen = computed(() => total.value === 0)

let timer: number | undefined

async function refresh(): Promise<void> {
  try {
    const result = await fetchErrors(props.window)
    total.value = result.totalInWindow
    loadError.value = null
  } catch (e) {
    total.value = null
    loadError.value = e instanceof Error ? e.message : 'error'
  }
}

watch(
  () => props.window,
  () => {
    void refresh()
  },
)

onMounted(() => {
  void refresh()
  timer = window.setInterval(() => {
    void refresh()
  }, POLL_MS)
})

onUnmounted(() => {
  if (timer !== undefined) {
    window.clearInterval(timer)
  }
})
</script>

<template>
  <div
    class="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700"
    :title="
      loadError
        ? 'Could not load error count'
        : isGreen
          ? 'No tool errors in the selected range'
          : `${total} tool error(s) in the selected range`
    "
    data-testid="error-health-indicator"
  >
    <span
      class="size-3 shrink-0 rounded-full"
      :class="
        loadError || total === null
          ? 'bg-slate-400'
          : isGreen
            ? 'bg-emerald-500 shadow-[0_0_0_3px_rgba(16,185,129,0.35)]'
            : 'bg-red-500 shadow-[0_0_0_3px_rgba(239,68,68,0.35)]'
      "
      role="status"
      :aria-label="isGreen ? 'No tool errors' : `Tool errors: ${total}`"
    />
    <span class="font-mono tabular-nums">
      <span class="hidden font-sans font-medium sm:inline">Errors </span>{{ total ?? '—' }}
    </span>
  </div>
</template>
