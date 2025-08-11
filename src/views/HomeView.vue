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
    <header class="py-8 text-center relative">
      <!-- Dark mode toggle -->
      <div class="absolute top-8 right-8">
        <DarkModeToggle />
      </div>
      
      <div class="flex items-center justify-center gap-3 mb-2">
        <img src="/touchicon.png" alt="Splits Logo" class="w-12 h-12" />
        <h1 class="text-4xl font-light text-foreground">
          <span class="font-semibold text-primary">Splits</span>
        </h1>
      </div>
      <p class="text-lg text-muted-foreground">
        Stop manually sorting dance competition entries
      </p>
    </header>

    <!-- Main content -->
    <main class="flex-1 max-w-6xl mx-auto px-6">
      <!-- Value proposition -->
      <section class="text-center mb-16">
        <p class="text-xl text-muted-foreground mb-8">
          Upload your registration CSV, get organized age groups with bib numbers—<br>
          ready for competition programs and scoring systems.
        </p>
        
        <!-- Tool ecosystem context -->
        <div class="flex justify-center items-center gap-8 text-sm text-muted-foreground mb-12">
          <div class="flex items-center gap-2">
            <div class="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center text-blue-600">
              <Globe class="h-4 w-4" />
            </div>
            <span>eventry.net</span>
          </div>
          <div class="flex items-center gap-2">
            <div class="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center text-green-600">
              <Trophy class="h-4 w-4" />
            </div>
            <span>hdcomps.com</span>
          </div>
          <div class="flex items-center gap-2">
            <div class="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center text-gray-600">
              <BarChart3 class="h-4 w-4" />
            </div>
            <span>Any registration system</span>
          </div>
        </div>
      </section>

      <!-- Before/After Example -->
      <section class="mb-16">
        <div class="grid lg:grid-cols-2 gap-12">
          <!-- Before: The Pain -->
          <div class="space-y-6">
            <h3 class="text-xl font-semibold text-red-600 mb-4">Before: Hours of manual work</h3>
            <div class="bg-red-50 border border-red-200 rounded-lg p-6">
              <div class="text-sm font-mono text-red-800 space-y-1 mb-4">
                <div>Emma MacDonald, X08, Glasgow, Jan 15</div>
                <div>James Campbell, X10, Toronto, Jan 22</div>
                <div>Isla Fraser, X09, Melbourne, Feb 03</div>
                <div>Connor McLeod, X11, Edinburgh, Feb 12</div>
                <div class="text-red-600 font-sans">...43 more dancers to sort by age...</div>
              </div>
              <div class="space-y-1 text-sm text-red-600">
                <div>❌ Manual age calculation</div>
                <div>❌ Uneven group sizes</div>
                <div>❌ Bib numbering mistakes</div>
              </div>
            </div>
          </div>

          <!-- After: The Solution -->
          <div class="space-y-6">
            <h3 class="text-xl font-semibold text-green-600 mb-4">After: Organized in seconds</h3>
            <div class="bg-green-50 border border-green-200 rounded-lg p-6">
              <div class="space-y-4 text-sm">
                <div>
                  <div class="font-semibold text-green-700 mb-2">Premier 6-8 Years (16 dancers)</div>
                  <div class="font-mono text-xs text-green-800 space-y-0.5 ml-4">
                    <div>101 - Liam Robertson, Calgary</div>
                    <div>103 - Emma MacDonald, Glasgow</div>
                    <div>108 - Hamish Murray, Sydney</div>
                  </div>
                </div>
                
                <div>
                  <div class="font-semibold text-green-700 mb-2">Premier 9-11 Years (15 dancers)</div>
                  <div class="font-mono text-xs text-green-800 space-y-0.5 ml-4">
                    <div>105 - Connor McLeod, Edinburgh</div>
                    <div>106 - Isla Fraser, Melbourne</div>
                    <div>107 - James Campbell, Toronto</div>
                  </div>
                </div>
              </div>
              
              <div class="space-y-1 text-sm text-green-600 mt-4">
                <div>✅ Automatic age grouping</div>
                <div>✅ Balanced group sizes</div>
                <div>✅ Perfect bib numbering</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- Output compatibility -->
      <section class="text-center mb-16">
        <h3 class="text-lg font-semibold mb-8">Ready for your competition tools</h3>
        <div class="flex justify-center items-center gap-12">
          <div class="text-center">
            <div class="w-16 h-16 bg-purple-100 rounded-lg flex items-center justify-center mb-3 mx-auto">
              <span class="text-2xl">📱</span>
            </div>
            <p class="font-medium">ScotDance.app</p>
            <p class="text-xs text-muted-foreground">Direct import</p>
          </div>
          <div class="text-center">
            <div class="w-16 h-16 bg-blue-100 rounded-lg flex items-center justify-center mb-3 mx-auto">
              <span class="text-2xl">📄</span>
            </div>
            <p class="font-medium">Paper programs</p>
            <p class="text-xs text-muted-foreground">Print-ready format</p>
          </div>
          <div class="text-center">
            <div class="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center mb-3 mx-auto">
              <span class="text-2xl">⚙️</span>
            </div>
            <p class="font-medium">Other systems</p>
            <p class="text-xs text-muted-foreground">Standard CSV</p>
          </div>
        </div>
      </section>
    </main>

    <!-- Sticky floating CTA -->
    <div class="sticky bottom-0 z-50 mt-8 pb-8">
      <div class="bg-card border border-border shadow-lg rounded-xl p-6 max-w-md mx-auto">
        <div class="text-center mb-4">
          <p class="text-sm text-muted-foreground">
            Drag & drop your CSV file anywhere or
          </p>
        </div>
        <Button
          size="lg"
          :disabled="store.isLoadingInputFile"
          @click="chooseFile"
          class="w-full"
        >
          <span v-if="store.isLoadingInputFile" class="flex items-center gap-2">
            <div
              class="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"
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
import { parse } from 'papaparse'
import { useAppStore } from '@/stores/app'
import { Button } from '@/components/ui/button'
import DarkModeToggle from '@/components/DarkModeToggle.vue'
import FileUpload from '@/components/FileUpload.vue'
import { Globe, Trophy, BarChart3 } from 'lucide-vue-next'
import { detectColumnMapping, categorizeData, autoPartitionCategories, INPUT_COLUMNS } from '@/lib/data'

const store = useAppStore()

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
      INPUT_COLUMNS.some((col) => col.regex.test(header))
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

    // Calculate default max bib number
    const defaultMaxBib = Math.round((dataRows.length + 50) / 100) * 100 + 100
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