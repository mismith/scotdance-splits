<script setup lang="ts">
import { useLocalStorage } from '@vueuse/core'
import { Delete, TriangleAlert } from 'lucide-vue-next'
import { type AcceptableValue } from 'reka-ui'
import { computed } from 'vue'
import { useAppStore } from '@/stores/app'
import { useViewTransition } from '@/composables/useViewTransition'
import DialogWithSidebar from '@/components/DialogWithSidebar.vue'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { type Partition } from '@/lib/input'
import { type ExportSettings, convertToCSV, downloadCSV, generateExportData } from '@/lib/output'

const props = defineProps<{
  open: boolean
  partitions: Record<string, Partition[]>
}>()
const emit = defineEmits<{ 'update:open': [value: boolean] }>()

const store = useAppStore()
const showSidebar = useLocalStorage('exportShowSidebar', store.isDesktop)

// Generate export preview data
const exportPreviewData = computed(() => {
  if (!store.validatedCSV) return []

  // Extract raw string values for processing
  const rawData = store.validatedCSV.map((row) => row.map((cell) => cell.value))

  const settings: ExportSettings = {
    minBibNumber: store.minBibNumber,
    bibNumberingMode: store.bibNumberingMode,
    bibGroupRanges: store.bibGroupRanges,
    bibCategoryRanges: store.bibCategoryRanges,
    isPrintingYears: store.isPrintingYears,
    includeCountry: store.includeCountry,
    combineNames: store.combineNames,
  }

  const exportData = generateExportData(
    rawData,
    store.colIndexes,
    props.partitions,
    settings,
    store.hasHeaderRow,
    store.synthesisMode ? store.resolvedCodes : undefined,
  )

  // Convert (string | number)[][] to Cell[][] for display
  return exportData.map((row) =>
    row.map((value) => ({ value: String(value), error: false, warning: false })),
  )
})

function isGroupHeaderRow(row: { value: string }[]) {
  return row[0]?.value && row.slice(1).every((cell) => !cell.value)
}

// Active bib ranges and block size for whichever mode is active
const activeRanges = computed(() => {
  if (store.bibNumberingMode === 'per-group') return store.bibGroupRanges
  if (store.bibNumberingMode === 'per-category') return store.bibCategoryRanges
  return []
})

const activeBlockSize = computed(() => {
  if (store.bibNumberingMode === 'per-category') return store.bibCategoryBlockSize
  if (store.bibNumberingMode === 'per-group') return store.bibGroupBlockSize
  return 10
})

const activeBibOverrides = computed(() => {
  if (store.bibNumberingMode === 'per-group') return store.bibGroupRangeOverrides
  if (store.bibNumberingMode === 'per-category') return store.bibCategoryRangeOverrides
  return {}
})

// Map first-dancer row indices to their BibRange for interactive editing
const activeFirstDancerRows = computed(() => {
  const map = new Map<number, (typeof activeRanges.value)[number]>()
  const ranges = activeRanges.value
  if (ranges.length === 0) return map

  if (store.bibNumberingMode === 'per-group') {
    // Per-group: ranges appear in partition order, one per group header
    let rangeIndex = 0
    let expectingFirstDancer = false

    exportPreviewData.value.forEach((row, rowIndex) => {
      if (isGroupHeaderRow(row) && rangeIndex < ranges.length) {
        expectingFirstDancer = true
      } else if (expectingFirstDancer && row.some((cell) => cell.value)) {
        map.set(rowIndex, ranges[rangeIndex])
        rangeIndex++
        expectingFirstDancer = false
      }
    })
  } else if (store.bibNumberingMode === 'per-category') {
    // Per-category: only the first group header per category gets a range
    const rangeMap = new Map(ranges.map((r) => [r.categoryCode, r]))
    const seenCategories = new Set<string>()
    let pendingCategoryCode = ''

    exportPreviewData.value.forEach((row, rowIndex) => {
      if (isGroupHeaderRow(row)) {
        const headerText = row[0]?.value || ''
        const matchingRange = ranges.find((r) => headerText.startsWith(r.label))
        if (matchingRange && !seenCategories.has(matchingRange.categoryCode)) {
          pendingCategoryCode = matchingRange.categoryCode
        }
      } else if (pendingCategoryCode && row.some((cell) => cell.value)) {
        const range = rangeMap.get(pendingCategoryCode)
        if (range) {
          map.set(rowIndex, range)
          seenCategories.add(pendingCategoryCode)
        }
        pendingCategoryCode = ''
      }
    })
  }

  return map
})

function setActiveBibOverride(partitionKey: string, startBib: number) {
  if (store.bibNumberingMode === 'per-group') {
    store.bibGroupRangeOverrides = { ...store.bibGroupRangeOverrides, [partitionKey]: startBib }
  } else if (store.bibNumberingMode === 'per-category') {
    store.bibCategoryRangeOverrides = {
      ...store.bibCategoryRangeOverrides,
      [partitionKey]: startBib,
    }
  }
}

function clearActiveBibOverride(partitionKey: string) {
  if (store.bibNumberingMode === 'per-group') {
    store.bibGroupRangeOverrides = Object.fromEntries(
      Object.entries(store.bibGroupRangeOverrides).filter(([key]) => key !== partitionKey),
    )
  } else if (store.bibNumberingMode === 'per-category') {
    store.bibCategoryRangeOverrides = Object.fromEntries(
      Object.entries(store.bibCategoryRangeOverrides).filter(([key]) => key !== partitionKey),
    )
  }
}

// Export function using shared logic
const { isTransitioning, withViewTransition } = useViewTransition()

function updateBibNumberingMode(value: AcceptableValue) {
  if (value === null) return
  const wasGlobal = store.bibNumberingMode === 'global'
  const willBeGlobal = String(value) === 'global'
  const typedValue = String(value) as 'global' | 'per-category' | 'per-group'
  if (wasGlobal !== willBeGlobal) {
    withViewTransition(() => store.updateExportSettings({ bibNumberingMode: typedValue }))
  } else {
    store.updateExportSettings({ bibNumberingMode: typedValue })
  }
}

function handleExportDownload() {
  // Extract raw values from Cell[][] for CSV conversion
  const rawData = exportPreviewData.value.map((row) => row.map((cell) => cell.value))
  const csvContent = convertToCSV(rawData)
  downloadCSV(csvContent, store.exportFilename)
}
</script>

<template>
  <DialogWithSidebar
    :open="open"
    v-model:show-sidebar="showSidebar"
    title="Export Settings"
    description="A preview of your output CSV. Bib numbers and formatting can be adjusted as needed."
    @update:open="emit('update:open', $event)"
  >
    <!-- Export preview table with merged group header rows -->
    <div class="border rounded-3xl h-full bg-muted/50 overflow-auto">
      <table class="text-xs [border-spacing:0] [border-collapse:separate] w-full">
        <tbody>
          <tr
            v-for="(row, rowIndex) in exportPreviewData"
            :key="rowIndex"
            class="border-b"
            :class="{
              'bg-destructive/10':
                activeFirstDancerRows.has(rowIndex) &&
                store.bibRangeWarnings.has(activeFirstDancerRows.get(rowIndex)!.partitionKey),
            }"
          >
            <template v-if="isGroupHeaderRow(row)">
              <!-- Group header row: name merged across all columns -->
              <td
                :colspan="row.length"
                class="px-2 py-1 align-middle h-8 border-b border-border font-semibold"
              >
                {{ row[0]?.value }}
              </td>
            </template>
            <template v-else>
              <!-- Regular data or separator row -->
              <td
                v-for="(cell, colIndex) in row"
                :key="colIndex"
                class="px-2 py-1 align-middle truncate max-w-xs h-8 border-r border-b border-border"
              >
                <!-- First dancer in group/category: show editable bib input instead of plain number -->
                <template v-if="colIndex === 0 && activeFirstDancerRows.has(rowIndex)">
                  <div class="-my-1 -mx-2">
                    <div class="flex items-center gap-1">
                      <Input
                        type="number"
                        :step="activeBlockSize"
                        :aria-label="`Start bib for ${activeFirstDancerRows.get(rowIndex)!.label}`"
                        :aria-invalid="
                          store.bibRangeWarnings.has(
                            activeFirstDancerRows.get(rowIndex)!.partitionKey,
                          ) || undefined
                        "
                        :model-value="
                          activeFirstDancerRows.get(rowIndex)!.partitionKey in activeBibOverrides
                            ? activeFirstDancerRows.get(rowIndex)!.startBib
                            : undefined
                        "
                        :placeholder="String(activeFirstDancerRows.get(rowIndex)!.startBib)"
                        class="min-w-20 field-sizing-content h-8 px-2 [font-size:inherit]! border-primary! border-2 ring-inset text-xs"
                        :class="{
                          'border-accent!':
                            activeFirstDancerRows.get(rowIndex)!.partitionKey in activeBibOverrides,
                          'border-destructive!': store.bibRangeWarnings.has(
                            activeFirstDancerRows.get(rowIndex)!.partitionKey,
                          ),
                        }"
                        @update:model-value="
                          (value: string | number) => {
                            const key = activeFirstDancerRows.get(rowIndex)!.partitionKey
                            if (value === '' || value === undefined) clearActiveBibOverride(key)
                            else setActiveBibOverride(key, Number(value))
                          }
                        "
                      />
                      <Tooltip
                        v-if="
                          activeFirstDancerRows.get(rowIndex)!.partitionKey in activeBibOverrides
                        "
                      >
                        <TooltipTrigger
                          class="flex items-center gap-1 px-2 py-1 bg-accent/10 rounded-full hover:bg-accent/15 transition-colors"
                          @click="
                            clearActiveBibOverride(
                              activeFirstDancerRows.get(rowIndex)!.partitionKey,
                            )
                          "
                        >
                          <span class="text-xs font-medium text-accent">Manual</span>
                          <Delete class="w-3 h-3 text-accent ml-1" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Reset to auto-calculated</p>
                        </TooltipContent>
                      </Tooltip>
                    </div>
                    <div
                      v-if="
                        store.bibRangeWarnings.has(
                          activeFirstDancerRows.get(rowIndex)!.partitionKey,
                        )
                      "
                      class="flex items-center gap-1 text-destructive px-2 py-0.5"
                    >
                      <TriangleAlert class="size-3 shrink-0" />
                      <span class="truncate">{{
                        store.bibRangeWarnings.get(
                          activeFirstDancerRows.get(rowIndex)!.partitionKey,
                        )
                      }}</span>
                    </div>
                  </div>
                </template>
                <template v-else>
                  {{ cell.value }}
                </template>
              </td>
            </template>
          </tr>
        </tbody>
      </table>
    </div>

    <template #sidebar>
      <div class="space-y-4">
        <!-- Bib numbering settings -->
        <div
          :class="[
            'space-y-3',
            store.bibNumberingMode !== 'global' && 'rounded-xl border p-3',
            isTransitioning &&
              '[view-transition-name:match-element] [view-transition-class:contain]',
          ]"
        >
          <!-- Bib numbering mode -->
          <div class="space-y-2">
            <Label
              for="bib-mode"
              :class="isTransitioning && '[view-transition-name:match-element]'"
            >
              Bib numbering
            </Label>
            <Select
              :model-value="store.bibNumberingMode"
              @update:model-value="updateBibNumberingMode"
            >
              <SelectTrigger
                class="w-full"
                :class="isTransitioning && '[view-transition-name:match-element]'"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="global">Global</SelectItem>
                <SelectItem value="per-category">Per-category</SelectItem>
                <SelectItem value="per-group">Per-group</SelectItem>
              </SelectContent>
            </Select>
            <p
              class="text-xs text-muted-foreground"
              :class="isTransitioning && '[view-transition-name:match-element]'"
            >
              <template v-if="store.bibNumberingMode === 'global'">
                Bibs are numbered across all categories/groups/dancers based on reverse registration
                order.
              </template>
              <template v-else-if="store.bibNumberingMode === 'per-category'">
                Each category gets its own bib range. If needed, edit the start number for each
                category in the preview.
              </template>
              <template v-else>
                Each age group gets its own bib range. If needed, edit the start number for each
                group in the preview.
              </template>
            </p>
          </div>

          <!-- Block size (per-category or per-group) -->
          <div v-if="store.bibNumberingMode !== 'global'" class="flex items-center justify-between">
            <div class="w-full">
              <Label for="block-size">Block size</Label>
              <p class="text-xs text-muted-foreground">Gap between each range's start number</p>
            </div>
            <Input
              id="block-size"
              type="number"
              min="1"
              :model-value="activeBlockSize"
              class="w-24"
              @update:model-value="
                (value: string | number) => {
                  if (store.bibNumberingMode === 'per-category')
                    store.bibCategoryBlockSize = Number(value)
                  else store.bibGroupBlockSize = Number(value)
                }
              "
            />
          </div>
        </div>

        <!-- Lowest bib number (used by all modes) -->
        <div
          class="flex items-center justify-between"
          :class="isTransitioning && '[view-transition-name:match-element]'"
        >
          <div class="w-full">
            <Label for="min-bib">Lowest bib number</Label>
            <p class="text-xs text-muted-foreground">Bib numbers count up from here</p>
          </div>
          <Input
            id="min-bib"
            type="number"
            :step="activeBlockSize"
            :model-value="store.minBibNumber"
            class="w-24"
            @update:model-value="
              (value: string | number) =>
                store.updateExportSettings({ minBibNumber: Number(value) })
            "
          />
        </div>

        <div class="border-t" />

        <!-- Shared format options -->
        <div class="flex items-center justify-between">
          <div>
            <Label for="printing-years">Include "Years" in age group names</Label>
            <p class="text-xs text-muted-foreground">e.g., "Premier 6-8 Years" vs "Premier 6-8"</p>
          </div>
          <Switch
            id="printing-years"
            :model-value="store.isPrintingYears"
            @update:model-value="
              (value: boolean) => store.updateExportSettings({ isPrintingYears: value })
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
              (value: boolean) => store.updateExportSettings({ combineNames: value })
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
              (value: boolean) => store.updateExportSettings({ includeCountry: value })
            "
          />
        </div>
      </div>
    </template>

    <template #submit="{ close }">
      <div class="flex items-center gap-2 w-full sm:w-auto">
        <Button
          class="flex-1 sm:flex-initial"
          @click="
            () => {
              handleExportDownload()
              close()
            }
          "
        >
          Export
        </Button>
        <Tooltip v-if="store.bibRangeWarnings.size">
          <TooltipTrigger as-child>
            <TriangleAlert class="size-4 text-destructive" />
          </TooltipTrigger>
          <TooltipContent>
            <p>
              {{ store.bibRangeWarnings.size }} bib range overlap{{
                store.bibRangeWarnings.size > 1 ? 's' : ''
              }}
            </p>
          </TooltipContent>
        </Tooltip>
      </div>
    </template>
  </DialogWithSidebar>
</template>
