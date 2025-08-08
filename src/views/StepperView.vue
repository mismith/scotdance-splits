<script setup lang="ts">
import { ref, computed, reactive, watch, provide, nextTick } from 'vue'
import { unparse } from 'papaparse'

import { getAgeGroupName, CATEGORY_CODE_NAMES, INPUT_COLUMNS, downloadCSV } from '@/lib/helpers'
import HotTable from '@/components/HotTable.vue'
import CategoryCard from '@/components/CategoryCard.vue'
import SettingsPane from '@/components/SettingsPane.vue'
import SettingsGroup from '@/components/SettingsGroup.vue'
import AppHeader from '@/components/AppHeader.vue'
import HelpText from '@/components/HelpText.vue'
import RowFilters from '@/components/RowFilters.vue'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Accordion } from '@/components/ui/accordion'
import { Columns } from 'lucide-vue-next'

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
const inputHotRef = ref()
const defaultInputHeaders = ref<string[]>()
const hasHeaderRow = ref(true)

watch(hasHeaderRow, async (v) => {
  if (!v) {
    await nextTick()
    defaultInputHeaders.value = inputHotRef.value?.hotInstance.getColHeader()
  }
})

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

// Column mapping validation
const columnMappingIsValid = computed(() => {
  const requiredColumns = INPUT_COLUMNS.filter((col) => col.required)
  return requiredColumns.every((col) => colIndexes[col.id] >= 0)
})

// Individual field validation
const isFieldValid = computed(() => (fieldId: string) => {
  const column = INPUT_COLUMNS.find((col) => col.id === fieldId)
  if (column?.required) {
    return colIndexes[fieldId] >= 0
  }
  return true // optional fields are always considered valid
})

// Step 3 validation
const bibNumbersIsValid = computed(() => {
  return maxBibNumber.value != null && maxBibNumber.value > 0
})

const csvOutputIsValid = computed(() => {
  return isPrintingYears.value != null // This is always valid since it has a default
})

const isCountryColumnMapped = computed(() => {
  return colIndexes.country >= 0
})

const rowFilteringIsValid = computed(() => {
  return true // Row filtering is always valid since it's optional
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
const categoryCardRef = ref<(typeof CategoryCard)[]>()

watch(inputData, () => {
  partitions.value = {}
})

watch(step, () => {
  setTimeout(() => {
    categoryCardRef.value?.forEach((card) => card.refresh?.())
  }, 500) // duration of stepper transition
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
      <div v-if="step === 1" class="h-full">
        <SettingsPane>
          <HotTable
            v-if="inputData"
            ref="inputHotRef"
            :data="rowFilteringConfig.showDimmed && rowFilteringConfig.enabled ? (inputCSV?.slice(hasHeaderRow ? 1 : 0) || []) : inputData"
            :dimmed-rows="rowFilteringConfig.showDimmed && rowFilteringConfig.enabled ? filteredOutRowIndexes : []"
            :settings="{
              colHeaders: hasHeaderRow ? inputHeaders : true,
              readOnly: true,
            }"
          />

          <template #settings>
            <HelpText>
              Map the columns to the correct fields for automatic grouping. 
            </HelpText>

            <Accordion
              type="multiple"
              :default-value="columnMappingIsValid === false ? ['Column mapping'] : []"
            >
              <SettingsGroup
                title="Column mapping"
                :icon="Columns"
                :is-valid="columnMappingIsValid"
              >
                <div class="space-y-4">
                  <div class="space-y-2">
                    <Label for="header-row">Header row</Label>
                    <label
                      class="border-input data-[placeholder]:text-muted-foreground [&_svg:not([class*='text-'])]:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive dark:bg-input/30 dark:hover:bg-input/50 flex w-full items-center justify-between gap-2 rounded-md border bg-transparent px-3 py-2 text-sm whitespace-nowrap shadow-xs transition-[color,box-shadow] outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50 data-[size=default]:h-9 data-[size=sm]:h-8 *:data-[slot=select-value]:line-clamp-1 *:data-[slot=select-value]:flex *:data-[slot=select-value]:items-center *:data-[slot=select-value]:gap-2 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4"
                    >
                      <span>Present</span>
                      <Switch id="header-row" v-model="hasHeaderRow" />
                    </label>
                  </div>

                  <div v-for="{ id, name, required } in INPUT_COLUMNS" :key="id" class="space-y-2">
                    <Label 
                      :for="id" 
                      :class="{
                        'text-destructive': required && !isFieldValid(id)
                      }"
                    >
                      {{ name }}{{ required ? ' *' : '' }}
                    </Label>
                    <Select
                      :model-value="inputHeaders[colIndexes[id]]"
                      @update:model-value="
                        (value) => (colIndexes[id] = inputHeaders.indexOf(value as string))
                      "
                    >
                      <SelectTrigger class="w-full">
                        <SelectValue placeholder="Select column..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem v-for="header in inputHeaders" :key="header" :value="header">
                          {{ header }}
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </SettingsGroup>

              <SettingsGroup
                title="Row filtering"
                :is-valid="rowFilteringIsValid"
              >
                <RowFilters 
                  :input-headers="inputHeaders"
                  :filters="rowFilteringConfig.filters"
                  :show-dimmed="rowFilteringConfig.showDimmed"
                  @filters-changed="handleFiltersChanged"
                />
              </SettingsGroup>
            </Accordion>
          </template>

          <template #footer>
            <Button @click="step = 2" class="w-full">Next</Button>
          </template>
        </SettingsPane>
      </div>

      <!-- Step 2: Group -->
      <div v-else-if="step === 2" class="h-full">
        <SettingsPane>
          <div class="p-4 space-y-4">
            <CategoryCard
              v-for="categoryCode in Object.keys(CATEGORY_CODE_NAMES).filter(
                (c) => categories?.[c],
              )"
              :key="categoryCode"
              ref="categoryCardRef"
              :name="CATEGORY_CODE_NAMES[categoryCode]"
              :ages="categories![categoryCode]"
              @partition="handlePartition(categoryCode, $event)"
            />
          </div>

          <template #settings>
            <HelpText>
              Ensure the categories are split appropriately, or adjust them as needed.
            </HelpText>
          </template>

          <template #footer>
            <Button @click="step = 3" class="w-full">Next</Button>
          </template>
        </SettingsPane>
      </div>

      <!-- Step 3: Export -->
      <div v-else-if="step === 3" class="h-full">
        <SettingsPane>
          <HotTable
            v-if="output?.length"
            :data="output"
            :settings="{
              readOnly: true,
              columns: new Array(outputNumColumns),
              height: 600,
            }"
          />

          <template #settings>
            <div class="space-y-4">
              <HelpText>
                Bib numbers are assigned based on reverse order of registration. You can adjust the
                highest bib number to start from.
              </HelpText>

              <Accordion type="multiple">
                <SettingsGroup title="Bib numbers" :is-valid="bibNumbersIsValid">
                  <div class="space-y-2">
                    <Label for="max-bib">Highest bib number</Label>
                    <Input
                      id="max-bib"
                      type="number"
                      v-model.number="maxBibNumber"
                      :min="1"
                      @blur="!maxBibNumber && (maxBibNumber = defaultMaxBibNumber)"
                    />
                  </div>
                </SettingsGroup>

                <SettingsGroup title="CSV output" :is-valid="csvOutputIsValid">
                  <div class="space-y-4">
                    <div class="space-y-2">
                      <Label for="print-years">Age group names</Label>
                      <label
                        class="border-input data-[placeholder]:text-muted-foreground [&_svg:not([class*='text-'])]:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive dark:bg-input/30 dark:hover:bg-input/50 flex w-full items-center justify-between gap-2 rounded-md border bg-transparent px-3 py-2 text-sm whitespace-nowrap shadow-xs transition-[color,box-shadow] outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50 data-[size=default]:h-9 data-[size=sm]:h-8 *:data-[slot=select-value]:line-clamp-1 *:data-[slot=select-value]:flex *:data-[slot=select-value]:items-center *:data-[slot=select-value]:gap-2 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4"
                      >
                        <span>Print "Years"</span>
                        <Switch id="print-years" v-model="isPrintingYears" />
                      </label>
                    </div>
                    
                    <div class="space-y-2">
                      <Label for="include-country">Location</Label>
                      <label
                        :class="[
                          'border-input data-[placeholder]:text-muted-foreground [&_svg:not([class*=\'text-\'])]:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive dark:bg-input/30 dark:hover:bg-input/50 flex w-full items-center justify-between gap-2 rounded-md border bg-transparent px-3 py-2 text-sm whitespace-nowrap shadow-xs transition-[color,box-shadow] outline-none focus-visible:ring-[3px] data-[size=default]:h-9 data-[size=sm]:h-8 *:data-[slot=select-value]:line-clamp-1 *:data-[slot=select-value]:flex *:data-[slot=select-value]:items-center *:data-[slot=select-value]:gap-2 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*=\'size-\'])]:size-4',
                          !isCountryColumnMapped && 'cursor-not-allowed opacity-50'
                        ]"
                      >
                        <span>Include country</span>
                        <Switch 
                          id="include-country" 
                          v-model="includeCountry" 
                          :disabled="!isCountryColumnMapped"
                        />
                      </label>
                    </div>
                  </div>
                </SettingsGroup>
              </Accordion>
            </div>
          </template>

          <template #footer>
            <Button @click="downloadCSV(outputCSV)" class="w-full">Export CSV</Button>
          </template>
        </SettingsPane>
      </div>
    </div>
  </div>
</template>
