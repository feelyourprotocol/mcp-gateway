<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { InformationCircleIcon } from '@heroicons/vue/24/outline'

const props = withDefaults(
  defineProps<{
    text: string
    label?: string
    align?: 'center' | 'end'
  }>(),
  { label: 'About this metric', align: 'center' },
)

const pinned = ref(false)
const hover = ref(false)
const supportsHover = ref(false)

const visible = computed(() => pinned.value || hover.value)

function togglePinned(event: Event): void {
  event.stopPropagation()
  pinned.value = !pinned.value
}

function onDocumentClick(): void {
  pinned.value = false
}

function onMouseEnter(): void {
  if (supportsHover.value) {
    hover.value = true
  }
}

function onMouseLeave(): void {
  if (supportsHover.value) {
    hover.value = false
  }
}

onMounted(() => {
  if (typeof window.matchMedia === 'function') {
    supportsHover.value = window.matchMedia('(hover: hover) and (pointer: fine)').matches
  }
  document.addEventListener('click', onDocumentClick)
})

onBeforeUnmount(() => {
  document.removeEventListener('click', onDocumentClick)
})
</script>

<template>
  <span class="relative inline-flex">
    <button
      type="button"
      class="inline-flex size-8 items-center justify-center rounded-full text-slate-400 transition hover:bg-slate-100 hover:text-slate-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-500 sm:size-7"
      :aria-expanded="visible"
      :aria-label="props.label"
      @click="togglePinned"
      @mouseenter="onMouseEnter"
      @mouseleave="onMouseLeave"
    >
      <InformationCircleIcon class="size-5 sm:size-4" aria-hidden="true" />
    </button>
    <div
      v-if="visible"
      role="tooltip"
      class="absolute top-full z-30 mt-2 w-64 rounded-lg border border-slate-200 bg-white p-3 text-left text-xs leading-relaxed text-slate-600 shadow-lg sm:w-72"
      :class="props.align === 'end' ? 'right-0' : 'left-1/2 -translate-x-1/2'"
      @click.stop
    >
      {{ props.text }}
    </div>
  </span>
</template>
