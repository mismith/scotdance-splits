<script setup lang="ts">
import { useEventListener, useLocalStorage } from '@vueuse/core'
import { AlertTriangle, Table, TableProperties, Users } from 'lucide-vue-next'
import { computed, nextTick, onMounted, provide, ref } from 'vue'
import { onBeforeRouteLeave, useRoute } from 'vue-router'
import { startViewTransition } from 'vue-view-transitions'
import { useAppStore } from '@/stores/app'
import CategoryCard from '@/components/CategoryCard.vue'
import CellTable from '@/components/CellTable.vue'
import DialogWithSidebar from '@/components/DialogWithSidebar.vue'
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
import { fetchDemoCSV } from '@/lib/input'
import { CATEGORY_CODE_NAMES, INPUT_COLUMNS, type Partition, createPartitions } from '@/lib/input'
import { type ExportSettings, convertToCSV, downloadCSV, generateExportData } from '@/lib/output'

const store = useAppStore()
const route = useRoute()

const showColumnMappingSheet = ref(false)
const columnMappingShowSidebar = useLocalStorage(
  'scotdance.splits.columnMappingDialog.showSidebar',
  true,
)
const showExportSettingsSheet = ref(false)
const exportShowSidebar = useLocalStorage(
  'scotdance.splits.exportDialog.showSidebar',
  store.isDesktop,
)
const validationDismissed = ref(false)
const showDancers = ref(false)
const categoryCardRef = ref()

// Demo mode detection
const isDemoMode = computed(() => route.name === 'demo')

// Validation issues from store (now includes all validation: headers, column mapping, codes)
const allValidationIssues = computed(() => store.inputErrors)
const hasErrors = computed(() => allValidationIssues.value.some((i) => i.severity === 'error'))
const hasDismissedIssues = computed(
  () => allValidationIssues.value.length > 0 && validationDismissed.value,
)

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
  await nextTick()

  const viewTransition = startViewTransition()
  await viewTransition.captured
  showDancers.value = !showDancers.value

  await viewTransition.finished
  categoryCardRef.value?.forEach((card: InstanceType<typeof CategoryCard>) => card.repaint())
}

async function dismissValidationErrors() {
  const viewTransition = startViewTransition()
  await viewTransition.captured
  validationDismissed.value = true
}

function handleReviewErrors() {
  showColumnMappingSheet.value = true
  validationDismissed.value = true
}

function handleHeaderRowToggle(value: boolean) {
  store.hasHeaderRow = value
  // Force errors to regenerate with correct row offsets
  store.updateColIndexes(store.colIndexes)
}

function updateColIndex(id: string, value: string | null) {
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
  if (!store.validatedCSV) return []

  // Extract raw string values for processing
  const rawData = store.validatedCSV.map((row) => row.map((cell) => cell.value))

  const settings: ExportSettings = {
    maxBibNumber: store.maxBibNumber,
    isPrintingYears: store.isPrintingYears,
    includeCountry: store.includeCountry,
    combineNames: store.combineNames,
  }

  const exportData = generateExportData(
    rawData,
    store.colIndexes,
    partitions.value,
    settings,
    store.hasHeaderRow,
  )

  // Convert (string | number)[][] to Cell[][] for display
  return exportData.map((row) =>
    row.map((value) => ({ value: String(value), error: false, warning: false })),
  )
})

// Export function using shared logic
function handleExportDownload() {
  // Extract raw values from Cell[][] for CSV conversion
  const rawData = exportPreviewData.value.map((row) => row.map((cell) => cell.value))
  const csvContent = convertToCSV(rawData)
  downloadCSV(csvContent, 'splits-export')
}
</script>

<template>
  <div class="flex flex-col min-h-screen">
    <!-- Fixed Toolbar -->
    <header
      class="fixed top-0 left-0 right-0 z-50 grid grid-cols-[1fr_auto_1fr] items-center px-4 h-16 bg-gradient-to-b from-background to-transparent pointer-events-none *:pointer-events-auto"
    >
      <!-- Left side -->
      <div class="flex items-center gap-1 justify-self-start">
        <Button
          :variant="hasDismissedIssues ? undefined : 'outline'"
          :class="[
            hasDismissedIssues
              ? hasErrors
                ? 'bg-red-600 hover:bg-red-700 text-white backdrop-blur-lg'
                : 'bg-primary/15 hover:bg-primary/25 text-primary border border-primary/30 backdrop-blur-lg'
              : '',
            hasDismissedIssues && '[view-transition-name:validation-issues]',
          ]"
          @click="hasDismissedIssues ? handleReviewErrors() : (showColumnMappingSheet = true)"
        >
          <AlertTriangle v-if="hasDismissedIssues" class="size-4" />
          <TableProperties v-else class="h-4 w-4" />
          <template v-if="hasDismissedIssues">
            {{ allValidationIssues.length }} issue{{ allValidationIssues.length !== 1 ? 's' : '' }}
          </template>
          <template v-else>Fields</template>
        </Button>
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
                :class="'[view-transition-name:splits-logo]'"
              />
              <span
                class="text-sm font-semibold text-primary"
                :class="'[view-transition-name:splits-name]'"
              >
                Splits
              </span>
            </div>
          </router-link>
        </Button>
        <Badge
          v-if="isDemoMode"
          variant="accent"
          class="text-xs -mt-1 -mb-5 bg-accent backdrop-blur-md"
        >
          Demo
        </Badge>
      </div>

      <!-- Right side -->
      <div class="hidden md:flex items-center gap-1 justify-self-end">
        <Button :variant="showDancers ? 'default' : 'outline'" @click="toggleDancers">
          <Users class="h-4 w-4" />
          Dancers
        </Button>
      </div>
    </header>

    <!-- Main content with top padding to account for fixed header -->
    <main class="pt-16 pb-16 flex-auto">
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

      <div v-else class="px-3 py-4 md:px-4 space-y-4">
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

    <!-- Validation Banner (floats independently) -->
    <div
      v-if="!validationDismissed && allValidationIssues.length > 0"
      class="fixed bottom-0 left-0 right-0 z-50 px-2 pb-2 md:pb-8 pointer-events-none"
    >
      <ValidationBanner
        :issues="allValidationIssues"
        class="[view-transition-name:validation-issues]"
        @review="handleReviewErrors"
        @dismiss="dismissValidationErrors"
      />
    </div>

    <!-- Fixed Footer (always visible when data loaded, buttons fade in) -->
    <footer
      v-if="store.hasData"
      class="fixed bottom-0 left-0 right-0 z-40 grid grid-cols-[1fr_auto_1fr] items-center px-4 h-16 bg-gradient-to-t from-background to-transparent pointer-events-none *:pointer-events-auto"
    >
      <div />
      <div />

      <!-- Right: Export -->
      <div class="justify-self-end">
        <Button size="lg" class="backdrop-blur-lg" @click="showExportSettingsSheet = true">
          Next &rarr;
        </Button>
      </div>
    </footer>

    <!-- Column mapping settings dialog -->
    <DialogWithSidebar
      v-model:open="showColumnMappingSheet"
      v-model:show-sidebar="columnMappingShowSidebar"
      title="Fields"
      description="Map your CSV columns to the correct fields"
    >
      <CellTable
        :data="store.hasHeaderRow ? (store.validatedCSV || []).slice(1) : store.validatedCSV || []"
        :headers="store.hasHeaderRow ? store.inputHeaders : undefined"
        wrapper-class="border rounded-3xl h-full bg-muted/50"
      />

      <template #sidebar>
        <div class="space-y-4">
          <div class="space-y-2">
            <Label for="header-row">Header row</Label>
            <label
              class="border-input data-[placeholder]:text-muted-foreground [&_svg:not([class*='text-'])]:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive dark:bg-input/30 dark:hover:bg-input/50 flex w-full items-center justify-between gap-2 rounded-md border bg-transparent px-3 py-2 text-sm whitespace-nowrap shadow-xs transition-[color,box-shadow] outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50 data-[size=default]:h-9 data-[size=sm]:h-8 *:data-[slot=select-value]:line-clamp-1 *:data-[slot=select-value]:flex *:data-[slot=select-value]:items-center *:data-[slot=select-value]:gap-2 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4"
            >
              <span>First row is headers</span>
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
              @update:model-value="updateColIndex(id, String($event))"
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

      <template #submit="{ close }">
        <Button @click="close()">Done</Button>
      </template>
    </DialogWithSidebar>

    <!-- Export settings dialog -->
    <DialogWithSidebar
      v-model:open="showExportSettingsSheet"
      v-model:show-sidebar="exportShowSidebar"
      title="Export Settings"
      description="Configure bib numbers and output format options"
    >
      <CellTable
        :data="exportPreviewData"
        :show-headers="false"
        :show-row-headers="false"
        wrapper-class="border rounded-3xl h-full bg-muted/50"
      />

      <template #sidebar>
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
              @update:model-value="(value) => store.updateExportSettings({ combineNames: value })"
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
              @update:model-value="(value) => store.updateExportSettings({ includeCountry: value })"
            />
          </div>
        </div>
      </template>

      <template #submit="{ close }">
        <Button
          @click="
            () => {
              handleExportDownload()
              close()
            }
          "
          >Export</Button
        >
      </template>
    </DialogWithSidebar>
  </div>
</template>
