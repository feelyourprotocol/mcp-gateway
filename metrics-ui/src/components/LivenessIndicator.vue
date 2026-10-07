<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue'

import { fetchLivenessCurrent } from '@/api/client'
import type { LivenessState } from '@/types/liveness'

const POLL_MS = 30_000

const state = ref<LivenessState>('down')
const message = ref('Loading…')
const error = ref<string | null>(null)

const dotClass: Record<LivenessState, string> = {
  up: 'bg-emerald-500 shadow-[0_0_0_3px_rgba(16,185,129,0.35)]',
  degraded: 'bg-amber-500 shadow-[0_0_0_3px_rgba(245,158,11,0.35)]',
  down: 'bg-red-500 shadow-[0_0_0_3px_rgba(239,68,68,0.35)]',
}

const label: Record<LivenessState, string> = {
  up: 'MCP up',
  degraded: 'MCP degraded',
  down: 'MCP down',
}

let timer: ReturnType<typeof window.setInterval> | undefined

async function refresh(): Promise<void> {
  try {
    const status = await fetchLivenessCurrent()
    state.value = status.state
    message.value = status.message
    error.value = null
  } catch (e) {
    state.value = 'down'
    message.value = 'Could not load liveness status.'
    error.value = e instanceof Error ? e.message : 'error'
  }
}

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
    :title="message"
    data-testid="liveness-indicator"
  >
    <span
      class="size-3 shrink-0 rounded-full"
      :class="dotClass[state]"
      role="status"
      :aria-label="label[state]"
    />
    <span class="hidden font-medium sm:inline">{{ label[state] }}</span>
    <span v-if="error" class="sr-only">{{ error }}</span>
  </div>
</template>
