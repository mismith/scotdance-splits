<script setup lang="ts">
import { ref, computed, reactive, watch, provide } from 'vue'
import { unparse } from 'papaparse'

import { getAgeGroupName, CATEGORY_CODE_NAMES, INPUT_COLUMNS } from '@/lib/helpers'
import AppHeader from '@/components/AppHeader.vue'
import Step1Input from '@/components/Step1Input.vue'
import Step2Group from '@/components/Step2Group.vue'
import Step3Export from '@/components/Step3Export.vue'

interface Props {
  inputFiles?: File[]
  inputCsv?: string[][]
  inputError?: string
  isLoadingInputFile?: boolean
}

const props = defineProps<Props>()

const emit = defineEmits<{
  'file-selected': [file: File]
  'error-dismiss': []
  'home-click': []
}>()

// Step management
const step = ref(1)
const maxStep = ref(step.value)
watch(step, () => {
  if (maxStep.value < step.value) {
    maxStep.value = step.value
  }
})

// CSV data processing
const inputCSV = computed(() => props.inputCsv)

watch(inputCSV, () => {
  step.value = 1
  maxStep.value = 1
})

// Column mapping
const defaultInputHeaders = ref<string[]>()
const hasHeaderRow = ref(true)

const inputHeaders = computed<string[]>(() => {
  return (hasHeaderRow.value ? inputCSV.value?.[0] : defaultInputHeaders.value) || []
})

const inputData = computed(() => {
  if (rowFilteringConfig.value.enabled) {
    return filteredInputData.value.filtered
  }
  return inputCSV.value?.slice(hasHeaderRow.value ? 1 : 0)
})

const colIndexes = reactive(
  INPUT_COLUMNS.reduce(
    (acc, col) => {
      acc[col.id] = -1
      return acc
    },
    {} as Record<string, number>,
  ),
)

watch(
  inputHeaders,
  (headers) => {
    INPUT_COLUMNS.forEach((col) => {
      colIndexes[col.id] = headers.findIndex((header) => col.regex.test(header))
    })
  },
  { immediate: true },
)

const isCountryColumnMapped = computed(() => {
  return colIndexes.country >= 0
})

// Row filtering
interface FilterConfig {
  id: string
  mode: 'include' | 'exclude'
  column: 'all' | string
  term: string
  caseSensitive: boolean
}

const rowFilteringConfig = ref<{
  enabled: boolean
  showDimmed: boolean
  filters: FilterConfig[]
}>({
  enabled: false,
  showDimmed: true,
  filters: []
})

// Apply row filtering logic
function applyFilters(data: string[][], headers: string[]): { filtered: string[][]; excludedIndexes: number[] } {
  if (!rowFilteringConfig.value.enabled || rowFilteringConfig.value.filters.length === 0) {
    return { filtered: data, excludedIndexes: [] }
  }

  const activeFilters = rowFilteringConfig.value.filters.filter(f => f.term.trim())
  if (activeFilters.length === 0) {
    return { filtered: data, excludedIndexes: [] }
  }

  const excludedIndexes: number[] = []
  const filteredData = data.filter((row, index) => {
    let include = true

    // Process include filters (must match ALL)
    const includeFilters = activeFilters.filter(f => f.mode === 'include')
    if (includeFilters.length > 0) {
      include = includeFilters.every(filter => matchesFilter(row, headers, filter))
    }

    // Process exclude filters (must NOT match ANY)
    if (include) {
      const excludeFilters = activeFilters.filter(f => f.mode === 'exclude')
      if (excludeFilters.some(filter => matchesFilter(row, headers, filter))) {
        include = false
      }
    }

    if (!include) {
      excludedIndexes.push(index)
    }

    return include
  })

  return { filtered: filteredData, excludedIndexes }
}

function matchesFilter(row: string[], headers: string[], filter: FilterConfig): boolean {
  const term = filter.caseSensitive ? filter.term : filter.term.toLowerCase()
  
  if (filter.column === 'all') {
    return row.some(cell => {
      const cellValue = filter.caseSensitive ? (cell || '') : (cell || '').toLowerCase()
      return cellValue.includes(term)
    })
  } else {
    const columnIndex = headers.indexOf(filter.column)
    if (columnIndex === -1) return false
    
    const cellValue = filter.caseSensitive ? (row[columnIndex] || '') : (row[columnIndex] || '').toLowerCase()
    return cellValue.includes(term)
  }
}

const filteredInputData = computed(() => {
  if (!inputCSV.value) return { filtered: [], excludedIndexes: [] }
  
  const rawData = hasHeaderRow.value ? inputCSV.value.slice(1) : inputCSV.value
  return applyFilters(rawData, inputHeaders.value)
})

const filteredOutRowIndexes = computed(() => filteredInputData.value.excludedIndexes)

// Bib number assignment
const maxBibNumber = ref<number>()
const defaultMaxBibNumber = ref<number>()
const isPrintingYears = ref(true)
const includeCountry = ref(false)
provide('isPrintingYears', isPrintingYears)

watch(inputData, (v) => {
  const defaultValue = Math.round(((v?.length || 100) + 50) / 100) * 100 + 100
  if (!maxBibNumber.value || maxBibNumber.value === defaultValue) {
    maxBibNumber.value = defaultValue
  }
  defaultMaxBibNumber.value = defaultValue
}, { immediate: true })

const numberedCSV = computed(() => {
  const output = inputData.value
    ?.filter((row) => row[colIndexes.firstName])
    .sort((rowA, rowB) => rowA[colIndexes.timestamp]?.localeCompare(rowB[colIndexes.timestamp]))
    .map((row, index) => [...row, `${(maxBibNumber.value || 0) - index}`])
  return output
})

// Age categorization
const categories = computed(() =>
  inputData.value?.reduce(
    (acc, row) => {
      const cell = row[colIndexes.code]
      if (cell && /^[PBNIRX]\d{2}$/.test(cell)) {
        const categoryCode = cell.substring(0, 1)
        const age = cell.substring(1)
        acc[categoryCode] = acc[categoryCode] || {}
        acc[categoryCode][age] = (acc[categoryCode][age] || 0) + 1
      }
      return acc
    },
    {} as Record<string, Record<string, number>>,
  ),
)

// Age group partitioning
type Partition = {
  categoryCode: string
  ageRange: number[]
  codes: string[]
}

const partitions = ref<Record<string, Partition[]>>({})
const step2GroupRef = ref<InstanceType<typeof Step2Group>>()

watch(inputData, () => {
  partitions.value = {}
})

watch(step, () => {
  if (step.value === 2) {
    step2GroupRef.value?.refresh()
  }
})

function handlePartition(categoryCode: string, partitionedAgeRanges: number[][]) {
  const ageCodesWithinGroup = Object.keys(categories.value?.[categoryCode] || {})
  const partitioned = partitionedAgeRanges.map(
    ([minAge, maxAge]) =>
      ({
        categoryCode,
        ageRange: [minAge, maxAge],
        codes: [],
      }) as Partition,
  )

  ageCodesWithinGroup.forEach((ageCode) => {
    const age = Number(ageCode)
    partitionedAgeRanges.forEach(([minAge, maxAge], index) => {
      if (minAge <= age && age <= maxAge) {
        const code = `${categoryCode}${ageCode}`
        partitioned[index].codes.push(code)
      }
    })
  })

  partitions.value[categoryCode] = partitioned
}

// Output generation
const outputNumColumns = ref(4)
const output = computed(() => {
  const data: any[][] = []
  Object.values(partitions.value)
    .flat()
    .forEach((partition) => {
      if (data.length) data.push([])

      const name = `${CATEGORY_CODE_NAMES[partition.categoryCode]} ${getAgeGroupName(partition.ageRange[0], partition.ageRange[1], isPrintingYears.value)}`
      data.push([name])

      const rows =
        numberedCSV.value?.filter((row) => row.find((value) => partition.codes.includes(value))) ||
        []
      data.push(
        ...rows.map((row) => {
          // Build location column based on includeCountry setting
          const locationParts = [row[colIndexes.location], row[colIndexes.region]]
          
          if (includeCountry.value && isCountryColumnMapped.value && row[colIndexes.country]) {
            locationParts.push(row[colIndexes.country])
          }
          
          return [
            row[row.length - 1],
            row[colIndexes.firstName] || (!row[colIndexes.lastName] && row[colIndexes.fullName]),
            row[colIndexes.lastName],
            locationParts.filter(Boolean).join(', '),
          ]
        }),
      )
    })
  return data
})

const outputCSV = computed(() => unparse(output.value))

function handleHomeClick() {
  emit('home-click')
}

function handleStepChange(newStep: number) {
  step.value = newStep
}

function handleFiltersChanged(config: { enabled: boolean; showDimmed: boolean; filters: FilterConfig[] }) {
  rowFilteringConfig.value = config
}

function handleStepNext() {
  step.value++
}
</script>

<template>
  <div class="flex-1 flex flex-col h-full">
    <!-- Header with compact stepper -->
    <AppHeader
      :show-stepper="true"
      :step="step"
      :max-step="maxStep"
      @step-change="handleStepChange"
      @home-click="handleHomeClick"
    />

    <!-- Step content -->
    <div class="flex-1 overflow-hidden h-full">
      <!-- Step 1: Input -->
      <Step1Input
        v-if="step === 1"
        :input-data="inputData"
        :input-csv="inputCSV"
        :input-headers="inputHeaders"
        :has-header-row="hasHeaderRow"
        :col-indexes="colIndexes"
        :row-filtering-config="rowFilteringConfig"
        :filtered-out-row-indexes="filteredOutRowIndexes"
        @update:has-header-row="hasHeaderRow = $event"
        @update:col-indexes="Object.assign(colIndexes, $event)"
        @filters-changed="handleFiltersChanged"
        @next-step="handleStepNext"
      />

      <!-- Step 2: Group -->
      <Step2Group
        v-else-if="step === 2"
        ref="step2GroupRef"
        :categories="categories!"
        @partition="handlePartition"
        @next-step="handleStepNext"
      />

      <!-- Step 3: Export -->
      <Step3Export
        v-else-if="step === 3"
        :output="output"
        :output-num-columns="outputNumColumns"
        :output-csv="outputCSV"
        :max-bib-number="maxBibNumber"
        :default-max-bib-number="defaultMaxBibNumber"
        :is-printing-years="isPrintingYears"
        :include-country="includeCountry"
        :is-country-column-mapped="isCountryColumnMapped"
        @update:max-bib-number="maxBibNumber = $event"
        @update:is-printing-years="isPrintingYears = $event"
        @update:include-country="includeCountry = $event"
      />
    </div>
  </div>
</template>
