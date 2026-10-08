<script setup lang="ts">
import { onMounted, provide, ref } from 'vue'
import { RouterView } from 'vue-router'
import { ChartBarSquareIcon } from '@heroicons/vue/24/outline'

import { fetchCards } from '@/api/client'
import CardHelpPopover from '@/components/CardHelpPopover.vue'
import DashboardNav from '@/components/DashboardNav.vue'
import ErrorHealthIndicator from '@/components/ErrorHealthIndicator.vue'
import LivenessIndicator from '@/components/LivenessIndicator.vue'
import { loadPinnedCardIds, savePinnedCardIds } from '@/lib/pinnedCards'
import type { CardDefinition, MetricsWindow } from '@/types/metrics'

const RANGE_HELP =
  'Range: how far back the dashboard looks. 24h, 7d, and 30d change every headline. Hour, Day, and Week on a card only change how that chart is drawn.'

const cards = ref<CardDefinition[]>([])
const window = ref<MetricsWindow>('7d')
const loadError = ref<string | null>(null)
const pinnedCardIds = ref<string[]>(loadPinnedCardIds())

const windows: { id: MetricsWindow; label: string }[] = [
  { id: '24h', label: '24h' },
  { id: '7d', label: '7d' },
  { id: '30d', label: '30d' },
]

function togglePin(cardId: string): void {
  if (pinnedCardIds.value.includes(cardId)) {
    pinnedCardIds.value = pinnedCardIds.value.filter((id) => id !== cardId)
  } else {
    pinnedCardIds.value = [...pinnedCardIds.value, cardId]
  }
  savePinnedCardIds(pinnedCardIds.value)
}

provide('dashboardCards', cards)
provide('metricsWindow', window)
provide('pinnedCardIds', pinnedCardIds)
provide('togglePin', togglePin)

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
    <div class="sticky top-0 z-20 border-b border-slate-200 bg-white/90 backdrop-blur-sm">
      <header>
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
          <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-3">
            <div class="flex flex-wrap gap-2">
              <LivenessIndicator />
              <ErrorHealthIndicator :window="window" />
            </div>
            <div class="flex items-center gap-1">
              <CardHelpPopover label="About the range" align="end" :text="RANGE_HELP" />
              <div class="flex flex-1 gap-2" role="group" aria-label="Range">
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
          </div>
        </div>
      </header>
      <DashboardNav />
    </div>

    <main class="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-8">
      <p v-if="loadError" class="text-red-600">{{ loadError }}</p>
      <RouterView v-else />
    </main>
  </div>
</template>
