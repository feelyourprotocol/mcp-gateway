<script setup lang="ts">
import MetricCard from '@/components/MetricCard.vue'
import type { CardDefinition, MetricsWindow } from '@/types/metrics'

defineProps<{
  cards: CardDefinition[]
  window: MetricsWindow
  emptyMessage?: string
}>()
</script>

<template>
  <p v-if="cards.length === 0" class="text-sm text-slate-500">
    {{ emptyMessage ?? 'No widgets to show.' }}
  </p>
  <div v-else class="grid grid-cols-1 items-stretch gap-6 lg:grid-cols-2">
    <MetricCard
      v-for="card in cards"
      :key="card.id"
      :card="card"
      :window="window"
      show-pin
      :class="card.fullWidth ? 'lg:col-span-2' : undefined"
    />
  </div>
</template>
