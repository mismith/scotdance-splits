import { parse } from 'papaparse'
import { useLocalStorage, useMediaQuery } from '@vueuse/core'
import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import {
  INPUT_COLUMNS,
  autoPartitionCategories,
  categorizeData,
  detectColumnMapping,
} from '@/lib/input'
import { calculateDefaultMaxBib } from '@/lib/output'
import type { Cell } from '@/lib/types'
import {
  type ValidationIssue,
  detectHeaders,
  validateCodes,
  validateColumnMapping,
} from '@/lib/validation'

export interface DancerData {
  firstName: string
  lastName: string
  location: string
  code: string
  age?: number
  bibNumber?: number
  timestamp?: string
}

export const useAppStore = defineStore('app', () => {
  // File input state
  const inputFiles = ref<File[]>()
  const inputCSV = ref<Cell[][]>()
  const fileLoadError = ref<string>()
  const isLoadingInputFile = ref(false)

  // Processed data
  const categories = ref<Record<string, Record<string, number>>>()
  const partitionedCategories = ref<Record<string, [number, number][]>>()
  const processedDancers = ref<DancerData[]>([])

  // Manual partition overrides
  const manualPartitions = ref<Record<string, [number[], number][]>>({})

  // Input configuration
  const hasHeaderRow = useLocalStorage('scotdance.splits.hasHeaderRow', true)
  const inputHeaders = ref<string[]>([])
  const colIndexes = ref<Record<string, number>>({})

  // Layout
  const isDesktop = useMediaQuery('(min-width: 768px)')

  // Export configuration
  const maxBibNumber = ref<number>(100)
  const isPrintingYears = useLocalStorage('scotdance.splits.isPrintingYears', true)
  const includeCountry = useLocalStorage('scotdance.splits.includeCountry', false)
  const combineNames = useLocalStorage('scotdance.splits.combineNames', false)

  // Computed
  const hasData = computed(() => {
    return categories.value && Object.keys(categories.value).length > 0
  })

  const totalDancers = computed(() => {
    return processedDancers.value.length
  })

  // Reactively layer cell validation onto raw CSV data
  const validatedCSV = computed((): Cell[][] => {
    if (!inputCSV.value || inputCSV.value.length === 0) return []

    const rawData = inputCSV.value.map((row) => row.map((cell) => cell.value))
    const dataRows = hasHeaderRow.value ? rawData.slice(1) : rawData
    const codeColIndex = colIndexes.value.code

    const errorCellMap = new Map<string, 'error' | 'warning'>()
    if (codeColIndex !== undefined && codeColIndex !== -1) {
      const { invalidCodeCells, missingCodeCells } = validateCodes(dataRows, codeColIndex)
      ;[...invalidCodeCells, ...missingCodeCells].forEach(({ rowIndex, colIndex }) => {
        const actualRowIndex = hasHeaderRow.value ? rowIndex + 1 : rowIndex
        errorCellMap.set(`${actualRowIndex},${colIndex}`, 'warning')
      })
    }

    return inputCSV.value.map((row, rowIndex) =>
      row.map((cell, colIndex) => {
        const severity = errorCellMap.get(`${rowIndex},${colIndex}`)
        return {
          value: cell.value,
          error: severity === 'error',
          warning: severity === 'warning',
        }
      }),
    )
  })

  const inputErrors = computed((): ValidationIssue[] => {
    const errors: ValidationIssue[] = []

    // Include critical file load errors
    if (fileLoadError.value) {
      errors.push({
        type: 'parse-error',
        severity: 'error',
        message: fileLoadError.value,
      })
      return errors
    }

    // If no CSV data, no validation errors to show
    if (!inputCSV.value || inputCSV.value.length === 0) {
      return []
    }

    const cellData = inputCSV.value
    // Extract raw string values for validation
    const rawData = cellData.map((row) => row.map((cell) => cell.value))

    // Validate column mapping completeness
    const columnMappingErrors = validateColumnMapping(colIndexes.value)
    errors.push(...columnMappingErrors)

    // Extract data rows (skip headers if present, based on user's toggle)
    const dataRows = hasHeaderRow.value ? rawData.slice(1) : rawData

    // Get validation errors from categorizeData (which uses validation utilities)
    const { errors: categorizeErrors } = categorizeData(dataRows, colIndexes.value)

    // Combine errors
    errors.push(...categorizeErrors)

    return errors
  })

  // Actions
  function setInputData(files: File[], cellData: Cell[][]) {
    inputFiles.value = files
    inputCSV.value = cellData

    // Auto-detect headers (extract values from first row)
    if (cellData.length > 0) {
      inputHeaders.value = cellData[0].map((cell) => cell.value)
    }
  }

  function setLoading(loading: boolean) {
    isLoadingInputFile.value = loading
  }

  function setProcessedData(
    cats: Record<string, Record<string, number>>,
    partitions: Record<string, [number, number][]>,
    dancers?: DancerData[],
  ) {
    categories.value = cats
    partitionedCategories.value = partitions
    processedDancers.value = dancers || []
  }

  function clearAllData() {
    inputFiles.value = undefined
    inputCSV.value = undefined
    fileLoadError.value = undefined
    categories.value = undefined
    partitionedCategories.value = undefined
    processedDancers.value = []
    inputHeaders.value = []
    colIndexes.value = {}
    manualPartitions.value = {}
  }

  function updateColIndexes(indexes: Record<string, number>) {
    colIndexes.value = indexes
    // Errors will automatically recompute via the computed property

    // Reprocess categories with new column mappings
    if (inputCSV.value && inputCSV.value.length > 0) {
      const cellData = inputCSV.value
      // Extract raw string values for processing
      const rawData = cellData.map((row) => row.map((cell) => cell.value))

      const dataRows = hasHeaderRow.value ? rawData.slice(1) : rawData
      const { categories: cats } = categorizeData(dataRows, colIndexes.value)
      const partitionedCats = autoPartitionCategories(cats)

      setProcessedData(cats, partitionedCats)

      const defaultMaxBib = calculateDefaultMaxBib(rawData, colIndexes.value, hasHeaderRow.value)
      updateExportSettings({ maxBibNumber: defaultMaxBib })
    }
  }

  function updateExportSettings(settings: {
    maxBibNumber?: number
    isPrintingYears?: boolean
    includeCountry?: boolean
    combineNames?: boolean
  }) {
    if (settings.maxBibNumber !== undefined) {
      maxBibNumber.value = settings.maxBibNumber
    }
    if (settings.isPrintingYears !== undefined) {
      isPrintingYears.value = settings.isPrintingYears
    }
    if (settings.includeCountry !== undefined) {
      includeCountry.value = settings.includeCountry
    }
    if (settings.combineNames !== undefined) {
      combineNames.value = settings.combineNames
    }
  }

  // Manual partition methods
  function hasManualAdjustments(categoryCode: string): boolean {
    return categoryCode in manualPartitions.value
  }

  function setManualPartitions(categoryCode: string, partitions: [number[], number][]) {
    manualPartitions.value[categoryCode] = partitions
  }

  function clearManualPartitions(categoryCode: string) {
    delete manualPartitions.value[categoryCode]
  }

  async function loadFile(file: File) {
    fileLoadError.value = undefined
    setLoading(true)

    try {
      const results = await new Promise<{ data: string[][] }>((resolve, reject) => {
        parse(file, {
          worker: true,
          complete: resolve,
          error: reject,
        })
      })

      // Filter out completely empty rows (e.g., trailing newlines)
      const rawData = (results.data as string[][]).filter((row) =>
        row.some((cell) => cell && cell.trim() !== ''),
      )
      if (!rawData || rawData.length === 0) {
        throw new Error('CSV file is empty')
      }

      // Auto-detect column mappings
      const potentialHeaders = rawData[0]
      const hasHeaders = detectHeaders(potentialHeaders)
      const headers = hasHeaders ? potentialHeaders : []
      const detectedColIndexes = detectColumnMapping(headers)

      // Convert string[][] to Cell[][] (validation flags are layered reactively via validatedCSV)
      const cellData: Cell[][] = rawData.map((row) =>
        row.map((value) => ({ value, error: false, warning: false })),
      )

      // Set enriched cell data
      setInputData([file], cellData)

      // Update column indexes (this will reprocess data)
      updateColIndexes(detectedColIndexes)

      return true
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to parse CSV file'
      fileLoadError.value = errorMessage
      return false
    } finally {
      setLoading(false)
    }
  }

  return {
    // State
    inputFiles,
    validatedCSV,
    fileLoadError,
    inputErrors,
    isLoadingInputFile,
    categories,
    partitionedCategories,
    processedDancers,
    manualPartitions,
    hasHeaderRow,
    inputHeaders,
    colIndexes,
    maxBibNumber,
    isPrintingYears,
    includeCountry,
    combineNames,

    // Layout
    isDesktop,

    // Computed
    hasData,
    totalDancers,

    // Actions
    setInputData,
    setLoading,
    setProcessedData,
    clearAllData,
    updateColIndexes,
    updateExportSettings,
    hasManualAdjustments,
    setManualPartitions,
    clearManualPartitions,
    loadFile,
  }
})
