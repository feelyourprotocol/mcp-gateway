<script setup lang="ts">
import { ref } from 'vue'
import { Bars3Icon, ChevronDownIcon, ChevronUpIcon } from '@heroicons/vue/24/outline'

import MetricCard from '@/components/MetricCard.vue'
import type { CardDefinition, MetricsWindow } from '@/types/metrics'

const props = defineProps<{
  cards: CardDefinition[]
  window: MetricsWindow
  emptyMessage?: string
  reorderable?: boolean
}>()

const emit = defineEmits<{
  reorder: [fromIndex: number, toIndex: number]
}>()

const dragFromIndex = ref<number | null>(null)
const dragOverIndex = ref<number | null>(null)

type DragDataTransfer = {
  setData: (format: string, data: string) => void
  effectAllowed: string
  dropEffect: string
}

function dataTransferFrom(event: Event): DragDataTransfer | null {
  if (!('dataTransfer' in event)) {
    return null
  }
  const transfer = (event as { dataTransfer: DragDataTransfer | null }).dataTransfer
  return transfer ?? null
}

function emitReorder(fromIndex: number, toIndex: number): void {
  if (fromIndex === toIndex) {
    return
  }
  if (
    fromIndex < 0 ||
    toIndex < 0 ||
    fromIndex >= props.cards.length ||
    toIndex >= props.cards.length
  ) {
    return
  }
  emit('reorder', fromIndex, toIndex)
}

function onDragStart(index: number, event: Event): void {
  const transfer = dataTransferFrom(event)
  dragFromIndex.value = index
  dragOverIndex.value = index
  transfer?.setData('text/plain', String(index))
  if (transfer) {
    transfer.effectAllowed = 'move'
  }
}

function onDragOver(index: number, event: Event): void {
  event.preventDefault()
  dragOverIndex.value = index
  const transfer = dataTransferFrom(event)
  if (transfer) {
    transfer.dropEffect = 'move'
  }
}

function onDrop(index: number, event: Event): void {
  event.preventDefault()
  const from = dragFromIndex.value
  if (from !== null) {
    emitReorder(from, index)
  }
  dragFromIndex.value = null
  dragOverIndex.value = null
}

function onDragEnd(): void {
  dragFromIndex.value = null
  dragOverIndex.value = null
}
</script>

<template>
  <p v-if="cards.length === 0" class="text-sm text-slate-500">
    {{ emptyMessage ?? 'No widgets to show.' }}
  </p>
  <div
    v-else
    class="grid grid-cols-1 items-stretch gap-6 lg:grid-cols-2"
    :class="reorderable ? 'pl-0' : undefined"
  >
    <div
      v-for="(card, index) in cards"
      :key="card.id"
      class="flex min-w-0 gap-2 transition"
      :class="[
        card.fullWidth ? 'lg:col-span-2' : undefined,
        dragOverIndex === index && dragFromIndex !== null
          ? 'rounded-xl ring-2 ring-violet-400 ring-offset-2'
          : '',
        dragFromIndex === index ? 'opacity-60' : '',
      ]"
      @dragover="reorderable ? onDragOver(index, $event) : undefined"
      @drop="reorderable ? onDrop(index, $event) : undefined"
    >
      <div
        v-if="reorderable"
        class="flex shrink-0 flex-col items-center gap-1 pt-4"
        role="group"
        :aria-label="`Reorder ${card.title}`"
      >
        <button
          type="button"
          class="min-h-9 rounded-md border border-slate-200 bg-white p-1 text-slate-600 hover:border-violet-300 hover:text-violet-700 disabled:opacity-30 sm:min-h-8"
          :disabled="index === 0"
          aria-label="Move up"
          @click="emitReorder(index, index - 1)"
        >
          <ChevronUpIcon class="size-4" aria-hidden="true" />
        </button>
        <button
          type="button"
          class="min-h-9 cursor-grab rounded-md border border-slate-200 bg-slate-50 p-1 text-slate-500 hover:border-violet-300 hover:text-violet-700 active:cursor-grabbing sm:min-h-8"
          draggable="true"
          aria-label="Drag to reorder"
          @dragstart="onDragStart(index, $event)"
          @dragend="onDragEnd"
        >
          <Bars3Icon class="size-4" aria-hidden="true" />
        </button>
        <button
          type="button"
          class="min-h-9 rounded-md border border-slate-200 bg-white p-1 text-slate-600 hover:border-violet-300 hover:text-violet-700 disabled:opacity-30 sm:min-h-8"
          :disabled="index === cards.length - 1"
          aria-label="Move down"
          @click="emitReorder(index, index + 1)"
        >
          <ChevronDownIcon class="size-4" aria-hidden="true" />
        </button>
      </div>
      <MetricCard
        :card="card"
        :window="window"
        show-pin
        class="min-w-0 flex-1"
        :class="card.fullWidth && !reorderable ? 'lg:col-span-2' : undefined"
      />
    </div>
  </div>
</template>
