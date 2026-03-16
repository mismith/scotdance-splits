<script setup lang="ts">
import { useEventListener } from '@vueuse/core'
import { AlertTriangle, Table, TableProperties, Users } from 'lucide-vue-next'
import { computed, nextTick, onMounted, provide, ref } from 'vue'
import { onBeforeRouteLeave, useRoute } from 'vue-router'
import { startViewTransition } from 'vue-view-transitions'
import { useAppStore } from '@/stores/app'
import CategoryCard from '@/components/CategoryCard.vue'
import ExportSettingsDialog from '@/components/ExportSettingsDialog.vue'
import FieldSettingsDialog from '@/components/FieldSettingsDialog.vue'
import FileUpload from '@/components/FileUpload.vue'
import ValidationBanner from '@/components/ValidationBanner.vue'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  CATEGORY_CODE_NAMES,
  type Partition,
  createPartitions,
  fetchDemoCSV,
} from '@/lib/input'

const store = useAppStore()
const route = useRoute()

const showColumnMappingSheet = ref(false)
const showExportSettingsSheet = ref(false)
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

async function handleFileSelected(file: File) {
  if (store.hasData && !isDemoMode.value) {
    const confirmed = window.confirm(
      'Loading a new file will replace your existing data. Continue?',
    )
    if (!confirmed) return
  }
  validationDismissed.value = false
  await store.loadFile(file)
}

function handleFileRejected(message: string) {
  store.fileLoadError = message
  validationDismissed.value = false
}
</script>

<template>
  <FileUpload
    :is-loading="store.isLoadingInputFile"
    @file-selected="handleFileSelected"
    @file-rejected="handleFileRejected"
  >
    <div class="flex flex-col min-h-screen">
      <!-- Fixed Toolbar -->
      <header
        class="fixed top-0 left-0 right-0 z-50 grid grid-cols-[1fr_auto_1fr] items-center px-4 h-16 bg-gradient-to-b from-background to-transparent pointer-events-none *:pointer-events-auto"
        :class="'[view-transition-name:header]'"
      >
        <!-- Left side -->
        <div class="flex items-center gap-1 justify-self-start">
          <Button
            :variant="hasDismissedIssues ? undefined : 'outline'"
            :class="[
              'backdrop-blur',
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
              {{ allValidationIssues.length }} issue{{
                allValidationIssues.length !== 1 ? 's' : ''
              }}
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
          <Button
            :variant="showDancers ? 'default' : 'outline'"
            class="backdrop-blur"
            @click="toggleDancers"
          >
            <Users class="h-4 w-4" />
            Dancers
          </Button>
        </div>
      </header>

      <!-- Main content with top padding to account for fixed header -->
      <main class="pt-16 pb-16 flex-auto">
        <h1 class="sr-only">Age Group Splits</h1>
        <div
          v-if="!store.hasData"
          class="flex items-center justify-center py-20 text-muted-foreground"
        >
          <div class="text-center">
            <Table class="h-16 w-16 mx-auto mb-4 opacity-50" />
            <h2 class="text-lg font-semibold mb-2">No data to display</h2>
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
        :class="'[view-transition-name:footer]'"
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

      <!-- Field settings dialog -->
      <FieldSettingsDialog v-model:open="showColumnMappingSheet" />

      <!-- Export settings dialog -->
      <ExportSettingsDialog v-model:open="showExportSettingsSheet" :partitions="partitions" />
    </div>
  </FileUpload>
</template>
