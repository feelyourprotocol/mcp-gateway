<script setup lang="ts">
import { computed, inject, type Ref } from 'vue'

import MetricCardGrid from '@/components/MetricCardGrid.vue'
import type { CardDefinition, MetricsWindow } from '@/types/metrics'

const cards = inject<Ref<CardDefinition[]>>('dashboardCards')!
const window = inject<Ref<MetricsWindow>>('metricsWindow')!
const pinnedIds = inject<Ref<string[]>>('pinnedCardIds')!
const reorderPinned = inject<(from: number, to: number) => void>('reorderPinned')!

const pinnedCards = computed(() => {
  const byId = new Map(cards.value.map((card) => [card.id, card]))
  return pinnedIds.value
    .map((id) => byId.get(id))
    .filter((card): card is CardDefinition => card !== undefined)
})
</script>

<template>
  <div>
    <MetricCardGrid
      :cards="pinnedCards"
      :window="window"
      reorderable
      empty-message="No pinned widgets yet — open a section and pin the cards you use most."
      @reorder="reorderPinned"
    />
  </div>
</template>
