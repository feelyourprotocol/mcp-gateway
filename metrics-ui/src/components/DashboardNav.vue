<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, RouterLink } from 'vue-router'

import { DASHBOARD_SECTIONS } from '@/lib/dashboardSections'

const route = useRoute()

const tabs = computed(() => [
  { path: '/', label: 'Home', match: (path: string) => path === '/' },
  ...DASHBOARD_SECTIONS.map((section) => ({
    path: section.path,
    label: section.label,
    match: (path: string) => path === section.path || path.startsWith(`${section.path}/`),
  })),
])

function isActive(match: (path: string) => boolean): boolean {
  return match(route.path)
}
</script>

<template>
  <nav class="border-t border-slate-100 bg-white/95" aria-label="Dashboard sections">
    <div class="mx-auto max-w-6xl px-4 sm:px-6">
      <div class="-mb-px flex gap-1 overflow-x-auto py-2 [scrollbar-width:thin]">
        <RouterLink
          v-for="tab in tabs"
          :key="tab.path"
          :to="tab.path"
          class="min-h-11 shrink-0 rounded-lg px-4 py-2 text-sm font-medium transition sm:min-h-9"
          :class="
            isActive(tab.match)
              ? 'bg-gradient-to-r from-violet-600 to-cyan-500 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
          "
          :aria-current="isActive(tab.match) ? 'page' : undefined"
        >
          {{ tab.label }}
        </RouterLink>
      </div>
    </div>
  </nav>
</template>
