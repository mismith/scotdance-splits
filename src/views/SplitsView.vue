<template>
  <div class="flex flex-col min-h-screen">
    <!-- Fixed Toolbar -->
    <header
      style="view-transition-name: match-element"
      class="fixed top-0 left-0 right-0 z-50 grid grid-cols-[1fr_auto_1fr] items-center px-4 h-16 bg-gradient-to-b from-background to-transparent"
    >
      <!-- Left side -->
      <div class="flex items-center gap-1 justify-self-start">
        <Tooltip>
          <TooltipTrigger as-child>
            <Button variant="outline" size="icon" @click="showColumnMappingSheet = true">
              <Map class="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Column mapping</p>
          </TooltipContent>
        </Tooltip>
      </div>

      <!-- Center - Logo -->
      <div class="flex flex-col items-center justify-self-center">
        <Button variant="outline" as-child>
          <router-link
            to="/"
            class="font-semibold text-primary backdrop-blur hover:tracking-widest duration-500 transition-all"
          >
            <div class="flex items-center gap-2">
              <img
                src="/touchicon.png"
                alt="Splits Logo"
                class="size-4"
                v-view-transition-name="'splits-logo'"
              />
              <span
                class="text-sm font-semibold text-primary"
                v-view-transition-name="'splits-name'"
              >
                Splits
              </span>
            </div>
          </router-link>
        </Button>
        <Badge
          v-if="isDemoMode"
          variant="accent"
          class="text-xs -mt-1 -mb-5 bg-accent/50 backdrop-blur-md"
        >
          Demo
        </Badge>
      </div>

      <!-- Right side -->
      <div class="hidden md:flex items-center gap-1 justify-self-end">
        <Tooltip>
          <TooltipTrigger as-child>
            <Button
              :variant="showDancers ? 'default' : 'outline'"
              size="icon"
              @click="toggleDancers"
            >
              <Users class="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>{{ showDancers ? 'Hide dancers' : 'Show dancers' }}</p>
          </TooltipContent>
        </Tooltip>
      </div>
    </header>

    <!-- Main content with top padding to account for fixed header -->
    <main class="pt-16 flex-auto">
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
    <div class="sticky bottom-0 md:bottom-8 z-40 mt-8 pointer-events-none">
      <!-- Validation Banner -->
      <ValidationBanner
        v-if="!validationDismissed && allValidationIssues.length > 0"
        :issues="allValidationIssues"
        @review="handleReviewErrors"
        @dismiss="dismissValidationErrors"
      />
      <!-- Export CTA (hidden when there are unresolved issues) -->
      <div
        v-if="allValidationIssues.length === 0 || validationDismissed"
        v-view-transition-name="'FloatingFooter'"
        class="pointer-events-auto bg-background/70 backdrop-blur-md border-t md:border border-border shadow-sm rounded-t-4xl md:rounded-4xl px-6 py-5 md:p-6 max-w-lg mx-auto flex flex-col gap-3"
      >
        <div v-if="allValidationIssues.length === 0" class="flex items-center justify-center gap-2">
          <div class="w-5 h-5 flex items-center justify-center rounded-full bg-green-500/25 -my-2">
            <Check class="size-4 text-green-500" />
          </div>
          <p class="text-sm font-medium text-green-500">Ready to export</p>
        </div>

        <!-- Error/warning indicator when validation was dismissed - directly above button -->
        <div
          v-if="validationDismissed && allValidationIssues.length > 0"
          class="flex items-center gap-3 p-2 mb-3 rounded-3xl"
          :class="
            allValidationIssues.some((i) => i.severity === 'error')
              ? 'bg-gradient-to-r from-red-50 to-red-100 dark:from-red-950/30 dark:to-red-900/30 border border-red-200 dark:border-red-800/50'
              : 'bg-gradient-to-r from-primary/10 to-primary/20 dark:from-primary/20 dark:to-primary/30 border border-primary/30 dark:border-primary/50'
          "
        >
          <div
            class="w-6 h-6 flex items-center justify-center rounded-full flex-shrink-0"
            :class="
              allValidationIssues.some((i) => i.severity === 'error')
                ? 'bg-red-100 dark:bg-red-900/50'
                : 'bg-primary/20 dark:bg-primary/30'
            "
          >
            <AlertTriangle
              class="h-3 w-3"
              :class="
                allValidationIssues.some((i) => i.severity === 'error')
                  ? 'text-red-600 dark:text-red-400'
                  : 'text-primary'
              "
            />
          </div>
          <span
            class="text-xs flex-1"
            :class="
              allValidationIssues.some((i) => i.severity === 'error')
                ? 'text-red-700 dark:text-red-300'
                : 'text-primary/80 dark:text-primary/90'
            "
          >
            {{
              allValidationIssues.some((i) => i.severity === 'error')
                ? 'Export may not work properly due to data issues'
                : `${allValidationIssues.length} warning${allValidationIssues.length !== 1 ? 's' : ''} dismissed`
            }}
          </span>
          <Button
            variant="ghost"
            size="sm"
            @click="handleReviewErrors"
            class="h-6 px-2 text-xs ml-auto"
            :class="
              allValidationIssues.some((i) => i.severity === 'error')
                ? 'text-red-600 hover:bg-red-100 dark:text-red-400 dark:hover:bg-red-900/50'
                : 'text-primary hover:bg-primary/10'
            "
          >
            Review
          </Button>
        </div>

        <!-- Split Export Button -->
        <div class="flex rounded-full overflow-hidden border">
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

    <!-- Column mapping settings dialog -->
    <SettingsDialog
      v-model:open="showColumnMappingSheet"
      v-model:sidebar-collapsed="columnMappingSidebarCollapsed"
      title="Column Mapping"
      description="Map your CSV columns to the correct fields for processing"
      @save="saveColumnMapping"
    >
      <template #preview>
        <div class="border rounded-lg overflow-hidden flex-1">
          <InputDataTable
            :data="store.inputCSV || []"
            :headers="store.inputHeaders"
            :highlight-cells="highlightCells"
            :affected-rows="affectedRows"
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
                @update:model-value="handleHeaderRowToggle"
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
    </SettingsDialog>

    <!-- Export settings dialog -->
    <SettingsDialog
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
            <h3 class="text-sm font-semibold">Output Format</h3>
            <div class="space-y-4">
              <div class="flex items-center justify-between">
                <div class="w-full">
                  <Label for="max-bib">Highest bib number</Label>
                  <p class="text-xs text-muted-foreground">
                    Bib numbers will count down from this number
                  </p>
                </div>
                <Input
                  id="max-bib"
                  type="number"
                  :model-value="store.maxBibNumber"
                  class="w-24"
                  @update:model-value="
                    (value) => store.updateExportSettings({ maxBibNumber: Number(value) })
                  "
                />
              </div>
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
                  <Label for="combine-names">Combine names</Label>
                  <p class="text-xs text-muted-foreground">
                    Use one column for full name instead of separate first/last name columns
                  </p>
                </div>
                <Switch
                  id="combine-names"
                  :model-value="store.combineNames"
                  @update:model-value="
                    (value) => store.updateExportSettings({ combineNames: value })
                  "
                />
              </div>

              <div class="flex items-center justify-between">
                <div>
                  <Label for="include-country">Include country</Label>
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
    </SettingsDialog>
  </div>
</template>

<script setup lang="ts">
import {
  AlertTriangle,
  Check,
  Columns,
  Columns3,
  Columns3Cog,
  Map,
  Settings,
  Share,
  Table,
  Users,
  X,
} from 'lucide-vue-next'
import { computed, onMounted, provide, ref } from 'vue'
import { useRoute, onBeforeRouteLeave } from 'vue-router'
import { useEventListener } from '@vueuse/core'
import { useAppStore } from '@/stores/app'
import CategoryCard from '@/components/CategoryCard.vue'
import InputDataTable from '@/components/InputDataTable.vue'
import OutputDataTable from '@/components/OutputDataTable.vue'
import SettingsDialog from '@/components/SettingsDialog.vue'
import ValidationBanner from '@/components/ValidationBanner.vue'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
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
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { fetchDemoCSV } from '@/lib/input'
import {
  CATEGORY_CODE_NAMES,
  INPUT_COLUMNS,
  type Partition,
  type ValidationIssue,
  createPartitions,
} from '@/lib/input'
import { type ExportSettings, convertToCSV, generateExportData, downloadCSV } from '@/lib/output'
import { startViewTransition } from 'vue-view-transitions'

const store = useAppStore()
const route = useRoute()

const categoryCardRef = ref<(typeof CategoryCard)[]>()
const showColumnMappingSheet = ref(false)
const columnMappingSidebarCollapsed = ref(false)
const showExportSettingsSheet = ref(false)
const validationDismissed = ref(false)
const showDancers = ref(false)

// Demo mode detection
const isDemoMode = computed(() => route.name === 'demo')

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

// Combined validation issues (dataStatus errors + store.inputErrors)
const allValidationIssues = computed((): ValidationIssue[] => {
  const issues: ValidationIssue[] = []

  // Add dataStatus error if exists (column mapping issues)
  if (dataStatus.value.status === 'error') {
    issues.push({
      type: 'missing-headers',
      severity: 'error',
      message: dataStatus.value.label,
    })
  }

  // Add store validation errors
  issues.push(...store.inputErrors)

  return issues
})

// Extract affected rows from validation issues for row-level highlighting
const affectedRows = computed(() => {
  // Add offset for header row if present, since errors are indexed on sliced data
  const rowOffset = store.hasHeaderRow ? 1 : 0
  const rows = new Set<number>()

  store.inputErrors
    .filter((error) => error.cells) // Only issues with cell-level details
    .forEach((error) => {
      error.cells!.forEach((cell) => {
        rows.add(cell.rowIndex + rowOffset)
      })
    })

  return Array.from(rows)
})

// Extract highlight cells from validation issues for table display
const highlightCells = computed(() => {
  // Add offset for header row if present, since errors are indexed on sliced data
  const rowOffset = store.hasHeaderRow ? 1 : 0

  const result = store.inputErrors
    .filter((error) => error.cells) // Only issues with cell-level details
    .flatMap((error) =>
      error.cells!.map((cell) => ({
        rowIndex: cell.rowIndex + rowOffset,
        colIndex: cell.colIndex,
        severity: error.severity,
      })),
    )

  return result
})

// Partitions store - maps category code to age ranges
const partitions = ref<Record<string, Partition[]>>({})

// Provide for CategoryCard components
provide(
  'isPrintingYears',
  computed(() => store.isPrintingYears),
)
provide('showDancers', showDancers)

// Navigation functions
// Auto-load demo data if in demo mode and no data exists
onMounted(async () => {
  if (isDemoMode.value && !store.hasData) {
    try {
      const csvText = await fetchDemoCSV()
      const demoFile = new File([csvText], 'demo.csv', { type: 'text/csv' })
      await store.loadFile(demoFile)
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to load demo data'
      store.fileLoadError = errorMessage
    }
  }
})

// Browser close/refresh warning - automatically cleaned up on component unmount
useEventListener('beforeunload', (event: BeforeUnloadEvent) => {
  if (store.hasData && !isDemoMode.value) {
    // Cancel the event and show browser's native confirmation dialog
    event.preventDefault()
    // Chrome requires returnValue to be set
    event.returnValue = ''
  }
})

// In-app navigation warning
onBeforeRouteLeave((to, from, next) => {
  if (store.hasData && !isDemoMode.value) {
    const confirmed = window.confirm(
      'Are you sure you want to leave this page? All changes will be lost.',
    )
    if (confirmed) {
      next()
    } else {
      next(false)
    }
  } else {
    next()
  }
})

async function toggleDancers() {
  const viewTransition = startViewTransition()
  await viewTransition.captured
  showDancers.value = !showDancers.value
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

function handleReviewErrors() {
  // Open column mapping dialog with sidebar collapsed to focus on the highlighted errors in the table
  columnMappingSidebarCollapsed.value = true
  showColumnMappingSheet.value = true
}

function handleHeaderRowToggle(value: boolean) {
  store.hasHeaderRow = value
  // Force errors to regenerate with correct row offsets
  store.updateColIndexes(store.colIndexes)
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
    combineNames: store.combineNames,
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
