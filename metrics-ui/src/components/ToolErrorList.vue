<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { ChevronDownIcon, ChevronRightIcon } from '@heroicons/vue/24/outline'

import { fetchErrors } from '@/api/client'
import {
  aggregateErrorStats,
  errorCodeForRow,
  filterErrorRows,
  formatErrorTime,
  groupErrorsByTool,
  paginateRows,
  truncateMessage,
  type ErrorListFilters,
} from '@/lib/errorListModel'
import { formatErrorPaste } from '@/lib/formatErrorPaste'
import type { ErrorEventRow } from '@/types/errors'
import type { MetricsWindow } from '@/types/metrics'

const PAGE_SIZE = 12

const props = defineProps<{
  window: MetricsWindow
}>()

const allRows = ref<ErrorEventRow[]>([])
const meta = ref({ totalInWindow: 0, truncated: false, limit: 100 })
const loading = ref(true)
const loadError = ref<string | null>(null)
const copyHint = ref<string | null>(null)

const filters = ref<ErrorListFilters>({ tool: null, code: null })
const groupByTool = ref(true)
const page = ref(1)
const expandedId = ref<number | null>(null)
const openTools = ref<Set<string>>(new Set())

const stats = computed(() =>
  aggregateErrorStats(allRows.value, {
    totalInWindow: meta.value.totalInWindow,
    truncated: meta.value.truncated,
  }),
)

const filteredRows = computed(() => filterErrorRows(allRows.value, filters.value))

const filteredStats = computed(() =>
  aggregateErrorStats(filteredRows.value, {
    totalInWindow: filteredRows.value.length,
    truncated: false,
  }),
)

const flatPage = computed(() => paginateRows(filteredRows.value, page.value, PAGE_SIZE))

const toolGroups = computed(() => {
  const groups = groupErrorsByTool(filteredRows.value)
  if (filters.value.tool !== null) {
    return groups.filter((g) => g.tool === filters.value.tool)
  }
  return groups
})

const hasActiveFilters = computed(() => filters.value.tool !== null || filters.value.code !== null)

async function load(): Promise<void> {
  loading.value = true
  loadError.value = null
  try {
    const result = await fetchErrors(props.window)
    allRows.value = result.errors
    meta.value = {
      totalInWindow: result.totalInWindow,
      truncated: result.truncated,
      limit: result.limit,
    }
    page.value = 1
    expandedId.value = null
    openTools.value = new Set(
      groupErrorsByTool(result.errors)
        .slice(0, 2)
        .map((g) => g.tool),
    )
  } catch (e) {
    loadError.value = e instanceof Error ? e.message : 'load failed'
  } finally {
    loading.value = false
  }
}

function setToolFilter(tool: string | null): void {
  filters.value = { ...filters.value, tool }
  page.value = 1
  expandedId.value = null
}

function setCodeFilter(code: string | null): void {
  filters.value = { ...filters.value, code }
  page.value = 1
  expandedId.value = null
}

function clearFilters(): void {
  filters.value = { tool: null, code: null }
  page.value = 1
  expandedId.value = null
}

function toggleExpanded(id: number): void {
  expandedId.value = expandedId.value === id ? null : id
}

function toggleToolGroup(tool: string): void {
  const next = new Set(openTools.value)
  if (next.has(tool)) {
    next.delete(tool)
  } else {
    next.add(tool)
  }
  openTools.value = next
}

async function copyRow(row: ErrorEventRow): Promise<void> {
  try {
    await window.navigator.clipboard.writeText(formatErrorPaste(row))
    copyHint.value = `Copied #${row.id}`
  } catch {
    copyHint.value = 'Copy failed'
  }
  window.setTimeout(() => {
    copyHint.value = null
  }, 2000)
}

watch(
  () => props.window,
  () => {
    void load()
  },
  { immediate: true },
)
</script>

<template>
  <section class="mt-3 border-t border-slate-100 pt-4" aria-label="Error causes">
    <div class="mb-3 flex flex-wrap items-center justify-between gap-2">
      <h3 class="text-xs font-semibold uppercase tracking-wide text-slate-500">Causes</h3>
      <p v-if="copyHint" class="text-xs text-violet-600">{{ copyHint }}</p>
    </div>

    <p v-if="loading" class="text-sm text-slate-500">Loading causes…</p>
    <p v-else-if="loadError" class="text-sm text-red-600">{{ loadError }}</p>
    <p v-else-if="stats.totalInWindow === 0" class="text-sm text-slate-500">
      No errors in this range.
    </p>

    <div v-else class="space-y-4">
      <div
        class="rounded-xl border border-slate-200 bg-gradient-to-br from-slate-50 to-white p-4 shadow-sm"
      >
        <div class="flex flex-wrap items-baseline justify-between gap-2">
          <p class="text-sm font-medium text-slate-900">
            <span class="font-mono text-lg tabular-nums">{{ stats.totalInWindow }}</span>
            error{{ stats.totalInWindow === 1 ? '' : 's' }} in range
            <span v-if="hasActiveFilters" class="font-normal text-slate-600">
              · {{ filteredStats.totalLoaded }} after filters
            </span>
          </p>
          <p v-if="stats.truncated" class="text-xs text-amber-700">
            Latest {{ stats.totalLoaded }} loaded (cap {{ meta.limit }})
          </p>
          <p v-else-if="stats.withoutDiagnostic > 0" class="text-xs text-slate-500">
            {{ stats.withoutDiagnostic }} without stored message (pre-diagnostics)
          </p>
        </div>

        <div class="mt-4 grid gap-4 sm:grid-cols-2">
          <div>
            <p class="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
              By error code
              <span v-if="hasActiveFilters" class="font-normal normal-case text-slate-400">(filtered)</span>
            </p>
            <ul class="space-y-1.5">
              <li
                v-for="entry in (hasActiveFilters ? filteredStats.byCode : stats.byCode).slice(
                  0,
                  6,
                )"
                :key="entry.key"
                class="flex items-center gap-2 text-xs"
              >
                <button
                  type="button"
                  class="min-w-0 flex-1 truncate rounded-md px-2 py-1 text-left font-mono transition"
                  :class="
                    filters.code === entry.key
                      ? 'bg-violet-100 text-violet-900'
                      : 'text-slate-700 hover:bg-slate-100'
                  "
                  @click="setCodeFilter(filters.code === entry.key ? null : entry.key)"
                >
                  {{ entry.key }}
                </button>
                <span
                  class="w-16 shrink-0 overflow-hidden rounded-full bg-slate-200"
                  aria-hidden="true"
                >
                  <span
                    class="block h-1.5 rounded-full bg-violet-500"
                    :style="{
                      width: `${Math.max(8, (entry.count / (hasActiveFilters ? filteredStats.totalLoaded : stats.totalLoaded)) * 100)}%`,
                    }"
                  />
                </span>
                <span class="w-8 shrink-0 text-right font-mono tabular-nums text-slate-600">{{
                  entry.count
                }}</span>
              </li>
            </ul>
          </div>
          <div>
            <p class="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">By tool</p>
            <ul class="space-y-1.5">
              <li
                v-for="entry in stats.byTool.slice(0, 6)"
                :key="entry.key"
                class="flex items-center gap-2 text-xs"
              >
                <button
                  type="button"
                  class="min-w-0 flex-1 truncate rounded-md px-2 py-1 text-left font-mono transition"
                  :class="
                    filters.tool === entry.key
                      ? 'bg-cyan-100 text-cyan-900'
                      : 'text-slate-700 hover:bg-slate-100'
                  "
                  @click="setToolFilter(filters.tool === entry.key ? null : entry.key)"
                >
                  {{ entry.key }}
                </button>
                <span
                  class="w-16 shrink-0 overflow-hidden rounded-full bg-slate-200"
                  aria-hidden="true"
                >
                  <span
                    class="block h-1.5 rounded-full bg-cyan-500"
                    :style="{
                      width: `${Math.max(8, (entry.count / stats.totalLoaded) * 100)}%`,
                    }"
                  />
                </span>
                <span class="w-8 shrink-0 text-right font-mono tabular-nums text-slate-600">{{
                  entry.count
                }}</span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      <div class="flex flex-wrap items-center gap-2">
        <button
          v-if="hasActiveFilters"
          type="button"
          class="min-h-9 rounded-lg border border-slate-200 bg-white px-3 text-xs font-medium text-slate-700 hover:border-slate-300"
          @click="clearFilters"
        >
          Clear filters
        </button>
        <label
          class="ml-auto flex min-h-9 cursor-pointer items-center gap-2 text-xs text-slate-600"
        >
          <input v-model="groupByTool" type="checkbox" class="size-4 rounded border-slate-300">
          Group by tool
        </label>
      </div>

      <p v-if="filteredRows.length === 0" class="text-sm text-slate-500">
        No errors match the current filters.
      </p>

      <template v-else-if="groupByTool">
        <div class="space-y-2">
          <div
            v-for="group in toolGroups"
            :key="group.tool"
            class="overflow-hidden rounded-lg border border-slate-200"
          >
            <button
              type="button"
              class="flex w-full min-h-11 items-center gap-2 bg-slate-50 px-3 py-2 text-left text-sm font-medium text-slate-800 hover:bg-slate-100"
              @click="toggleToolGroup(group.tool)"
            >
              <ChevronDownIcon
                v-if="openTools.has(group.tool)"
                class="size-4 shrink-0 text-slate-500"
                aria-hidden="true"
              />
              <ChevronRightIcon v-else class="size-4 shrink-0 text-slate-500" aria-hidden="true" />
              <span class="font-mono">{{ group.tool }}</span>
              <span class="ml-auto font-mono text-xs tabular-nums text-slate-500">{{
                group.rows.length
              }}</span>
            </button>
            <div
              v-show="openTools.has(group.tool)"
              class="max-h-64 overflow-y-auto border-t border-slate-100"
            >
              <table class="min-w-full text-xs">
                <thead
                  class="sticky top-0 bg-white text-left text-[10px] font-semibold uppercase tracking-wide text-slate-500"
                >
                  <tr>
                    <th class="px-3 py-2">Time (UTC)</th>
                    <th class="px-3 py-2">Code</th>
                    <th class="px-3 py-2">Field</th>
                    <th class="hidden px-3 py-2 sm:table-cell">Message</th>
                    <th class="px-3 py-2 w-16" />
                  </tr>
                </thead>
                <tbody class="divide-y divide-slate-50">
                  <template v-for="row in group.rows.slice(0, 25)" :key="row.id">
                    <tr
                      class="cursor-pointer text-slate-800 hover:bg-violet-50/50"
                      @click="toggleExpanded(row.id)"
                    >
                      <td class="whitespace-nowrap px-3 py-2 font-mono tabular-nums text-slate-600">
                        {{ formatErrorTime(row.ts).slice(11) }}
                      </td>
                      <td class="px-3 py-2 font-mono text-violet-800">
                        {{ errorCodeForRow(row) }}
                      </td>
                      <td class="max-w-[8rem] truncate px-3 py-2 font-mono text-slate-600">
                        {{ row.diagnostic?.field ?? '—' }}
                      </td>
                      <td class="hidden max-w-xs truncate px-3 py-2 sm:table-cell">
                        {{
                          row.diagnostic ? truncateMessage(row.diagnostic.message) : 'Not recorded'
                        }}
                      </td>
                      <td class="px-3 py-2 text-right">
                        <button
                          type="button"
                          class="rounded px-2 py-1 text-[10px] font-medium uppercase tracking-wide text-slate-600 hover:bg-white hover:text-violet-700"
                          @click.stop="copyRow(row)"
                        >
                          Copy
                        </button>
                      </td>
                    </tr>
                    <tr v-if="expandedId === row.id" class="bg-slate-50/80">
                      <td colspan="5" class="px-3 py-2">
                        <p
                          v-if="row.diagnostic"
                          class="whitespace-pre-wrap break-words text-slate-700"
                        >
                          {{ row.diagnostic.message }}
                        </p>
                        <dl
                          v-if="row.diagnostic?.facts"
                          class="mt-2 grid gap-1 font-mono text-slate-600 sm:grid-cols-2"
                        >
                          <div v-for="(value, key) in row.diagnostic.facts" :key="key">
                            {{ key }}: {{ value }}
                          </div>
                        </dl>
                        <p v-if="row.forkId" class="mt-1 text-slate-500">fork: {{ row.forkId }}</p>
                      </td>
                    </tr>
                  </template>
                </tbody>
              </table>
              <p
                v-if="group.rows.length > 25"
                class="border-t border-slate-100 px-3 py-2 text-xs text-slate-500"
              >
                {{ group.rows.length - 25 }} more in this tool — narrow with a code filter.
              </p>
            </div>
          </div>
        </div>
      </template>

      <template v-else>
        <div class="overflow-hidden rounded-lg border border-slate-200">
          <div class="max-h-80 overflow-y-auto">
            <table class="min-w-full text-xs">
              <thead
                class="sticky top-0 z-10 bg-slate-50 text-left text-[10px] font-semibold uppercase tracking-wide text-slate-600 shadow-[0_1px_0_0_rgb(226_232_240)]"
              >
                <tr>
                  <th class="px-3 py-2">Time (UTC)</th>
                  <th class="px-3 py-2">Tool</th>
                  <th class="px-3 py-2">Code</th>
                  <th class="px-3 py-2">Field</th>
                  <th class="hidden px-3 py-2 md:table-cell">Message</th>
                  <th class="px-3 py-2 w-16" />
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-100">
                <template v-for="row in flatPage.rows" :key="row.id">
                  <tr
                    class="cursor-pointer text-slate-800 hover:bg-violet-50/50"
                    @click="toggleExpanded(row.id)"
                  >
                    <td class="whitespace-nowrap px-3 py-2 font-mono tabular-nums">
                      {{ formatErrorTime(row.ts) }}
                    </td>
                    <td class="px-3 py-2 font-mono">{{ row.tool }}</td>
                    <td class="px-3 py-2 font-mono text-violet-800">{{ errorCodeForRow(row) }}</td>
                    <td class="max-w-[8rem] truncate px-3 py-2 font-mono text-slate-600">
                      {{ row.diagnostic?.field ?? '—' }}
                    </td>
                    <td class="hidden max-w-md truncate px-3 py-2 md:table-cell">
                      {{
                        row.diagnostic ? truncateMessage(row.diagnostic.message) : 'Not recorded'
                      }}
                    </td>
                    <td class="px-3 py-2 text-right">
                      <button
                        type="button"
                        class="min-h-9 rounded px-2 py-1 text-[10px] font-medium uppercase tracking-wide text-slate-600 hover:text-violet-700 sm:min-h-0"
                        @click.stop="copyRow(row)"
                      >
                        Copy
                      </button>
                    </td>
                  </tr>
                  <tr v-if="expandedId === row.id" class="bg-slate-50">
                    <td colspan="6" class="px-3 py-3">
                      <p
                        v-if="row.diagnostic"
                        class="whitespace-pre-wrap break-words text-slate-700"
                      >
                        {{ row.diagnostic.message }}
                      </p>
                      <dl
                        v-if="row.diagnostic?.facts"
                        class="mt-2 grid gap-1 font-mono text-slate-600 sm:grid-cols-2"
                      >
                        <div v-for="(value, key) in row.diagnostic.facts" :key="key">
                          {{ key }}: {{ value }}
                        </div>
                      </dl>
                      <p class="mt-2 text-slate-500">
                        <span v-if="row.forkId">fork: {{ row.forkId }}</span>
                        <span v-if="row.eips.length"> · eips: {{ row.eips.join(', ') }}</span>
                      </p>
                    </td>
                  </tr>
                </template>
              </tbody>
            </table>
          </div>
        </div>
        <div
          v-if="flatPage.totalPages > 1"
          class="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-600"
        >
          <p>Page {{ flatPage.page }} of {{ flatPage.totalPages }} · {{ flatPage.total }} rows</p>
          <div class="flex gap-2">
            <button
              type="button"
              class="min-h-10 rounded-lg border border-slate-200 bg-white px-3 disabled:opacity-40 sm:min-h-8"
              :disabled="flatPage.page <= 1"
              @click="page = flatPage.page - 1"
            >
              Previous
            </button>
            <button
              type="button"
              class="min-h-10 rounded-lg border border-slate-200 bg-white px-3 disabled:opacity-40 sm:min-h-8"
              :disabled="flatPage.page >= flatPage.totalPages"
              @click="page = flatPage.page + 1"
            >
              Next
            </button>
          </div>
        </div>
      </template>
    </div>
  </section>
</template>
