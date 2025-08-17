<template>
  <div class="flex flex-col min-h-screen">
    <!-- Fixed Toolbar -->
    <header
      class="fixed top-0 left-0 right-0 z-50 grid grid-cols-[1fr_auto_1fr] items-center px-3 py-1.5 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 h-12"
      v-view-transition-name="'Header'"
    >
      <!-- Left side -->
      <div class="flex items-center gap-1 justify-self-start">
        <!-- Status moved to footer -->
      </div>

      <!-- Center - Logo -->
      <div class="justify-self-center">
        <button
          class="will-change-transform flex items-center gap-2 text-sm font-semibold text-primary hover:text-primary/80 transition-colors"
          @click="goToHome"
        >
          <img
            src="/touchicon.png"
            alt="Splits Logo"
            class="size-4"
            v-view-transition-name="'splits-logo'"
          />
          <span v-view-transition-name="'splits-name'">Splits</span>
        </button>
      </div>

      <!-- Right side -->
      <div class="flex items-center gap-1 justify-self-end">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="sm" @click="toggleDancers" class="w-8 h-8 p-0">
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
    <main class="pt-12 flex-auto">
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
    <div class="sticky bottom-0 z-40 mt-8 pb-8" v-view-transition-name="'FloatingFooter'">
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
          <div class="w-5 h-5 flex items-center justify-center rounded-full bg-green-500/25">
            <svg
              class="w-3 h-3 text-green-500"
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
          <p class="text-sm font-medium text-green-500">Ready to export</p>
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
              <Share class="h-4 w-4" />
              Export
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
      <template #preview>
        <h3 class="text-sm font-medium">Input Data Preview</h3>
        <div class="border rounded-lg">
          <InputDataTable
            :data="store.inputCSV || []"
            :headers="store.inputHeaders"
            :height="300"
          />
        </div>
      </template>
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
              :model-value="(store.inputHeaders[store.colIndexes[id]] || 'none') as string"
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
      <template #preview>
        <h3 class="text-sm font-medium">Export Preview</h3>
        <div class="border rounded-lg">
          <OutputDataTable :data="exportPreviewData" :height="300" />
        </div>
        <p class="text-xs text-muted-foreground">
          Preview of your export data. Changes to settings will update this preview in real-time.
        </p>
      </template>
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
import { startViewTransition } from 'vue-view-transitions'
import { useAppStore } from '@/stores/app'
import { Button } from '@/components/ui/button'
import { Table, Settings, X, AlertTriangle, PersonStanding, Share } from 'lucide-vue-next'
import DarkModeToggle from '@/components/DarkModeToggle.vue'
import SettingsSheet from '@/components/SettingsSheet.vue'
import { downloadCSV } from '@/lib/helpers'
import { CATEGORY_CODE_NAMES, INPUT_COLUMNS, createPartitions, type Partition } from '@/lib/input'
import { generateExportData, convertToCSV, type ExportSettings } from '@/lib/output'
import OutputDataTable from '@/components/OutputDataTable.vue'
import InputDataTable from '@/components/InputDataTable.vue'
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
const partitions = ref<Record<string, Partition[]>>({})

// Provide for CategoryCard components
provide(
  'isPrintingYears',
  computed(() => store.isPrintingYears),
)
provide('showDancers', showDancers)
async function toggleDancers() {
  const viewTransition = startViewTransition()
  await viewTransition.captured
  showDancers.value = !showDancers.value
}

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

function updateColIndex(id: string, value: any) {
  const newIndexes = { ...store.colIndexes }
  const stringValue = String(value || 'none')
  newIndexes[id] = stringValue === 'none' ? -1 : store.inputHeaders.indexOf(stringValue)
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
  // Update the store's partitioned categories first
  const newPartitionedCategories = {
    ...store.partitionedCategories,
    [categoryCode]: partitionedAgeRanges.map(
      ([minAge, maxAge]) => [minAge, maxAge] as [number, number],
    ),
  }
  store.setProcessedData(store.categories!, newPartitionedCategories)

  // Use shared function to create partitions for this category
  const categoryPartitions = createPartitions(
    { [categoryCode]: store.categories?.[categoryCode] || {} },
    { [categoryCode]: newPartitionedCategories[categoryCode] },
  )

  partitions.value[categoryCode] = categoryPartitions[categoryCode] || []
}

// Generate export preview data
const exportPreviewData = computed(() => {
  if (!store.inputCSV) return []

  const settings: ExportSettings = {
    maxBibNumber: store.maxBibNumber,
    isPrintingYears: store.isPrintingYears,
    includeCountry: store.includeCountry,
  }

  return generateExportData(
    store.inputCSV,
    store.colIndexes,
    partitions.value,
    settings,
    store.hasHeaderRow,
  )
})

// Export function using shared logic
function handleExportDownload() {
  const csvContent = convertToCSV(exportPreviewData.value)
  downloadCSV(csvContent, 'splits-export')
}
</script>
