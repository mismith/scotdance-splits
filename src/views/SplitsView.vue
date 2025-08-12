<template>
  <div>
    <!-- Fixed Toolbar -->
    <header
      class="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-3 py-1.5 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 h-12"
    >
      <!-- Left side -->
      <div class="flex items-center gap-1">
        <!-- Status moved to footer -->
      </div>

      <!-- Center - Logo -->
      <div class="flex-1 flex justify-center">
        <div class="flex items-center gap-3">
          <img src="/touchicon.png" alt="Splits Logo" class="w-4 h-4" />
          <button
            @click="goToHome"
            class="text-sm font-semibold text-primary hover:text-primary/80 transition-colors"
          >
            Splits
          </button>
          <div class="w-3"></div>
          <!-- Spacer -->
        </div>
      </div>

      <!-- Right side -->
      <div class="flex items-center gap-1">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                @click="showDancers = !showDancers"
                class="w-8 h-8 p-0"
              >
                <PersonStanding class="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>{{ showDancers ? 'Hide Dancers' : 'Show Dancers' }}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
        <DarkModeToggle />
      </div>
    </header>

    <!-- Main content with top padding to account for fixed header -->
    <main class="pt-12">
      <div
        v-if="!store.hasData"
        class="flex items-center justify-center py-20 text-muted-foreground"
      >
        <div class="text-center">
          <Table class="h-16 w-16 mx-auto mb-4 opacity-50" />
          <h3 class="text-lg font-semibold mb-2">No data to display</h3>
          <p class="text-sm">Upload a CSV file to see age group splits</p>
        </div>
      </div>

      <div v-else class="p-4 space-y-4">
        <CategoryCard
          v-for="categoryCode in Object.keys(CATEGORY_CODE_NAMES).filter(
            (c) => store.categories?.[c],
          )"
          :key="categoryCode"
          ref="categoryCardRef"
          :name="CATEGORY_CODE_NAMES[categoryCode]"
          :ages="store.categories?.[categoryCode] || {}"
          @partition="handlePartition(categoryCode, $event)"
        />
      </div>
    </main>

    <!-- Sticky Footer - Status/Export -->
    <div class="sticky bottom-0 z-50 mt-8 pb-8">
      <!-- Status Problems -->
      <div
        v-if="dataStatus.status === 'error' && !validationDismissed"
        class="bg-gradient-to-r from-red-50 to-red-100 dark:from-red-950/50 dark:to-red-900/50 border border-red-200 dark:border-red-800 shadow-xl rounded-2xl max-w-lg mx-auto mb-4 relative overflow-hidden backdrop-blur-sm"
      >
        <!-- Close button -->
        <Button
          variant="ghost"
          size="sm"
          @click.stop="dismissValidationErrors"
          class="absolute top-4 right-4 w-8 h-8 p-0 z-10 rounded-full hover:bg-red-100 dark:hover:bg-red-900/50 transition-colors"
        >
          <X class="h-4 w-4 text-red-500 dark:text-red-400" />
        </Button>

        <!-- Main content -->
        <div class="p-6 pr-16">
          <div class="flex items-start gap-4">
            <div
              class="w-10 h-10 flex items-center justify-center rounded-full bg-red-100 dark:bg-red-900/50 flex-shrink-0 mt-0.5"
            >
              <AlertTriangle class="w-5 h-5 text-red-600 dark:text-red-400" />
            </div>
            <div class="flex-1 min-w-0">
              <h3 class="text-base font-semibold text-red-900 dark:text-red-100 mb-1">
                {{ dataStatus.label }}
              </h3>
              <p class="text-sm text-red-700 dark:text-red-300 mb-4">
                Column mapping issues need to be resolved before exporting your data.
              </p>

              <!-- Action buttons -->
              <div class="flex gap-2">
                <Button
                  @click.stop="handleDataStatusAction"
                  size="sm"
                  class="bg-red-600 hover:bg-red-700 text-white border-0 shadow-sm"
                >
                  Fix mapping
                </Button>
                <Button
                  @click.stop="dismissValidationErrors"
                  variant="ghost"
                  size="sm"
                  class="text-red-600 hover:bg-red-100 dark:text-red-400 dark:hover:bg-red-900/50"
                >
                  Dismiss
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Export CTA (hidden when there are unresolved issues) -->
      <div
        v-if="dataStatus.status === 'success' || validationDismissed"
        class="bg-card border border-border shadow-lg rounded-xl p-6 max-w-lg mx-auto"
      >
        <div
          v-if="dataStatus.status === 'success'"
          class="flex items-center justify-center gap-2 mb-4"
        >
          <div
            class="w-5 h-5 flex items-center justify-center rounded-full bg-green-100 dark:bg-green-900/50"
          >
            <svg
              class="w-3 h-3 text-green-600 dark:text-green-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M5 13l4 4L19 7"
              ></path>
            </svg>
          </div>
          <p class="text-sm font-medium text-green-700 dark:text-green-300">
            Age groups organized and ready to export
          </p>
        </div>

        <!-- Error warning when validation was dismissed - directly above button -->
        <div
          v-if="validationDismissed && dataStatus.status === 'error'"
          class="flex items-center gap-3 p-3 mb-3 bg-gradient-to-r from-red-50 to-red-100 dark:from-red-950/30 dark:to-red-900/30 border border-red-200 dark:border-red-800/50 rounded-xl"
        >
          <div
            class="w-6 h-6 flex items-center justify-center rounded-full bg-red-100 dark:bg-red-900/50 flex-shrink-0"
          >
            <AlertTriangle class="h-3 w-3 text-red-600 dark:text-red-400" />
          </div>
          <span class="text-xs text-red-700 dark:text-red-300 flex-1"
            >Export may not work properly due to data issues</span
          >
          <Button
            variant="ghost"
            size="sm"
            @click="showValidationErrors"
            class="h-6 px-2 text-xs text-red-600 hover:bg-red-100 dark:text-red-400 dark:hover:bg-red-900/50 ml-auto"
          >
            Review
          </Button>
        </div>

        <!-- Split Export Button -->
        <div class="flex rounded-lg overflow-hidden border">
          <Button size="lg" @click="handleExportDownload" class="flex-1 rounded-r-none border-r-0">
            <span class="flex items-center gap-2">
              <Download class="h-4 w-4" />
              Export CSV
            </span>
          </Button>
          <Button
            size="lg"
            @click="showExportSettingsSheet = true"
            class="px-3 rounded-l-none border-l"
          >
            <Settings class="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>

    <!-- Column mapping settings sheet -->
    <SettingsSheet
      v-model:open="showColumnMappingSheet"
      title="Column Mapping"
      description="Map your CSV columns to the correct fields for processing"
      @save="saveColumnMapping"
    >
      <template #settings>
        <div class="space-y-4">
          <div class="space-y-2">
            <Label for="header-row">Header row</Label>
            <label
              class="border-input data-[placeholder]:text-muted-foreground [&_svg:not([class*='text-'])]:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive dark:bg-input/30 dark:hover:bg-input/50 flex w-full items-center justify-between gap-2 rounded-md border bg-transparent px-3 py-2 text-sm whitespace-nowrap shadow-xs transition-[color,box-shadow] outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50 data-[size=default]:h-9 data-[size=sm]:h-8 *:data-[slot=select-value]:line-clamp-1 *:data-[slot=select-value]:flex *:data-[slot=select-value]:items-center *:data-[slot=select-value]:gap-2 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4"
            >
              <span>Present</span>
              <Switch
                id="header-row"
                :model-value="store.hasHeaderRow"
                @update:model-value="(value) => (store.hasHeaderRow = value)"
              />
            </label>
          </div>

          <div v-for="{ id, name, required } in INPUT_COLUMNS" :key="id" class="space-y-2">
            <Label
              :for="id"
              :class="{
                'text-destructive': required && !isFieldValid(id),
              }"
            >
              {{ name }}{{ required ? ' *' : '' }}
            </Label>
            <Select
              :model-value="store.inputHeaders[store.colIndexes[id]] || 'none'"
              @update:model-value="updateColIndex(id, $event)"
            >
              <SelectTrigger class="w-full">
                <SelectValue placeholder="Select column..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">None</SelectItem>
                <SelectSeparator />
                <SelectItem v-for="header in store.inputHeaders" :key="header" :value="header">
                  {{ header }}
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </template>
    </SettingsSheet>

    <!-- Export settings sheet -->
    <SettingsSheet
      v-model:open="showExportSettingsSheet"
      title="Export Settings"
      description="Configure bib numbers and output format options"
      @save="saveExportSettings"
    >
      <template #settings>
        <div class="space-y-6">
          <div class="space-y-4">
            <h3 class="text-sm font-semibold">Bib Numbers</h3>
            <div class="space-y-2">
              <Label for="max-bib">Highest bib number</Label>
              <Input
                id="max-bib"
                type="number"
                :model-value="store.maxBibNumber"
                @update:model-value="
                  (value) => store.updateExportSettings({ maxBibNumber: Number(value) })
                "
                class="w-full"
              />
              <p class="text-xs text-muted-foreground">
                Bib numbers will count down from this number based on registration order
              </p>
            </div>
          </div>

          <div class="space-y-4">
            <h3 class="text-sm font-semibold">Output Format</h3>
            <div class="space-y-4">
              <div class="flex items-center justify-between">
                <div>
                  <Label for="printing-years">Include "Years" in age group names</Label>
                  <p class="text-xs text-muted-foreground">
                    e.g., "Premier 6-8 Years" vs "Premier 6-8"
                  </p>
                </div>
                <Switch
                  id="printing-years"
                  :model-value="store.isPrintingYears"
                  @update:model-value="
                    (value) => store.updateExportSettings({ isPrintingYears: value })
                  "
                />
              </div>

              <div class="flex items-center justify-between">
                <div>
                  <Label for="include-country">Include country in location</Label>
                  <p class="text-xs text-muted-foreground">
                    Add country to dancer locations when available
                  </p>
                </div>
                <Switch
                  id="include-country"
                  :model-value="store.includeCountry"
                  @update:model-value="
                    (value) => store.updateExportSettings({ includeCountry: value })
                  "
                />
              </div>
            </div>
          </div>
        </div>
      </template>
    </SettingsSheet>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, provide } from 'vue'
import { useAppStore } from '@/stores/app'
import { Button } from '@/components/ui/button'
import { Table, Settings, Download, X, AlertTriangle, PersonStanding } from 'lucide-vue-next'
import DarkModeToggle from '@/components/DarkModeToggle.vue'
import SettingsSheet from '@/components/SettingsSheet.vue'
import { unparse } from 'papaparse'
import { downloadCSV } from '@/lib/helpers'
import { getAgeGroupName, CATEGORY_CODE_NAMES, INPUT_COLUMNS } from '@/lib/data'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Input } from '@/components/ui/input'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import CategoryCard from '@/components/CategoryCard.vue'

const store = useAppStore()

const categoryCardRef = ref<(typeof CategoryCard)[]>()
const showColumnMappingSheet = ref(false)
const showExportSettingsSheet = ref(false)
const validationDismissed = ref(false)
const showDancers = ref(true)

// Data quality status
const dataStatus = computed(() => {
  const inputData = store.inputCSV?.slice(store.hasHeaderRow ? 1 : 0) || []
  const totalEntries = inputData.length

  // Check column mapping completeness - only require what's actually in INPUT_COLUMNS
  const requiredColumns = INPUT_COLUMNS.filter((col) => col.required).map((col) => col.id)
  const unmappedColumns = requiredColumns.filter((col) => store.colIndexes[col] === -1)

  const hasMissingColumns = unmappedColumns.length > 0

  if (hasMissingColumns) {
    // Create specific error message with missing column names
    const missingNames = unmappedColumns.map((col) => {
      const inputCol = INPUT_COLUMNS.find((c) => c.id === col)
      return inputCol?.name || col
    })

    const missingText =
      missingNames.length === 1
        ? missingNames[0]
        : missingNames.length === 2
          ? `${missingNames[0]} and ${missingNames[1]}`
          : `${missingNames.slice(0, -1).join(', ')}, and ${missingNames[missingNames.length - 1]}`

    return {
      status: 'error' as const,
      label: `Missing ${missingText} column mapping`,
      actionLabel: 'Fix mapping',
    }
  }

  return {
    status: 'success' as const,
    label: `Data: ${totalEntries} entries, ready`,
    actionLabel: undefined,
  }
})

// Partitions store - maps category code to age ranges
type Partition = {
  categoryCode: string
  ageRange: number[]
  codes: string[]
}

const partitions = ref<Record<string, Partition[]>>({})

// Provide for CategoryCard components
provide(
  'isPrintingYears',
  computed(() => store.isPrintingYears),
)
provide('showDancers', showDancers)

// Navigation functions
function goToHome() {
  // Clear data to return to home view
  store.clearAllData()
}

function handleDataStatusAction() {
  showColumnMappingSheet.value = true
}

function saveColumnMapping() {
  showColumnMappingSheet.value = false
  // Column mapping changes are already applied through store updates
}

function saveExportSettings() {
  showExportSettingsSheet.value = false
  // Export settings changes are already applied through store updates
}

function dismissValidationErrors() {
  validationDismissed.value = true
}

function showValidationErrors() {
  validationDismissed.value = false
}

function updateColIndex(id: string, value: string) {
  const newIndexes = { ...store.colIndexes }
  newIndexes[id] = value === 'none' ? -1 : store.inputHeaders.indexOf(value)
  store.updateColIndexes(newIndexes)
}

function isFieldValid(fieldId: string) {
  const column = INPUT_COLUMNS.find((col) => col.id === fieldId)
  if (column?.required) {
    return store.colIndexes[fieldId] >= 0
  }
  return true
}

function handlePartition(categoryCode: string, partitionedAgeRanges: number[][]) {
  const ageCodesWithinGroup = Object.keys(store.categories?.[categoryCode] || {})
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

  // Update the store's partitioned categories
  const newPartitionedCategories = {
    ...store.partitionedCategories,
    [categoryCode]: partitionedAgeRanges.map(
      ([minAge, maxAge]) => [minAge, maxAge] as [number, number],
    ),
  }
  store.setProcessedData(store.categories!, newPartitionedCategories)
}

// Generate numbered CSV with bib numbers based on registration order
const numberedCSV = computed(() => {
  const inputData = store.inputCSV?.slice(store.hasHeaderRow ? 1 : 0) || []

  return inputData
    ?.filter((row) => row[store.colIndexes.firstName || 0])
    .sort((rowA, rowB) =>
      (rowA[store.colIndexes.timestamp || 0] || '').localeCompare(
        rowB[store.colIndexes.timestamp || 0] || '',
      ),
    )
    .map((row, index) => [...row, `${(store.maxBibNumber || 100) - index}`])
})

// Real export function using original logic
function handleExportDownload() {
  const data: (string | number)[][] = []

  Object.values(partitions.value)
    .flat()
    .forEach((partition) => {
      if (data.length) data.push([])

      const name = `${CATEGORY_CODE_NAMES[partition.categoryCode]} ${getAgeGroupName(partition.ageRange[0], partition.ageRange[1], store.isPrintingYears)}`
      data.push([name])

      const rows =
        numberedCSV.value?.filter((row) =>
          row.find((value) => partition.codes.includes(value as string)),
        ) || []
      data.push(
        ...rows.map((row) => {
          // Build location column based on includeCountry setting
          const locationParts: string[] = []
          
          if (store.colIndexes.location !== -1 && row[store.colIndexes.location]) {
            locationParts.push(String(row[store.colIndexes.location]))
          }
          if (store.colIndexes.region !== -1 && row[store.colIndexes.region]) {
            locationParts.push(String(row[store.colIndexes.region]))
          }

          if (
            store.includeCountry &&
            store.colIndexes.country !== -1 &&
            row[store.colIndexes.country]
          ) {
            locationParts.push(String(row[store.colIndexes.country]))
          }

          return [
            row[row.length - 1], // bib number (last column)
            row[store.colIndexes.firstName || 0] ||
              (!row[store.colIndexes.lastName || 0] && row[store.colIndexes.fullName || 0]),
            row[store.colIndexes.lastName || 0],
            locationParts.join(', '),
          ]
        }),
      )
    })

  const csvContent = unparse(data)
  downloadCSV(csvContent, 'splits-export')
}
</script>
