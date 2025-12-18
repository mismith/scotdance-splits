<template>
  <!-- Section 2: The Transformation - Parallax Slide-Up -->
  <section
    ref="transformationSectionRef"
    class="relative min-h-[150vh] px-6 bg-muted/20"
    style="perspective: 2000px"
  >
    <div class="max-w-6xl mx-auto" style="transform-style: preserve-3d">
      <!-- Before Table (Sticky, stays in view) -->
      <div
        class="sticky top-24 py-12 max-w-[92%] mx-auto"
        style="transform-style: preserve-3d"
      >
        <div
          class="bg-background border rounded-3xl p-6 md:p-8 shadow-lg relative z-10"
          :style="{ transform: `rotateX(${beforeRotation}deg) scale(0.95)` }"
        >
          <div class="flex items-baseline justify-between mb-6">
            <h3 class="text-base md:text-lg font-semibold text-muted-foreground">Before</h3>
            <p class="text-sm md:text-base text-muted-foreground/80 font-medium">
              Unsorted. Unbalanced. Hours of work ahead.
            </p>
          </div>
          <div
            class="rounded-xl overflow-x-auto overflow-y-hidden border max-h-[500px] will-change-transform"
            style="backface-visibility: hidden"
          >
            <CellTable :data="mockInputDataRows.slice(0, 20)" :headers="mockInputHeaders" />
          </div>
        </div>
      </div>

      <!-- After Table (Slides up from below to cover Before) -->
      <div
        class="relative py-24 -mt-32 max-w-[92%] mx-auto"
        style="transform-style: preserve-3d"
      >
        <div
          class="bg-primary/5 backdrop-blur-2xl border-2 border-primary/30 rounded-3xl p-6 md:p-8 shadow-2xl relative z-20"
          :style="{
            transform: `rotateX(-${afterRotation}deg) translateZ(300px) scale(0.95)`,
          }"
        >
          <div class="flex items-baseline justify-between mb-6">
            <h3 class="text-base md:text-lg font-semibold text-primary">After</h3>
            <p class="text-sm md:text-base text-primary/90 font-medium">
              Balanced groups. Assigned bibs. Done in seconds.
            </p>
          </div>
          <div
            class="rounded-xl overflow-x-auto overflow-y-hidden border-2 border-primary/30 max-h-[500px] will-change-transform"
            style="backface-visibility: hidden"
          >
            <CellTable
              :data="filteredOutputData"
              :show-headers="false"
              :show-row-headers="false"
            />
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { parse } from 'papaparse'
import { computed, onMounted, ref } from 'vue'
import { useScroll } from '@vueuse/core'
import { fetchDemoCSV, processCSVData, createPartitions } from '@/lib/input'
import { type ExportSettings, calculateDefaultMaxBib, generateExportData } from '@/lib/output'
import type { Cell } from '@/lib/types'
import CellTable from '@/components/CellTable.vue'

// Dynamic mock data loaded from CSV
const mockInputData = ref<Cell[][]>([])
const mockInputHeaders = ref<string[]>([])
const isLoadingMockData = ref(true)

// Scroll-based parallax rotation
const transformationSectionRef = ref<HTMLElement>()
const { y } = useScroll(window)

// Load mock data for preview tables
async function loadMockData() {
  try {
    const csvText = await fetchDemoCSV()

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
      // Convert string[][] to Cell[][] (no validation for demo data)
      mockInputData.value = csvData.map((row) =>
        row.map((value) => ({ value, error: false, warning: false })),
      )
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
  return mockInputData.value.slice(1)
})

// Process mock data using shared transformation logic
const mockProcessedData = computed(() => {
  if (isLoadingMockData.value || mockInputData.value.length === 0) {
    return null
  }
  try {
    // Extract raw string values for processing
    const rawData = mockInputData.value.map((row) => row.map((cell) => cell.value))
    return processCSVData(rawData)
  } catch (error) {
    console.error('Failed to process mock data:', error)
    return null
  }
})

const mockPartitions = computed(() => {
  if (!mockProcessedData.value) return {}
  return createPartitions(
    mockProcessedData.value.categories,
    mockProcessedData.value.partitionedCategories,
  )
})

// Generate actual output data using shared export logic
const realOutputData = computed(() => {
  if (!mockProcessedData.value || mockInputData.value.length === 0) {
    return []
  }

  // Extract raw string values for processing
  const rawData = mockInputData.value.map((row) => row.map((cell) => cell.value))

  const defaultMaxBib = calculateDefaultMaxBib(
    rawData,
    mockProcessedData.value.colIndexes,
    mockProcessedData.value.hasHeaderRow,
  )

  const settings: ExportSettings = {
    maxBibNumber: defaultMaxBib,
    isPrintingYears: true,
    includeCountry: false,
    combineNames: false,
  }

  return generateExportData(
    rawData,
    mockProcessedData.value.colIndexes,
    mockPartitions.value,
    settings,
    mockProcessedData.value.hasHeaderRow,
  )
})

// Filter output data to show only first 3 groups
const filteredOutputData = computed((): Cell[][] => {
  const data = realOutputData.value
  if (data.length === 0) return []

  let groupCount = 0
  let filteredData: (string | number)[][] = data

  for (let i = 0; i < data.length; i++) {
    const row = data[i]
    // Group header: first cell has text, others empty (but not all empty for separator)
    if (row[0] && !row[1] && !row[2] && !row[3]) {
      groupCount++
      if (groupCount > 3) {
        // Return everything up to (but not including) this 4th group header
        // Also exclude the separator row before it (i-1)
        filteredData = data.slice(0, Math.max(0, i - 1))
        break
      }
    }
  }

  // Convert (string | number)[][] to Cell[][]
  return filteredData.map((row) =>
    row.map((value) => ({ value: String(value), error: false, warning: false })),
  )
})

// Scroll-based rotation angles for parallax effect
const beforeRotation = computed(() => {
  if (!transformationSectionRef.value) return 0

  const rect = transformationSectionRef.value.getBoundingClientRect()
  const viewportHeight = window.innerHeight
  const elementTop = rect.top + y.value
  const elementHeight = rect.height

  // Calculate scroll progress through the section
  const scrollStart = elementTop - viewportHeight * 0.9
  const scrollEnd = elementTop + elementHeight * 0.9
  const scrollRange = scrollEnd - scrollStart

  const progress = (y.value - scrollStart) / scrollRange
  const clampedProgress = Math.max(0, Math.min(1, progress))

  // Before: 0deg → 70deg (starts flat, tilts back dramatically)
  return clampedProgress * 90
})

const afterRotation = computed(() => {
  if (!transformationSectionRef.value) return 70

  const rect = transformationSectionRef.value.getBoundingClientRect()
  const viewportHeight = window.innerHeight
  const elementTop = rect.top + y.value
  const elementHeight = rect.height

  // Calculate scroll progress through the section
  const scrollStart = elementTop - viewportHeight * 0.1
  const scrollEnd = elementTop + elementHeight * 0.4
  const scrollRange = scrollEnd - scrollStart

  const progress = (y.value - scrollStart) / scrollRange
  const clampedProgress = Math.max(0, Math.min(1, progress))

  // After: 70deg → 0deg (completes rotation at 80% scroll progress for more visible effect)
  const rotationProgress = Math.min(clampedProgress / 0.9, 1)
  return 70 - rotationProgress * 70
})

onMounted(() => {
  loadMockData()
})
</script>
