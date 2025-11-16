<template>
  <HotTable
    :settings="tableSettings"
    :highlight-cells="props.highlightCells"
    :affected-rows="props.affectedRows"
  />
</template>

<script setup lang="ts">
import { computed } from 'vue'
import HotTable from './HotTable.vue'

interface Props {
  data: string[][]
  headers: string[]
  height?: number
  highlightCells?: { rowIndex: number; colIndex: number; severity: 'error' | 'warning' }[]
  affectedRows?: number[]
}

const props = withDefaults(defineProps<Props>(), {
  highlightCells: () => [],
  affectedRows: () => [],
})

const tableSettings = computed(() => {
  const settings: any = {
    data: props.data,
    colHeaders: props.headers,
    rowHeaders: true,
    width: '100%',
    stretchH: 'all',
    columnSorting: false,
    manualColumnResize: true,
    readOnly: true,
    licenseKey: 'non-commercial-and-evaluation',
  }

  // Only set height if explicitly provided, otherwise let HotTable's ResizeObserver handle it
  if (props.height !== undefined) {
    settings.height = props.height
  }

  return settings
})
</script>