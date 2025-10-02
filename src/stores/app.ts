import { parse } from 'papaparse'
import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import {
  INPUT_COLUMNS,
  autoPartitionCategories,
  categorizeData,
  detectColumnMapping,
} from '@/lib/input'
import { calculateDefaultMaxBib } from '@/lib/output'

export interface FilterConfig {
  id: string
  mode: 'include' | 'exclude'
  column: 'all' | string
  term: string
  caseSensitive: boolean
}

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
  const inputCSV = ref<string[][]>()
  const inputError = ref<string>()
  const isLoadingInputFile = ref(false)

  // Processed data
  const categories = ref<Record<string, Record<string, number>>>()
  const partitionedCategories = ref<Record<string, [number, number][]>>()
  const processedDancers = ref<DancerData[]>([])

  // Manual partition overrides
  const manualPartitions = ref<Record<string, [number[], number][]>>({})

  // Input configuration
  const hasHeaderRow = ref(true)
  const inputHeaders = ref<string[]>([])
  const colIndexes = ref<Record<string, number>>({})
  const rowFilteringConfig = ref<{
    enabled: boolean
    showDimmed: boolean
    filters: FilterConfig[]
  }>({
    enabled: false,
    showDimmed: true,
    filters: [],
  })

  // Export configuration
  const maxBibNumber = ref<number>(100)
  const isPrintingYears = ref(true)
  const includeCountry = ref(false)
  const combineNames = ref(false)

  // Computed
  const hasData = computed(() => {
    return categories.value && Object.keys(categories.value).length > 0
  })

  const totalDancers = computed(() => {
    return processedDancers.value.length
  })

  // Actions
  function setInputData(files: File[], csvData: string[][]) {
    inputFiles.value = files
    inputCSV.value = csvData
    inputError.value = undefined

    // Auto-detect headers
    if (csvData.length > 0) {
      inputHeaders.value = csvData[0]
    }
  }

  function setError(error: string) {
    inputError.value = error
  }

  function clearError() {
    inputError.value = undefined
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
    inputError.value = undefined
    categories.value = undefined
    partitionedCategories.value = undefined
    processedDancers.value = []
    inputHeaders.value = []
    colIndexes.value = {}
    rowFilteringConfig.value = {
      enabled: false,
      showDimmed: true,
      filters: [],
    }
    manualPartitions.value = {}
  }

  function updateColIndexes(indexes: Record<string, number>) {
    colIndexes.value = indexes
  }

  function updateRowFiltering(config: {
    enabled: boolean
    showDimmed: boolean
    filters: FilterConfig[]
  }) {
    rowFilteringConfig.value = config
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
    clearError()
    setLoading(true)

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
      setInputData([file], csvData)

      // Detect if first row is headers
      const potentialHeaders = csvData[0]
      const hasHeaders = potentialHeaders.some((header) =>
        INPUT_COLUMNS.some((col) => col.regex.test(header)),
      )
      hasHeaderRow.value = hasHeaders

      // Auto-detect column mappings
      const headers = hasHeaders ? potentialHeaders : []
      const colIndexes = detectColumnMapping(headers)
      updateColIndexes(colIndexes)

      // Extract data rows (skip headers if present)
      const dataRows = hasHeaders ? csvData.slice(1) : csvData

      // Process data into categories
      const cats = categorizeData(dataRows, colIndexes)

      // Auto-partition categories into age groups
      const partitionedCats = autoPartitionCategories(cats)

      // Update store with processed data
      setProcessedData(cats, partitionedCats)

      // Calculate default max bib number using shared logic
      const defaultMaxBib = calculateDefaultMaxBib(csvData, colIndexes, hasHeaders)
      updateExportSettings({ maxBibNumber: defaultMaxBib })

      return true
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to parse CSV file'
      setError(errorMessage)
      return false
    } finally {
      setLoading(false)
    }
  }

  return {
    // State
    inputFiles,
    inputCSV,
    inputError,
    isLoadingInputFile,
    categories,
    partitionedCategories,
    processedDancers,
    manualPartitions,
    hasHeaderRow,
    inputHeaders,
    colIndexes,
    rowFilteringConfig,
    maxBibNumber,
    isPrintingYears,
    includeCountry,
    combineNames,

    // Computed
    hasData,
    totalDancers,

    // Actions
    setInputData,
    setError,
    clearError,
    setLoading,
    setProcessedData,
    clearAllData,
    updateColIndexes,
    updateRowFiltering,
    updateExportSettings,
    hasManualAdjustments,
    setManualPartitions,
    clearManualPartitions,
    loadFile,
  }
})
