<template>
  <div class="h-full w-full">
    <HotTable ref="hotRef" :settings="hotSettings" class="overflow-hidden w-full h-full" />
  </div>
</template>

<script lang="ts" setup>
import { ref, computed, watch, nextTick, onMounted, onUnmounted, type PropType } from 'vue'
import { HotTable } from '@handsontable/vue3'
import { registerAllModules } from 'handsontable/registry'
import 'handsontable/styles/handsontable.css'
import 'handsontable/styles/ht-theme-main.css'
import { useDarkMode } from '@/composables/useDarkMode'

registerAllModules()
interface Props {
  dimmedRows?: number[]
}

const props = defineProps({
  ...HotTable.props,
  dimmedRows: {
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

const { isDark } = useDarkMode()
const defaultSettings = {
  licenseKey: 'non-commercial-and-evaluation',
  themeName: isDark.value ? 'ht-theme-main-dark' : 'ht-theme-main',
  colHeaders: true,
  rowHeaders: true,
  stretchH: 'all',
  height: 'auto',
  modifyColWidth: (w: number) => Math.min(w, window.innerWidth / 2), // prevent super-wide cells
}

const hotSettings = computed(() => {
  const { data, ...settings } = props.settings || {}
  return {
    ...defaultSettings,
    ...settings,
    afterRenderer: (
      td: HTMLTableCellElement,
      row: number,
      col: number,
      prop: string | number,
      value: any,
      cellProperties: any,
    ) => {
      // Apply default renderer first
      if (settings.afterRenderer) {
        settings.afterRenderer(td, row, col, prop, value, cellProperties)
      }

      // Apply dimming if this row should be dimmed
      if (props.dimmedRows?.includes(row)) {
        td.style.opacity = '0.4'
        td.style.color = 'var(--color-muted-foreground)'
        td.classList.add('dimmed-row')
      } else {
        td.style.opacity = ''
        td.style.color = ''
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
