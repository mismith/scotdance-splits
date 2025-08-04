<script setup lang="ts">
import { ref, computed, reactive, watch, provide, nextTick } from 'vue'
import { parse, unparse } from 'papaparse'

import { getAgeGroupName, CATEGORY_CODE_NAMES, INPUT_COLUMNS, downloadCSV } from '@/lib/helpers'
import HotTable from '@/components/HotTable.vue'
import CategoryCard from '@/components/CategoryCard.vue'
import SettingsPane from '@/components/SettingsPane.vue'
import SettingsGroup from '@/components/SettingsGroup.vue'
import HomePage from '@/components/HomePage.vue'
import FileUpload from '@/components/FileUpload.vue'
import AppHeader from '@/components/AppHeader.vue'

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

// Step management
const step = ref(1)
const maxStep = ref(step.value)
watch(step, () => {
  if (maxStep.value < step.value) {
    maxStep.value = step.value
  }
})

// File input handling
const inputFiles = ref<File[]>()
const inputError = ref<string>()

// CSV data processing
const inputCSV = ref<string[][]>()
const isLoadingInputFile = ref(false)

async function handleFileSelected(file: File) {
  inputError.value = undefined
  isLoadingInputFile.value = true

  try {
    const results = await new Promise<any>((resolve, reject) => {
      parse(file, {
        worker: true,
        complete: resolve,
        error: reject,
      })
    })
    inputCSV.value = results.data as string[][]
    inputFiles.value = [file]
  } catch (error) {
    inputError.value = 'Failed to parse CSV file'
  } finally {
    isLoadingInputFile.value = false
  }
}

function handleErrorDismiss() {
  inputError.value = undefined
}

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
  return inputCSV.value?.slice(hasHeaderRow.value ? 1 : 0)
})

const colIndexes = reactive(
  INPUT_COLUMNS.reduce(
    (acc, col) => {
      acc[col.id] = 0
      return acc
    },
    {} as Record<string, number>,
  ),
)

watch(inputHeaders, (headers) => {
  INPUT_COLUMNS.forEach((col) => {
    colIndexes[col.id] = headers.findIndex((header) => col.regex.test(header))
  })
})

// Bib number assignment
const maxBibNumber = ref<number>()
const defaultMaxBibNumber = ref<number>()
const isPrintingYears = ref(true)
provide('isPrintingYears', isPrintingYears)

watch(inputData, (v) => {
  const defaultValue = Math.round(((v?.length || 100) + 50) / 100) * 100 + 100
  if (!maxBibNumber.value || maxBibNumber.value === defaultValue) {
    maxBibNumber.value = defaultValue
  }
  defaultMaxBibNumber.value = defaultValue
})

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
        ...rows.map((row) => [
          row[row.length - 1],
          row[colIndexes.firstName] || (!row[colIndexes.lastName] && row[colIndexes.fullName]),
          row[colIndexes.lastName],
          [row[colIndexes.location], row[colIndexes.region], row[colIndexes.country]]
            .filter(Boolean)
            .join(', '),
        ]),
      )
    })
  return data
})

const outputCSV = computed(() => unparse(output.value))
</script>

<template>
  <div class="h-screen flex flex-col">
    <!-- Home page with file upload -->
    <template v-if="!inputFiles?.length" class="flex-1">
      <FileUpload
        :is-loading="isLoadingInputFile"
        :error="inputError"
        @file-selected="handleFileSelected"
        @error-dismiss="handleErrorDismiss"
      >
        <template #default="{ chooseFile }">
          <HomePage
            :is-loading-input-file="isLoadingInputFile"
            :input-error="inputError"
            @file-selected="handleFileSelected"
            @error-dismiss="handleErrorDismiss"
            @choose-file="chooseFile"
          />
        </template>
      </FileUpload>
    </template>

    <!-- Main stepper interface -->
    <div v-else class="flex-1 flex flex-col h-full">
      <!-- Header with compact stepper -->
      <AppHeader
        :show-stepper="true"
        :step="step"
        :max-step="maxStep"
        @step-change="step = $event"
        @home-click="inputFiles = undefined"
      />

      <!-- Step content -->
      <div class="flex-1 overflow-hidden h-full">
        <!-- Step 1: Input -->
        <div v-if="step === 1" class="h-full">
          <SettingsPane>
            <HotTable
              v-if="inputData"
              ref="inputHotRef"
              :data="inputData"
              :settings="{
                colHeaders: hasHeaderRow ? inputHeaders : true,
                readOnly: true,
              }"
            />

            <template #settings>
              <div class="space-y-4">
                <p class="text-sm text-muted-foreground">
                  The page shows your input data. In order to do grouping automatically, you need to
                  map the columns to the correct fields. If there are extra rows, remove them in the
                  spreadsheet file first then try again.
                </p>

                <SettingsGroup title="Input file">
                  <Button variant="outline" @click="inputFiles = undefined">
                    Choose different file
                  </Button>
                </SettingsGroup>

                <SettingsGroup title="Column mapping">
                  <div class="space-y-4">
                    <div class="flex items-center space-x-2">
                      <Switch id="header-row" v-model:checked="hasHeaderRow" />
                      <Label for="header-row">Header row</Label>
                    </div>

                    <div
                      v-for="{ id, name, required } in INPUT_COLUMNS"
                      :key="id"
                      class="space-y-2"
                    >
                      <Label :for="id">{{ name }}{{ required ? ' *' : '' }}</Label>
                      <Select
                        :model-value="inputHeaders[colIndexes[id]]"
                        @update:model-value="
                          (value) => (colIndexes[id] = inputHeaders.indexOf(value as string))
                        "
                      >
                        <SelectTrigger>
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
              </div>
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
              <p class="text-sm text-muted-foreground">
                Ensure the categories are split appropriately, or adjust them as needed.
              </p>
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
                <p class="text-sm text-muted-foreground">
                  Bib numbers are assigned based on reverse order of registration. You can adjust
                  the highest bib number to start from.
                </p>

                <SettingsGroup title="Bib numbers">
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

                <SettingsGroup title="CSV output">
                  <div class="flex items-center space-x-2">
                    <Switch id="print-years" v-model:checked="isPrintingYears" />
                    <Label for="print-years">Print 'Years' in age group names</Label>
                  </div>
                </SettingsGroup>
              </div>
            </template>

            <template #footer>
              <Button @click="downloadCSV(outputCSV)" class="w-full">Export CSV</Button>
            </template>
          </SettingsPane>
        </div>
      </div>
    </div>
  </div>
</template>
