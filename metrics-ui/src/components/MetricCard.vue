<script setup lang="ts">
import { computed, ref, watch } from 'vue'

import { fetchCardQuery } from '@/api/client'
import CardHelpPopover from '@/components/CardHelpPopover.vue'
import MetricChart from '@/components/MetricChart.vue'
import MetricTable from '@/components/MetricTable.vue'
import type { CardDefinition, CardQueryResult, MetricsGrain, MetricsWindow } from '@/types/metrics'
import { headlineValue } from '@/lib/toChartOption'

const props = defineProps<{
  card: CardDefinition
  window: MetricsWindow
}>()

const grain = ref<MetricsGrain>(props.card.defaultGrain)
const result = ref<CardQueryResult | null>(null)
const loading = ref(true)
const error = ref<string | null>(null)

const headline = computed(() => {
  if (!result.value) {
    return '—'
  }
  return headlineValue(result.value, props.card)
})

const headlineSuffix = computed(() => {
  if (props.card.measure === 'sum_micro_usdc') {
    return ' USDC'
  }
  if (props.card.measure === 'uptime_percent') {
    return '%'
  }
  return ''
})

async function load(): Promise<void> {
  loading.value = true
  error.value = null
  try {
    result.value = await fetchCardQuery(props.card.id, props.window, grain.value)
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'load failed'
  } finally {
    loading.value = false
  }
}

watch(
  () => [props.card.id, props.window, grain.value] as const,
  () => {
    void load()
  },
  { immediate: true },
)

watch(
  () => props.window,
  () => {
    grain.value = props.card.defaultGrain
  },
)
</script>

<template>
  <article
    class="flex flex-col gap-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5"
    :data-card-id="card.id"
  >
    <header class="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
      <div>
        <div class="flex flex-wrap items-center gap-1">
          <h2 class="text-sm font-semibold text-slate-800">{{ card.title }}</h2>
          <CardHelpPopover v-if="card.helpText" :text="card.helpText" />
        </div>
        <p class="font-mono text-2xl font-bold tabular-nums text-slate-900">
          {{ headline
          }}<span class="text-base font-normal text-slate-500">{{ headlineSuffix }}</span>
        </p>
      </div>
      <div
        v-if="!card.hideGrainControls"
        class="flex flex-wrap gap-2"
        role="group"
        aria-label="Time grain"
      >
        <button
          v-for="g in card.grains"
          :key="g"
          type="button"
          class="min-h-11 rounded-lg px-3 text-xs font-medium uppercase tracking-wide transition sm:min-h-8"
          :class="
            grain === g
              ? 'bg-gradient-to-r from-violet-600 to-cyan-500 text-white shadow-sm'
              : 'border border-slate-200 bg-slate-50 text-slate-600 hover:border-slate-300'
          "
          @click="grain = g"
        >
          {{ g }}
        </button>
      </div>
    </header>

    <p v-if="loading" class="text-sm text-slate-500">Loading…</p>
    <p v-else-if="error" class="text-sm text-red-600">{{ error }}</p>
    <p
      v-else-if="result?.isEmpty && card.emptyHint"
      class="rounded-lg border border-dashed border-slate-200 bg-slate-50 px-4 py-8 text-center text-sm text-slate-500"
    >
      {{ card.emptyHint }}
    </p>
    <MetricTable v-else-if="result && card.chart === 'table'" :result="result" />
    <MetricChart v-else-if="result" :card="card" :result="result" />
  </article>
</template>
