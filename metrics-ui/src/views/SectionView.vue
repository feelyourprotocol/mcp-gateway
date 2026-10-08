<script setup lang="ts">
import { computed, inject, type Ref } from 'vue'

import MetricCardGrid from '@/components/MetricCardGrid.vue'
import { cardsForSection, type DashboardSectionId } from '@/lib/dashboardSections'
import type { CardDefinition, MetricsWindow } from '@/types/metrics'

const props = defineProps<{
  sectionId: DashboardSectionId
}>()

const cards = inject<Ref<CardDefinition[]>>('dashboardCards')!
const window = inject<Ref<MetricsWindow>>('metricsWindow')!

const sectionCards = computed(() => {
  const ids = cards.value.map((card) => card.id)
  const sectionIds = cardsForSection(props.sectionId, ids)
  const byId = new Map(cards.value.map((card) => [card.id, card]))
  return sectionIds
    .map((id) => byId.get(id))
    .filter((card): card is CardDefinition => card !== undefined)
})
</script>

<template>
  <MetricCardGrid :cards="sectionCards" :window="window" />
</template>
