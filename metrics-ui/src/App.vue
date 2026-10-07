<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { ChartBarSquareIcon } from '@heroicons/vue/24/outline'

import { fetchCards } from '@/api/client'
import MetricCard from '@/components/MetricCard.vue'
import type { CardDefinition, MetricsWindow } from '@/types/metrics'

const cards = ref<CardDefinition[]>([])
const window = ref<MetricsWindow>('7d')
const loadError = ref<string | null>(null)

const windows: { id: MetricsWindow; label: string }[] = [
  { id: '24h', label: '24h' },
  { id: '7d', label: '7d' },
  { id: '30d', label: '30d' },
]

onMounted(async () => {
  try {
    cards.value = await fetchCards()
  } catch (e) {
    loadError.value = e instanceof Error ? e.message : 'failed'
  }
})
</script>

<template>
  <div class="min-h-screen">
    <header class="border-b border-slate-200 bg-white/90 backdrop-blur-sm sticky top-0 z-10">
      <div
        class="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6"
      >
        <div class="flex items-center gap-2">
          <ChartBarSquareIcon class="size-6 text-violet-600" aria-hidden="true" />
          <div>
            <p class="text-xs font-medium uppercase tracking-widest text-slate-500">
              Feel Your Protocol
            </p>
            <h1 class="text-lg font-semibold text-slate-900">MCP usage</h1>
          </div>
        </div>
        <div class="flex gap-2" role="group" aria-label="Time window">
          <button
            v-for="w in windows"
            :key="w.id"
            type="button"
            class="min-h-11 flex-1 rounded-lg px-4 text-sm font-medium sm:min-h-9 sm:flex-none"
            :class="
              window === w.id
                ? 'bg-gradient-to-r from-violet-600 to-cyan-500 text-white shadow-sm'
                : 'border border-slate-200 bg-white text-slate-700 hover:border-slate-300'
            "
            @click="window = w.id"
          >
            {{ w.label }}
          </button>
        </div>
      </div>
    </header>

    <main class="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-8">
      <p v-if="loadError" class="text-red-600">{{ loadError }}</p>
      <div v-else class="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <MetricCard
          v-for="card in cards"
          :key="card.id"
          :card="card"
          :window="window"
          :class="card.fullWidth ? 'lg:col-span-2' : undefined"
        />
      </div>
    </main>
  </div>
</template>
