<template>
  <div class="h-full w-full">
    <HotTable ref="hotRef" :settings="hotSettings" class="overflow-hidden w-full h-full" />
  </div>
</template>

<script lang="ts" setup>
import { HotTable } from '@handsontable/vue3'
import { registerAllModules } from 'handsontable/registry'
import { type PropType, computed, nextTick, onMounted, onUnmounted, ref, watch } from 'vue'
import 'handsontable/styles/handsontable.css'
import 'handsontable/styles/ht-theme-main.css'
import { useDarkMode } from '@/composables/useDarkMode'

registerAllModules()

const props = defineProps({
  ...HotTable.props,
  dimmedRows: {
    type: Array as PropType<number[]>,
    default: () => [],
  },
  highlightCells: {
    type: Array as PropType<
      { rowIndex: number; colIndex: number; severity: 'error' | 'warning' }[]
    >,
    default: () => [],
  },
  affectedRows: {
    type: Array as PropType<number[]>,
    default: () => [],
  },
})

const hotData = computed(() => {
  return [...(props.settings?.data || Array.from(props.data) || [])]
})

watch(
  hotData,
  async (data) => {
    await nextTick()
    hotInstance.value?.updateData(data)
  },
  { immediate: true },
)

// Convert highlightCells array to Map for O(1) lookup, collecting all severities per cell
const highlightMap = computed(() => {
  const map = new Map<string, Set<'error' | 'warning'>>()
  props.highlightCells?.forEach(
    (cell: { rowIndex: number; colIndex: number; severity: 'error' | 'warning' }) => {
      const key = `${cell.rowIndex},${cell.colIndex}`
      if (!map.has(key)) {
        map.set(key, new Set())
      }
      map.get(key)!.add(cell.severity)
    },
  )

  return map
})

const { isDark } = useDarkMode()
const defaultSettings = {
  licenseKey: 'non-commercial-and-evaluation',
  themeName: isDark.value ? 'ht-theme-main-dark' : 'ht-theme-main',
  colHeaders: true,
  rowHeaders: true,
  stretchH: 'all',
  height: 'auto',
  modifyColWidth: (w: number) => Math.min(w, window.innerWidth / 2), // prevent super-wide cells
  wordWrap: false, // prevent row height changes during horizontal scroll
}

const hotSettings = computed(() => {
  const { ...settings } = props.settings || {}
  return {
    ...defaultSettings,
    ...settings,
    afterRenderer: (
      td: HTMLTableCellElement,
      row: number,
      col: number,
      prop: string | number,
      value: unknown,
      cellProperties: unknown,
    ) => {
      // Apply default renderer first
      if (settings.afterRenderer) {
        settings.afterRenderer(td, row, col, prop, value, cellProperties)
      }

      // Check if this cell should be highlighted
      const cellKey = `${row},${col}`
      const severities = highlightMap.value.get(cellKey)

      // Remove any existing highlight classes and inline styles
      td.classList.remove('cell-error', 'cell-warning', 'cell-highlight')
      td.style.backgroundColor = ''
      td.style.borderLeft = ''
      td.style.color = ''

      // Tier 1: Apply row-level highlight if this row has any validation issues
      if (props.affectedRows?.includes(row)) {
        td.classList.add('cell-highlight')
      }

      // Tier 2 & 3: Apply cell-level highlights if this specific cell has issues
      if (severities) {
        // Apply classes (order matters: warning first, then error for proper stacking)
        if (severities.has('warning')) {
          td.classList.add('cell-warning')
        }
        if (severities.has('error')) {
          td.classList.add('cell-error')
        }
      }

      // Apply dimming if this row should be dimmed (takes precedence visually)
      if (props.dimmedRows?.includes(row)) {
        td.style.opacity = '0.4'
        td.classList.add('dimmed-row')
      } else {
        td.style.opacity = ''
        td.classList.remove('dimmed-row')
      }
    },
  }
})

const hotRef = ref()
const resizeObserver = new ResizeObserver(([{ contentRect }]) => {
  hotInstance.value?.updateSettings({
    height: contentRect.height,
  })
})

onMounted(() => {
  if (hotRef.value?.$el?.parentNode) {
    resizeObserver.observe(hotRef.value.$el.parentNode)
  }
})

onUnmounted(() => {
  resizeObserver.disconnect()
})

const hotInstance = computed(() => {
  return hotRef.value?.hotInstance
})

watch(
  isDark,
  (dark) => {
    if (hotInstance.value) {
      hotInstance.value.updateSettings({
        themeName: dark ? 'ht-theme-main-dark' : 'ht-theme-main',
      })
    }
  },
  { immediate: true },
)

defineExpose({
  hotInstance,
})
</script>
