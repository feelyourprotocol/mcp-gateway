<script setup lang="ts">
import { computed } from 'vue'
import VChart from 'vue-echarts'
import { use } from 'echarts/core'
import { SVGRenderer } from 'echarts/renderers'
import { BarChart, LineChart } from 'echarts/charts'
import { GridComponent, LegendComponent, TooltipComponent } from 'echarts/components'

import type { CardDefinition, CardQueryResult } from '@/types/metrics'
import { toChartOption } from '@/lib/toChartOption'

use([SVGRenderer, LineChart, BarChart, GridComponent, TooltipComponent, LegendComponent])

const props = defineProps<{
  card: CardDefinition
  result: CardQueryResult
}>()

const option = computed(() => toChartOption(props.card, props.result))
</script>

<template>
  <VChart class="h-64 w-full min-h-[16rem]" :option="option" autoresize renderer="svg" />
</template>
