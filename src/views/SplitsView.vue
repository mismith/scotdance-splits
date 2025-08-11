<template>
  <div>
    <!-- Fixed Toolbar -->
    <header
      class="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-3 py-1.5 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 h-12"
    >
      <!-- Left side -->
      <div class="flex items-center gap-1">
        <Button
          variant="ghost"
          size="sm"
          @click="goToInputView"
          class="flex items-center gap-1.5 h-8 px-2"
        >
          <Table class="h-3 w-3" />
          <span class="text-xs">Input</span>
        </Button>
      </div>

      <!-- Center - Logo with dark mode toggle -->
      <div class="flex-1 flex justify-center">
        <div class="flex items-center gap-3">
          <img src="/touchicon.png" alt="Splits Logo" class="w-4 h-4" />
          <button
            @click="goToHome"
            class="text-sm font-semibold text-primary hover:text-primary/80 transition-colors"
          >
            Splits
          </button>
          <DarkModeToggle />
        </div>
      </div>

      <!-- Right side -->
      <div class="flex items-center gap-1">
        <Button
          variant="ghost"
          size="sm"
          @click="togglePreviewDancers"
          :class="{ 'bg-muted': showPreviewDancers }"
          class="flex items-center gap-1.5 h-8 px-2"
        >
          <Users class="h-3 w-3" />
          <span class="text-xs">{{ showPreviewDancers ? 'Hide' : 'Show' }} Dancers</span>
        </Button>
        <Button
          variant="ghost"
          size="sm"
          @click="goToOutputView"
          class="flex items-center gap-1.5 h-8 px-2"
        >
          <Settings class="h-3 w-3" />
          <span class="text-xs">Output</span>
        </Button>
      </div>
    </header>

    <!-- Main content with top padding to account for fixed header -->
    <main class="pt-12">
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
        <div class="text-center mb-6">
          <HelpText>
            Ensure the categories are split appropriately, or adjust them as needed.
          </HelpText>
        </div>

        <CategoryCard
          v-for="categoryCode in Object.keys(CATEGORY_CODE_NAMES).filter(
            (c) => store.categories?.[c],
          )"
          :key="categoryCode"
          ref="categoryCardRef"
          :name="CATEGORY_CODE_NAMES[categoryCode]"
          :ages="store.categories[categoryCode]"
          @partition="handlePartition(categoryCode, $event)"
        />
      </div>
    </main>

    <!-- Sticky Export CTA -->
    <div class="sticky bottom-0 z-50 mt-8 pb-8">
      <div class="bg-card border border-border shadow-lg rounded-xl p-6 max-w-md mx-auto">
        <div class="text-center mb-4">
          <p class="text-sm text-muted-foreground">
            Ready to download your organized competition data?
          </p>
        </div>
        <Button size="lg" @click="handleExportDownload" class="w-full">
          <span class="flex items-center gap-2">
            <Download class="h-4 w-4" />
            Export CSV
          </span>
        </Button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, provide } from 'vue'
import { useRouter } from 'vue-router'
import { useAppStore } from '@/stores/app'
import { Button } from '@/components/ui/button'
import { Table, Settings, Download, Users } from 'lucide-vue-next'
import DarkModeToggle from '@/components/DarkModeToggle.vue'
import { unparse } from 'papaparse'
import { downloadCSV, getAgeGroupName, CATEGORY_CODE_NAMES } from '@/lib/helpers'
import CategoryCard from '@/components/CategoryCard.vue'
import HelpText from '@/components/HelpText.vue'

const router = useRouter()
const store = useAppStore()

const categoryCardRef = ref<(typeof CategoryCard)[]>()
const showPreviewDancers = ref(false)

// Partitions store - maps category code to age ranges
type Partition = {
  categoryCode: string
  ageRange: number[]
  codes: string[]
}

const partitions = ref<Record<string, Partition[]>>({})

function togglePreviewDancers() {
  showPreviewDancers.value = !showPreviewDancers.value
}

// Provide for CategoryCard components
provide(
  'isPrintingYears',
  computed(() => store.isPrintingYears),
)
provide('showPreviewDancers', showPreviewDancers)

// Navigation functions
function goToHome() {
  router.push('/')
}

function goToInputView() {
  router.push('/input')
}

function goToOutputView() {
  router.push('/output')
}

function handlePartition(categoryCode: string, partitionedAgeRanges: number[][]) {
  const ageCodesWithinGroup = Object.keys(store.categories?.[categoryCode] || {})
  const partitioned = partitionedAgeRanges.map(
    ([minAge, maxAge]) =>
      ({
        categoryCode,
        ageRange: [minAge, maxAge],
        codes: [],
      }) as Partition,
  )

  ageCodesWithinGroup.forEach((ageCode) => {
    const age = Number(ageCode)
    partitionedAgeRanges.forEach(([minAge, maxAge], index) => {
      if (minAge <= age && age <= maxAge) {
        const code = `${categoryCode}${ageCode}`
        partitioned[index].codes.push(code)
      }
    })
  })

  partitions.value[categoryCode] = partitioned

  // Update the store's partitioned categories
  const newPartitionedCategories = {
    ...store.partitionedCategories,
    [categoryCode]: partitionedAgeRanges.map(
      ([minAge, maxAge]) => [minAge, maxAge] as [number, number],
    ),
  }
  store.setProcessedData(store.categories!, newPartitionedCategories)
}

// Generate numbered CSV with bib numbers based on registration order
const numberedCSV = computed(() => {
  const inputData = store.inputCSV?.slice(store.hasHeaderRow ? 1 : 0) || []

  return inputData
    ?.filter((row) => row[store.colIndexes.firstName || 0])
    .sort((rowA, rowB) =>
      (rowA[store.colIndexes.timestamp || 0] || '').localeCompare(
        rowB[store.colIndexes.timestamp || 0] || '',
      ),
    )
    .map((row, index) => [...row, `${(store.maxBibNumber || 100) - index}`])
})

// Real export function using original logic
function handleExportDownload() {
  const data: (string | number)[][] = []

  Object.values(partitions.value)
    .flat()
    .forEach((partition) => {
      if (data.length) data.push([])

      const name = `${CATEGORY_CODE_NAMES[partition.categoryCode]} ${getAgeGroupName(partition.ageRange[0], partition.ageRange[1], store.isPrintingYears)}`
      data.push([name])

      const rows =
        numberedCSV.value?.filter((row) =>
          row.find((value) => partition.codes.includes(value as string)),
        ) || []
      data.push(
        ...rows.map((row) => {
          // Build location column based on includeCountry setting
          const locationParts = [
            row[store.colIndexes.location || 0],
            row[store.colIndexes.region || 0],
          ]

          if (store.includeCountry && store.colIndexes.country && row[store.colIndexes.country]) {
            locationParts.push(row[store.colIndexes.country])
          }

          return [
            row[row.length - 1], // bib number (last column)
            row[store.colIndexes.firstName || 0] ||
              (!row[store.colIndexes.lastName || 0] && row[store.colIndexes.fullName || 0]),
            row[store.colIndexes.lastName || 0],
            locationParts.filter(Boolean).join(', '),
          ]
        }),
      )
    })

  const csvContent = unparse(data)
  downloadCSV(csvContent, 'splits-export')
}
</script>
