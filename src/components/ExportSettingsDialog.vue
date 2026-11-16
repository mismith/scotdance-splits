<script setup lang="ts">
import { ArrowUpRight, Delete, LoaderCircle, TriangleAlert } from '@lucide/vue'
import { useLocalStorage } from '@vueuse/core'
import { type AcceptableValue } from 'reka-ui'
import { computed, ref } from 'vue'
import { useAppStore } from '@/stores/app'
import { useViewTransition } from '@/composables/useViewTransition'
import DialogWithSidebar from '@/components/DialogWithSidebar.vue'
import ScotDanceMark from '@/components/ScotDanceMark.vue'
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
import { sendToScotDance } from '@/lib/scotdance'

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
    minNumber: store.minNumber,
    numberingMode: store.numberingMode,
    groupNumberRanges: store.groupNumberRanges,
    categoryNumberRanges: store.categoryNumberRanges,
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

// Active number ranges and block size for whichever mode is active
const activeRanges = computed(() => {
  if (store.numberingMode === 'per-group') return store.groupNumberRanges
  if (store.numberingMode === 'per-category') return store.categoryNumberRanges
  return []
})

const activeBlockSize = computed(() => {
  if (store.numberingMode === 'per-category') return store.categoryNumberBlockSize
  if (store.numberingMode === 'per-group') return store.groupNumberBlockSize
  return 10
})

const activeNumberOverrides = computed(() => {
  if (store.numberingMode === 'per-group') return store.groupNumberRangeOverrides
  if (store.numberingMode === 'per-category') return store.categoryNumberRangeOverrides
  return {}
})

// Map first-dancer row indices to their NumberRange for interactive editing
const activeFirstDancerRows = computed(() => {
  const map = new Map<number, (typeof activeRanges.value)[number]>()
  const ranges = activeRanges.value
  if (ranges.length === 0) return map

  if (store.numberingMode === 'per-group') {
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
  } else if (store.numberingMode === 'per-category') {
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

function setActiveNumberOverride(partitionKey: string, startNumber: number) {
  if (store.numberingMode === 'per-group') {
    store.groupNumberRangeOverrides = {
      ...store.groupNumberRangeOverrides,
      [partitionKey]: startNumber,
    }
  } else if (store.numberingMode === 'per-category') {
    store.categoryNumberRangeOverrides = {
      ...store.categoryNumberRangeOverrides,
      [partitionKey]: startNumber,
    }
  }
}

function clearActiveNumberOverride(partitionKey: string) {
  if (store.numberingMode === 'per-group') {
    store.groupNumberRangeOverrides = Object.fromEntries(
      Object.entries(store.groupNumberRangeOverrides).filter(([key]) => key !== partitionKey),
    )
  } else if (store.numberingMode === 'per-category') {
    store.categoryNumberRangeOverrides = Object.fromEntries(
      Object.entries(store.categoryNumberRangeOverrides).filter(([key]) => key !== partitionKey),
    )
  }
}

// Export function using shared logic
const { isTransitioning, withViewTransition } = useViewTransition()

function updateNumberingMode(value: AcceptableValue) {
  if (value === null) return
  const wasGlobal = store.numberingMode === 'global'
  const willBeGlobal = String(value) === 'global'
  const typedValue = String(value) as 'global' | 'per-category' | 'per-group'
  if (wasGlobal !== willBeGlobal) {
    withViewTransition(() => store.updateExportSettings({ numberingMode: typedValue }))
  } else {
    store.updateExportSettings({ numberingMode: typedValue })
  }
}

// The CSV Download saves, and Send to ScotDance.app sends
function exportCSV() {
  // Extract raw values from Cell[][] for CSV conversion
  const rawData = exportPreviewData.value.map((row) => row.map((cell) => cell.value))
  return convertToCSV(rawData)
}

function handleExportDownload() {
  downloadCSV(exportCSV(), store.exportFilename)
}

// Send: ScotDance.app's own sheet opens over Splits and says where it went (lib/scotdance.ts)
const sending = ref(false)
const sendPending = ref(false)
const sendNote = ref<{ text: string; url?: string; error?: boolean } | null>(null)
async function handleSend() {
  if (sendPending.value) return
  sendPending.value = true
  sending.value = true
  sendNote.value = null
  try {
    const result = await sendToScotDance(
      {
        name: inputFilename.value,
        text: exportCSV(),
        ...(store.entriesSource ? { competitionId: store.entriesSource.competitionId } : {}),
      },
      { onOpen: () => (sending.value = false) },
    )
    if (result.sent)
      sendNote.value = { text: `Sent to ${result.competitionName}.`, url: result.url }
  } catch {
    sendNote.value = {
      text: 'Couldn’t reach ScotDance.app. Check your connection and try again.',
      error: true,
    }
  } finally {
    sendPending.value = false
    sending.value = false
  }
}
const inputFilename = computed(() => store.inputFiles?.[0]?.name || `${store.exportFilename}.csv`)
</script>

<template>
  <DialogWithSidebar
    :open="open"
    v-model:show-sidebar="showSidebar"
    title="Export Settings"
    description="A preview of your output CSV. Adjust numbers and formatting as needed."
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
                store.numberRangeWarnings.has(activeFirstDancerRows.get(rowIndex)!.partitionKey),
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
                <!-- First dancer in group/category: show editable number input instead of plain number -->
                <template v-if="colIndex === 0 && activeFirstDancerRows.has(rowIndex)">
                  <div class="-my-1 -mx-2">
                    <div class="flex items-center gap-1">
                      <Input
                        type="number"
                        :step="activeBlockSize"
                        :aria-label="`Starting number for ${activeFirstDancerRows.get(rowIndex)!.label}`"
                        :aria-invalid="
                          store.numberRangeWarnings.has(
                            activeFirstDancerRows.get(rowIndex)!.partitionKey,
                          ) || undefined
                        "
                        :model-value="
                          activeFirstDancerRows.get(rowIndex)!.partitionKey in activeNumberOverrides
                            ? activeFirstDancerRows.get(rowIndex)!.startNumber
                            : undefined
                        "
                        :placeholder="String(activeFirstDancerRows.get(rowIndex)!.startNumber)"
                        class="min-w-20 field-sizing-content h-8 px-2 [font-size:inherit]! border-primary! border-2 ring-inset text-xs"
                        :class="{
                          'border-accent!':
                            activeFirstDancerRows.get(rowIndex)!.partitionKey in
                            activeNumberOverrides,
                          'border-destructive!': store.numberRangeWarnings.has(
                            activeFirstDancerRows.get(rowIndex)!.partitionKey,
                          ),
                        }"
                        @update:model-value="
                          (value: string | number) => {
                            const key = activeFirstDancerRows.get(rowIndex)!.partitionKey
                            if (value === '' || value === undefined) clearActiveNumberOverride(key)
                            else setActiveNumberOverride(key, Number(value))
                          }
                        "
                      />
                      <Tooltip
                        v-if="
                          activeFirstDancerRows.get(rowIndex)!.partitionKey in activeNumberOverrides
                        "
                      >
                        <TooltipTrigger
                          class="flex items-center gap-1 px-2 py-1 bg-accent/10 rounded-full hover:bg-accent/15 transition-colors"
                          @click="
                            clearActiveNumberOverride(
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
                        store.numberRangeWarnings.has(
                          activeFirstDancerRows.get(rowIndex)!.partitionKey,
                        )
                      "
                      class="flex items-center gap-1 text-destructive px-2 py-0.5"
                    >
                      <TriangleAlert class="size-3 shrink-0" />
                      <span class="truncate">{{
                        store.numberRangeWarnings.get(
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
        <!-- Numbering settings -->
        <div
          :class="[
            'space-y-3',
            store.numberingMode !== 'global' && 'rounded-xl border p-3',
            isTransitioning &&
              '[view-transition-name:match-element] [view-transition-class:contain]',
          ]"
        >
          <!-- Numbering mode -->
          <div class="space-y-2">
            <Label
              for="number-mode"
              :class="isTransitioning && '[view-transition-name:match-element]'"
            >
              Numbering
            </Label>
            <Select :model-value="store.numberingMode" @update:model-value="updateNumberingMode">
              <SelectTrigger
                class="w-full"
                :class="isTransitioning && '[view-transition-name:match-element]'"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="global">All dancers</SelectItem>
                <SelectItem value="per-category">By category</SelectItem>
                <SelectItem value="per-group">By age group</SelectItem>
              </SelectContent>
            </Select>
            <p
              class="text-xs text-muted-foreground"
              :class="isTransitioning && '[view-transition-name:match-element]'"
            >
              <template v-if="store.numberingMode === 'global'">
                Numbers are assigned across all dancers in reverse registration order.
              </template>
              <template v-else-if="store.numberingMode === 'per-category'">
                Each category gets its own number range. If needed, edit the start number for each
                category in the preview.
              </template>
              <template v-else>
                Each age group gets its own number range. If needed, edit the start number for each
                group in the preview.
              </template>
            </p>
          </div>

          <!-- Block size (per-category or per-group) -->
          <div v-if="store.numberingMode !== 'global'" class="flex items-center justify-between">
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
                  if (store.numberingMode === 'per-category')
                    store.categoryNumberBlockSize = Number(value)
                  else store.groupNumberBlockSize = Number(value)
                }
              "
            />
          </div>
        </div>

        <!-- Starting number (used by all modes) -->
        <div
          class="flex items-center justify-between"
          :class="isTransitioning && '[view-transition-name:match-element]'"
        >
          <div class="w-full">
            <Label for="min-number">Starting number</Label>
            <p class="text-xs text-muted-foreground">Numbers count up from here</p>
          </div>
          <Input
            id="min-number"
            type="number"
            :step="activeBlockSize"
            :model-value="store.minNumber"
            class="w-24"
            @update:model-value="
              (value: string | number) => store.updateExportSettings({ minNumber: Number(value) })
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
      <div class="flex flex-col sm:flex-row sm:items-center gap-2 w-full sm:w-auto">
        <p
          v-if="sendNote"
          :role="sendNote.error ? 'alert' : 'status'"
          :class="[
            'text-xs text-center sm:text-right',
            sendNote.error ? 'text-destructive' : 'text-muted-foreground',
          ]"
        >
          {{ sendNote.text }}
          <a
            v-if="sendNote.url"
            :href="sendNote.url"
            target="_blank"
            rel="noopener"
            class="ml-1 inline-flex items-center gap-0.5 font-semibold text-[#1a6fd0] hover:underline"
          >
            Open it
            <ArrowUpRight class="size-3.5" aria-hidden="true" />
          </a>
        </p>
        <!-- on a phone Send takes the whole first row, Download the next -->
        <div class="flex flex-wrap items-center gap-2">
          <!-- ScotDance.app's own button, as on every tool: Scott in the round left end, the words
               centred in the rest (14px after him when the button is only as wide as its words) -->
          <button
            type="button"
            class="inline-flex items-center justify-center rounded-full relative w-full sm:w-auto h-13 border-0 pl-13 sm:pl-14 pr-[26px] text-base font-bold bg-[#1a6fd0] text-white hover:bg-[#1a6fd0]/90"
            :disabled="sendPending"
            :aria-busy="sendPending || undefined"
            @click="handleSend"
          >
            <span class="absolute top-2.5 left-2.5 size-8" aria-hidden="true">
              <LoaderCircle
                v-if="sendPending"
                class="size-8 p-1 animate-spin motion-reduce:animate-none"
              />
              <ScotDanceMark v-else class="size-8" />
            </span>
            Send to ScotDance.app
          </button>
          <Button
            class="flex-1 sm:flex-initial h-13 px-6 text-base"
            @click="
              () => {
                handleExportDownload()
                close()
              }
            "
          >
            Download
          </Button>
          <Tooltip v-if="store.numberRangeWarnings.size">
            <TooltipTrigger as-child>
              <TriangleAlert class="size-4 text-destructive" />
            </TooltipTrigger>
            <TooltipContent>
              <p>
                {{ store.numberRangeWarnings.size }} number range overlap{{
                  store.numberRangeWarnings.size > 1 ? 's' : ''
                }}
              </p>
            </TooltipContent>
          </Tooltip>
        </div>
      </div>
    </template>
  </DialogWithSidebar>
</template>
