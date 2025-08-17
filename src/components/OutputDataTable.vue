<template>
  <HotTable :settings="tableSettings" />
</template>

<script setup lang="ts">
import { computed } from 'vue'
import HotTable from './HotTable.vue'

interface Props {
  data: (string | number)[][]
  height?: number
}

const props = withDefaults(defineProps<Props>(), {
  height: 300,
})

const tableSettings = computed(() => ({
  data: props.data,
  colHeaders: false,
  rowHeaders: false,
  width: '100%',
  height: props.height,
  stretchH: 'all',
  columnSorting: false,
  manualColumnResize: true,
  readOnly: true,
  licenseKey: 'non-commercial-and-evaluation',
}))
</script>