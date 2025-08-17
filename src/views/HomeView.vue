<template>
  <FileUpload
    :is-loading="store.isLoadingInputFile"
    :error="store.inputError"
    @file-selected="handleFileSelected"
    @error-dismiss="handleErrorDismiss"
  >
    <template #default="{ chooseFile }">
      <div class="flex flex-col">
        <!-- Header - Center-aligned logo -->
        <header class="py-16 text-center relative">
          <!-- Dark mode toggle -->
          <div class="absolute top-8 right-8">
            <DarkModeToggle />
          </div>

          <a
            href="/"
            class="will-change-transform flex items-center justify-center gap-4 text-4xl font-semibold text-primary hover:text-primary/80 transition-colors"
          >
            <img
              src="/touchicon.png"
              alt="Splits Logo"
              class="size-12"
              v-view-transition-name="'splits-logo'"
            />
            <span v-view-transition-name="'splits-name'">Splits</span>
          </a>
          <p class="text-lg text-muted-foreground mt-4">
            Automatically split dancer registrations into balanced age groups with bib numbers
          </p>
        </header>

        <!-- Main content -->
        <main ref="containerRef" class="flex-1 max-w-6xl mx-auto px-6 relative">
          <!-- Dynamic curvy lines -->
          <svg
            ref="topSvgRef"
            class="absolute inset-0 w-full h-full pointer-events-none"
            style="overflow: visible; z-index: 5"
          ></svg>
          <svg
            ref="bottomSvgRef"
            class="absolute inset-0 w-full h-full pointer-events-none"
            style="overflow: visible; z-index: 5"
          ></svg>

          <!-- Input sources -->
          <section class="mb-20">
            <div class="flex justify-center items-center gap-16">
              <div
                :ref="(el) => setInputSourceRef(el as HTMLElement, 0)"
                class="flex flex-col items-center gap-2"
              >
                <div
                  class="w-20 h-20 rounded-xl bg-white flex items-center justify-center overflow-hidden p-3"
                >
                  <img src="/src/assets/eventry-icon.png" alt="Eventry" class="size-full invert" />
                </div>
                <span class="font-semibold text-foreground text-center">Eventry</span>
              </div>
              <div
                :ref="(el) => setInputSourceRef(el as HTMLElement, 1)"
                class="flex flex-col items-center gap-2"
              >
                <div
                  class="w-20 h-20 rounded-xl bg-white flex items-center justify-center overflow-hidden"
                >
                  <img
                    src="/src/assets/hdc-icon.png"
                    alt="HDComps"
                    class="w-full h-full object-contain"
                  />
                </div>
                <span class="font-semibold text-foreground text-center">HD Comps</span>
              </div>
              <div
                :ref="(el) => setInputSourceRef(el as HTMLElement, 2)"
                class="flex flex-col items-center gap-2"
              >
                <div
                  class="w-20 h-20 rounded-xl bg-white flex items-center justify-center overflow-hidden"
                >
                  <TextCursorInput class="h-10 w-10 text-gray-600" />
                </div>
                <span class="font-semibold text-foreground text-center">Others</span>
              </div>
            </div>
          </section>

          <!-- Tables comparison -->
          <section class="mb-20 relative">
            <div class="grid lg:grid-cols-2 gap-16 relative z-10">
              <!-- Before: Input table -->
              <div ref="leftTableRef" class="space-y-0">
                <div class="bg-muted/20 border border-border rounded-xl p-4 shadow-sm">
                  <div class="mb-4">
                    <h4 class="text-xl font-semibold text-muted-foreground">From:</h4>
                    <p class="text-sm text-muted-foreground">
                      Raw registration data containing dancer info
                    </p>
                  </div>
                  <div class="h-80 w-full rounded-lg overflow-hidden border border-border/50">
                    <InputDataTable :data="mockInputDataRows" :headers="mockInputHeaders" :height="320" />
                  </div>
                  <div class="grid grid-cols-2 gap-4 mt-6 text-sm">
                    <div class="space-y-2">
                      <div class="flex items-center gap-2 text-muted-foreground">
                        <X class="h-4 w-4 text-destructive shrink-0" />
                        <span>Manual grouping logic</span>
                      </div>
                      <div class="flex items-center gap-2 text-muted-foreground">
                        <X class="h-4 w-4 text-destructive shrink-0" />
                        <span>Manual dancer ordering</span>
                      </div>
                    </div>
                    <div class="space-y-2">
                      <div class="flex items-center gap-2 text-muted-foreground">
                        <X class="h-4 w-4 text-destructive shrink-0" />
                        <span>Time-consuming endeavour</span>
                      </div>
                      <div class="flex items-center gap-2 text-muted-foreground">
                        <X class="h-4 w-4 text-destructive shrink-0" />
                        <span>Error-prone process</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <!-- After: Output table -->
              <div ref="rightTableRef" class="space-y-0">
                <div class="bg-primary/5 border border-primary/20 rounded-xl p-4 shadow-sm">
                  <div class="mb-4">
                    <h4 class="text-xl font-semibold text-primary">To:</h4>
                    <p class="text-sm text-primary/80">Groups balanced and bib numbers assigned</p>
                  </div>
                  <div class="h-80 w-full rounded-lg overflow-hidden border border-primary/20">
                    <OutputDataTable :data="realOutputData" :height="320" />
                  </div>
                  <div class="grid grid-cols-2 gap-4 mt-6 text-sm">
                    <div class="space-y-2">
                      <div class="flex items-center gap-2 text-primary">
                        <Check class="h-4 w-4 shrink-0" />
                        <span>Age groups optimized for similar number of dancers</span>
                      </div>
                      <div class="flex items-center gap-2 text-primary">
                        <Check class="h-4 w-4 shrink-0" />
                        <span>Bib numbers based on reverse registration order</span>
                      </div>
                    </div>
                    <div class="space-y-2">
                      <div class="flex items-center gap-2 text-primary">
                        <Check class="h-4 w-4 shrink-0" />
                        <span>Instant results with simple customizations</span>
                      </div>
                      <div class="flex items-center gap-2 text-primary">
                        <Check class="h-4 w-4 shrink-0" />
                        <span>Ready to import into ScotDance.app</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <!-- Output sources -->
          <section class="mb-20">
            <div class="flex justify-center items-center gap-16">
              <div
                :ref="(el) => setOutputSourceRef(el as HTMLElement, 0)"
                class="flex flex-col items-center gap-2"
              >
                <div
                  class="w-20 h-20 rounded-xl bg-white flex items-center justify-center overflow-hidden"
                >
                  <img
                    src="/src/assets/scotdance-icon.png"
                    alt="ScotDance"
                    class="w-full h-full object-contain"
                  />
                </div>
                <div class="text-center font-semibold text-foreground">ScotDance.app</div>
              </div>
              <div
                :ref="(el) => setOutputSourceRef(el as HTMLElement, 1)"
                class="flex flex-col items-center gap-2"
              >
                <div
                  class="w-20 h-20 p-3 rounded-xl bg-white flex items-center justify-center overflow-hidden"
                >
                  <img
                    src="/src/assets/sheets-icon.png"
                    alt="Google Sheets"
                    class="w-full h-full object-contain"
                  />
                </div>
                <div class="text-center font-semibold text-foreground">Google Sheets</div>
              </div>
              <div
                :ref="(el) => setOutputSourceRef(el as HTMLElement, 2)"
                class="flex flex-col items-center gap-2"
              >
                <div
                  class="w-20 h-20 p-3 rounded-xl bg-white flex items-center justify-center overflow-hidden"
                >
                  <img
                    src="/src/assets/excel-icon.png"
                    alt="Excel"
                    class="w-full h-full object-contain"
                  />
                </div>
                <div class="text-center font-semibold text-foreground">Microsoft Excel</div>
              </div>
            </div>
          </section>
        </main>

        <!-- Sticky floating CTA -->
        <div class="sticky bottom-0 z-40 mt-12 pb-8" v-view-transition-name="'FloatingFooter'">
          <div
            class="bg-card/95 backdrop-blur-lg border border-border/50 shadow-2xl rounded-2xl p-8 max-w-lg mx-auto"
          >
            <div class="text-center mb-6">
              <p class="text-muted-foreground mb-2">Ready to organize your competition?</p>
              <p class="text-sm text-muted-foreground">Drag & drop your CSV file anywhere or</p>
            </div>
            <Button
              size="lg"
              :disabled="store.isLoadingInputFile"
              @click="chooseFile"
              class="w-full h-12 text-base font-semibold shadow-lg hover:shadow-xl transition-shadow"
            >
              <span v-if="store.isLoadingInputFile" class="flex items-center gap-2">
                <div
                  class="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin"
                ></div>
                Processing...
              </span>
              <span v-else>Choose CSV File</span>
            </Button>
          </div>
        </div>
      </div>
    </template>
  </FileUpload>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, nextTick } from 'vue'
import { parse } from 'papaparse'
import { useAppStore } from '@/stores/app'
import { Button } from '@/components/ui/button'
import DarkModeToggle from '@/components/DarkModeToggle.vue'
import FileUpload from '@/components/FileUpload.vue'
import InputDataTable from '@/components/InputDataTable.vue'
import OutputDataTable from '@/components/OutputDataTable.vue'
import { X, Check, TextCursorInput } from 'lucide-vue-next'
import {
  INPUT_COLUMNS,
  detectColumnMapping,
  categorizeData,
  autoPartitionCategories,
  processCSVData,
  createPartitions,
} from '@/lib/input'
import {
  generateExportData,
  calculateDefaultMaxBib,
  type ExportSettings,
} from '@/lib/output'

// Dynamic mock data loaded from CSV
const mockInputData = ref<string[][]>([])
const mockInputHeaders = ref<string[]>([])
const isLoadingMockData = ref(true)

// Load mock data from CSV file
async function loadMockData() {
  try {
    const response = await fetch('/mock-data.csv')
    const csvText = await response.text()
    
    const results = await new Promise<{ data: string[][] }>((resolve, reject) => {
      parse(csvText, {
        worker: true,
        complete: resolve,
        error: reject,
      })
    })

    const csvData = results.data as string[][]
    if (csvData && csvData.length > 0) {
      mockInputHeaders.value = csvData[0]
      mockInputData.value = csvData // Keep full CSV data for processCSVData
    }
  } catch (error) {
    console.error('Failed to load mock data:', error)
  } finally {
    isLoadingMockData.value = false
  }
}

// Extract just the data rows for table display (without headers)
const mockInputDataRows = computed(() => {
  if (mockInputData.value.length <= 1) return []
  return mockInputData.value.slice(1) // Skip header row for display
})

// Load mock data on component mount
onMounted(async () => {
  await loadMockData()
  await nextTick()
  // Give DOM elements more time to render
  setTimeout(() => {
    isActive = true
    // Start the curve animation
    rafId = requestAnimationFrame(updateCurvesDirectly)
  }, 200)
})

// Process mock data using shared transformation logic
const mockProcessedData = computed(() => {
  if (isLoadingMockData.value || mockInputData.value.length === 0) {
    return null
  }
  try {
    return processCSVData(mockInputData.value)
  } catch (error) {
    console.error('Failed to process mock data:', error)
    return null
  }
})

const mockPartitions = computed(() => {
  if (!mockProcessedData.value) return {}
  return createPartitions(
    mockProcessedData.value.categories,
    mockProcessedData.value.partitionedCategories
  )
})

// Generate actual output data using shared export logic
const realOutputData = computed(() => {
  if (!mockProcessedData.value || mockInputData.value.length === 0) {
    return []
  }

  // Calculate default max bib using shared logic
  const defaultMaxBib = calculateDefaultMaxBib(
    mockInputData.value,
    mockProcessedData.value.colIndexes,
    mockProcessedData.value.hasHeaderRow
  )

  const settings: ExportSettings = {
    maxBibNumber: defaultMaxBib,
    isPrintingYears: true,
    includeCountry: false,
  }

  return generateExportData(
    mockInputData.value,
    mockProcessedData.value.colIndexes,
    mockPartitions.value,
    settings,
    mockProcessedData.value.hasHeaderRow
  )
})


const store = useAppStore()

// Refs for dynamic curvy lines
const containerRef = ref<HTMLElement>()
const inputSourcesRef = ref<HTMLElement[]>([])
const leftTableRef = ref<HTMLElement>()
const rightTableRef = ref<HTMLElement>()
const outputSourcesRef = ref<HTMLElement[]>([])
const topSvgRef = ref<SVGElement>()
const bottomSvgRef = ref<SVGElement>()

// Functions to set refs for arrays
function setInputSourceRef(el: HTMLElement | null, index: number) {
  if (el) {
    inputSourcesRef.value[index] = el
  }
}

function setOutputSourceRef(el: HTMLElement | null, index: number) {
  if (el) {
    outputSourcesRef.value[index] = el
  }
}

// Dynamic curvy line system
let rafId: number | null = null
let isActive = false

function getInputCurvePath(inputIndex: number) {
  if (!containerRef.value || !inputSourcesRef.value[inputIndex] || !leftTableRef.value) {
    return ''
  }

  const container = containerRef.value.getBoundingClientRect()
  const input = inputSourcesRef.value[inputIndex].getBoundingClientRect()
  const leftTable = leftTableRef.value.getBoundingClientRect()

  // Calculate relative positions - connect to card edges with 8px offset
  const startX = input.left - container.left + input.width / 2
  const startY = input.bottom - container.top + 8 // 8px below input icon
  const endX = leftTable.left - container.left + leftTable.width / 2
  const endY = leftTable.top - container.top - 8 // 8px above table card

  // Create Z-shaped curve with Bézier handles at 50% height
  const midY = (startY + endY) / 2 // 50% height between start and end

  // Control points at 50% height for clean Z-shape
  return `M ${startX} ${startY} C ${startX} ${midY}, ${endX} ${midY}, ${endX} ${endY}`
}

function getOutputCurvePath(outputIndex: number) {
  if (!containerRef.value || !outputSourcesRef.value[outputIndex] || !rightTableRef.value) return ''

  const container = containerRef.value.getBoundingClientRect()
  const output = outputSourcesRef.value[outputIndex].getBoundingClientRect()
  const rightTable = rightTableRef.value.getBoundingClientRect()

  // Calculate relative positions - connect from card edges with 8px offset
  const startX = rightTable.left - container.left + rightTable.width / 2
  const startY = rightTable.bottom - container.top + 8 // 8px below table card
  const endX = output.left - container.left + output.width / 2
  const endY = output.top - container.top - 8 // 8px above output icon

  // Create Z-shaped curve with Bézier handles at 50% height
  const midY = (startY + endY) / 2 // 50% height between start and end

  // Control points at 50% height for clean Z-shape
  return `M ${startX} ${startY} C ${startX} ${midY}, ${endX} ${midY}, ${endX} ${endY}`
}

function updateCurvesDirectly() {
  if (!isActive) {
    rafId = requestAnimationFrame(updateCurvesDirectly)
    return
  }

  // Update top curves (input sources to left table)
  if (topSvgRef.value && inputSourcesRef.value?.length === 3 && leftTableRef.value) {
    const svg = topSvgRef.value

    // Ensure we have 3 path elements for input curves
    while (svg.children.length < 3) {
      const path = document.createElementNS('http://www.w3.org/2000/svg', 'path')
      path.setAttribute('stroke', '#fbbf24')
      path.setAttribute('stroke-width', '3')
      path.setAttribute('fill', 'none')
      path.setAttribute('stroke-linecap', 'round')
      path.setAttribute('opacity', '0.7')
      svg.appendChild(path)
    }

    // Update each input curve
    for (let i = 0; i < 3; i++) {
      const pathElement = svg.children[i] as SVGPathElement
      const newPath = getInputCurvePath(i)
      if (newPath && pathElement.getAttribute('d') !== newPath) {
        pathElement.setAttribute('d', newPath)
      }
    }
  }

  // Update bottom curves (right table to output sources)
  if (bottomSvgRef.value && outputSourcesRef.value?.length === 3 && rightTableRef.value) {
    const svg = bottomSvgRef.value

    // Ensure we have 3 path elements for output curves
    while (svg.children.length < 3) {
      const path = document.createElementNS('http://www.w3.org/2000/svg', 'path')
      path.setAttribute('stroke', '#fbbf24')
      path.setAttribute('stroke-width', '3')
      path.setAttribute('fill', 'none')
      path.setAttribute('stroke-linecap', 'round')
      path.setAttribute('opacity', '0.7')
      svg.appendChild(path)
    }

    // Update each output curve
    for (let i = 0; i < 3; i++) {
      const pathElement = svg.children[i] as SVGPathElement
      const newPath = getOutputCurvePath(i)
      if (newPath && pathElement.getAttribute('d') !== newPath) {
        pathElement.setAttribute('d', newPath)
      }
    }
  }

  rafId = requestAnimationFrame(updateCurvesDirectly)
}


onUnmounted(() => {
  isActive = false
  if (rafId) {
    cancelAnimationFrame(rafId)
  }
})

async function handleFileSelected(file: File) {
  store.clearError()
  store.setLoading(true)

  try {
    const results = await new Promise<{ data: string[][] }>((resolve, reject) => {
      parse(file, {
        worker: true,
        complete: resolve,
        error: reject,
      })
    })

    const csvData = results.data as string[][]
    if (!csvData || csvData.length === 0) {
      throw new Error('CSV file is empty')
    }

    // Set basic input data
    store.setInputData([file], csvData)

    // Detect if first row is headers
    const potentialHeaders = csvData[0]
    const hasHeaders = potentialHeaders.some((header) =>
      INPUT_COLUMNS.some((col) => col.regex.test(header)),
    )
    store.hasHeaderRow = hasHeaders

    // Auto-detect column mappings
    const headers = hasHeaders ? potentialHeaders : []
    const colIndexes = detectColumnMapping(headers)
    store.updateColIndexes(colIndexes)

    // Extract data rows (skip headers if present)
    const dataRows = hasHeaders ? csvData.slice(1) : csvData

    // Process data into categories
    const categories = categorizeData(dataRows, colIndexes)

    // Auto-partition categories into age groups
    const partitionedCategories = autoPartitionCategories(categories)

    // Update store with processed data
    store.setProcessedData(categories, partitionedCategories)

    // Calculate default max bib number using shared logic
    const defaultMaxBib = calculateDefaultMaxBib(csvData, colIndexes, hasHeaders)
    store.updateExportSettings({ maxBibNumber: defaultMaxBib })

    // Data is now processed and hasData will be true, causing SplitsView to show
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to parse CSV file'
    store.setError(errorMessage)
  } finally {
    store.setLoading(false)
  }
}

function handleErrorDismiss() {
  store.clearError()
}
</script>
