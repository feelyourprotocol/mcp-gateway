<script setup lang="ts">
import { computed, inject, ref, watch, type Ref } from 'vue'
import { StarIcon } from '@heroicons/vue/24/outline'
import { StarIcon as StarIconSolid } from '@heroicons/vue/24/solid'

import { fetchCardQuery } from '@/api/client'
import CardHelpPopover from '@/components/CardHelpPopover.vue'
import MetricChart from '@/components/MetricChart.vue'
import ToolErrorList from '@/components/ToolErrorList.vue'
import MetricTable from '@/components/MetricTable.vue'
import type { ClientGroup } from '@/lib/clientTable'
import { clientTableRows } from '@/lib/clientTable'
import { grainForWindow } from '@/lib/grainForWindow'
import { headlineValue } from '@/lib/toChartOption'
import type { CardDefinition, CardQueryResult, MetricsGrain, MetricsWindow } from '@/types/metrics'

const SCALE_HELP =
  'Scale: how this card splits the range selected at the top. Hour, Day, and Week redraw the chart. The headline stays the total for that range.'
const GROUP_HELP =
  'Group: Versions keeps one row per name and version, and the headline counts those pairs. Clients merges every version of a name into one row, and the headline counts names.'

const props = defineProps<{
  card: CardDefinition
  window: MetricsWindow
  showPin?: boolean
}>()

const pinnedCardIds = inject<Ref<string[]> | null>('pinnedCardIds', null)
const togglePin = inject<((cardId: string) => void) | null>('togglePin', null)

const isPinned = computed(() => pinnedCardIds?.value.includes(props.card.id) ?? false)

function onTogglePin(): void {
  togglePin?.(props.card.id)
}

const grain = ref<MetricsGrain>(grainForWindow(props.card, props.window))
const clientGroup = ref<ClientGroup>('version')
const result = ref<CardQueryResult | null>(null)
const loading = ref(true)
const error = ref<string | null>(null)

const headline = computed(() => {
  if (!result.value) {
    return '—'
  }
  if (props.card.id === 'clients') {
    return String(clientTableRows(result.value, clientGroup.value).length)
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
    grain.value = grainForWindow(props.card, props.window)
  },
)
</script>

<template>
  <article
    class="flex h-full flex-col gap-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5"
    :data-card-id="card.id"
  >
    <header class="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
      <div>
        <div class="flex flex-wrap items-center gap-1">
          <h2 class="text-sm font-semibold text-slate-800">{{ card.title }}</h2>
          <CardHelpPopover v-if="card.helpText" :text="card.helpText" />
          <button
            v-if="showPin && togglePin"
            type="button"
            class="ml-1 min-h-9 rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 hover:text-violet-700 sm:min-h-8"
            :aria-pressed="isPinned"
            :aria-label="isPinned ? 'Unpin from home' : 'Pin to home'"
            @click="onTogglePin"
          >
            <StarIconSolid v-if="isPinned" class="size-4 text-amber-500" aria-hidden="true" />
            <StarIcon v-else class="size-4" aria-hidden="true" />
          </button>
        </div>
        <p class="font-mono text-2xl font-bold tabular-nums text-slate-900">
          {{ headline
          }}<span class="text-base font-normal text-slate-500">{{ headlineSuffix }}</span>
        </p>
      </div>
      <div v-if="card.id === 'clients'" class="flex items-center gap-1">
        <CardHelpPopover label="About grouping" align="end" :text="GROUP_HELP" />
        <div class="flex flex-wrap gap-2" role="group" aria-label="Group">
          <button
            v-for="mode in ['client', 'version'] as const"
            :key="mode"
            type="button"
            class="min-h-11 rounded-lg px-3 text-xs font-medium transition sm:min-h-8"
            :class="
              clientGroup === mode
                ? 'bg-gradient-to-r from-violet-600 to-cyan-500 text-white shadow-sm'
                : 'border border-slate-200 bg-slate-50 text-slate-600 hover:border-slate-300'
            "
            :aria-pressed="clientGroup === mode"
            @click="clientGroup = mode"
          >
            {{ mode === 'client' ? 'Clients' : 'Versions' }}
          </button>
        </div>
      </div>
      <div v-else-if="!card.hideGrainControls" class="flex items-center gap-1">
        <CardHelpPopover label="About the scale" align="end" :text="SCALE_HELP" />
        <div class="flex flex-wrap gap-2" role="group" aria-label="Scale">
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
    <MetricTable
      v-else-if="result && card.chart === 'table'"
      :result="result"
      :group="card.id === 'clients' ? clientGroup : 'version'"
    />
    <MetricChart v-else-if="result" :card="card" :result="result" />
    <ToolErrorList v-if="card.id === 'tool-errors' && !loading && !error" :window="window" />
  </article>
</template>
