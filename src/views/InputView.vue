<template>
  <div>
    <!-- Fixed Back button toolbar -->
    <header
      class="fixed top-0 left-0 right-0 z-50 flex items-center px-3 py-1.5 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 h-12"
    >
      <Button
        variant="ghost"
        size="sm"
        @click="goBackToSplits"
        class="flex items-center gap-1.5 h-8 px-2"
      >
        <ChevronLeft class="h-3 w-3" />
        <span class="text-xs">Back</span>
      </Button>
      <div class="flex-1 text-center">
        <h2 class="text-sm font-semibold text-foreground">Input Data</h2>
      </div>
      <DarkModeToggle />
    </header>

    <!-- Main content with top padding to account for fixed header -->
    <main class="pt-12">
      <SettingsPane>
        <HotTable
          v-if="inputData"
          :data="
            rowFilteringConfig.showDimmed && rowFilteringConfig.enabled
              ? store.inputCSV?.slice(store.hasHeaderRow ? 1 : 0) || []
              : inputData
          "
          :dimmed-rows="
            rowFilteringConfig.showDimmed && rowFilteringConfig.enabled ? filteredOutRowIndexes : []
          "
          :settings="{
            colHeaders: store.hasHeaderRow ? store.inputHeaders : true,
            readOnly: true,
          }"
        />

        <template #settings>
          <HelpText> Map the columns to the correct fields for automatic grouping. </HelpText>

          <Accordion
            type="multiple"
            :default-value="columnMappingIsValid === false ? ['Column mapping'] : []"
          >
            <SettingsGroup title="Column mapping" :icon="Columns" :is-valid="columnMappingIsValid">
              <div class="space-y-4">
                <div class="space-y-2">
                  <Label for="header-row">Header row</Label>
                  <label
                    class="border-input data-[placeholder]:text-muted-foreground [&_svg:not([class*='text-'])]:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive dark:bg-input/30 dark:hover:bg-input/50 flex w-full items-center justify-between gap-2 rounded-md border bg-transparent px-3 py-2 text-sm whitespace-nowrap shadow-xs transition-[color,box-shadow] outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50 data-[size=default]:h-9 data-[size=sm]:h-8 *:data-[slot=select-value]:line-clamp-1 *:data-[slot=select-value]:flex *:data-[slot=select-value]:items-center *:data-[slot=select-value]:gap-2 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4"
                  >
                    <span>Present</span>
                    <Switch
                      id="header-row"
                      :model-value="store.hasHeaderRow"
                      @update:model-value="(value) => (store.hasHeaderRow = value)"
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
                    :model-value="store.inputHeaders[store.colIndexes[id]]"
                    @update:model-value="updateColIndex(id, $event)"
                  >
                    <SelectTrigger class="w-full">
                      <SelectValue placeholder="Select column..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None</SelectItem>
                      <SelectSeparator />
                      <SelectItem
                        v-for="header in store.inputHeaders"
                        :key="header"
                        :value="header"
                      >
                        {{ header }}
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </SettingsGroup>

            <SettingsGroup title="Row filtering" :is-valid="rowFilteringIsValid">
              <RowFilters
                :input-headers="store.inputHeaders"
                :filters="store.rowFilteringConfig.filters"
                :show-dimmed="store.rowFilteringConfig.showDimmed"
                @filters-changed="handleFiltersChanged"
              />
            </SettingsGroup>
          </Accordion>
        </template>

        <template #footer>
          <Button @click="goToSplitsView" class="w-full">Next</Button>
        </template>
      </SettingsPane>
    </main>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAppStore } from '@/stores/app'
import { INPUT_COLUMNS } from '@/lib/helpers'
import { ChevronLeft, Columns } from 'lucide-vue-next'
import DarkModeToggle from '@/components/DarkModeToggle.vue'

import HotTable from '@/components/HotTable.vue'
import SettingsPane from '@/components/SettingsPane.vue'
import SettingsGroup from '@/components/SettingsGroup.vue'
import HelpText from '@/components/HelpText.vue'
import RowFilters from '@/components/RowFilters.vue'

import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Accordion } from '@/components/ui/accordion'

const router = useRouter()
const store = useAppStore()

function goBackToSplits() {
  router.push('/splits')
}

function goToSplitsView() {
  router.push('/splits')
}

const inputData = computed(() => {
  if (rowFilteringConfig.value.enabled) {
    return filteredInputData.value.filtered
  }
  return store.inputCSV?.slice(store.hasHeaderRow ? 1 : 0)
})

const rowFilteringConfig = computed(() => store.rowFilteringConfig)

// Mock filtered data - would need proper implementation
const filteredInputData = computed(() => ({
  filtered: inputData.value || [],
  excludedIndexes: [],
}))

const filteredOutRowIndexes = computed(() => filteredInputData.value.excludedIndexes)

const columnMappingIsValid = computed(() => {
  const requiredColumns = INPUT_COLUMNS.filter((col) => col.required)
  return requiredColumns.every((col) => store.colIndexes[col.id] >= 0)
})

const isFieldValid = computed(() => (fieldId: string) => {
  const column = INPUT_COLUMNS.find((col) => col.id === fieldId)
  if (column?.required) {
    return store.colIndexes[fieldId] >= 0
  }
  return true
})

const rowFilteringIsValid = computed(() => {
  return true
})

function updateColIndex(id: string, value: string) {
  const newIndexes = { ...store.colIndexes }
  newIndexes[id] = value === 'none' ? -1 : store.inputHeaders.indexOf(value)
  store.updateColIndexes(newIndexes)
}

function handleFiltersChanged(config: {
  enabled: boolean
  showDimmed: boolean
  filters: unknown[]
}) {
  store.updateRowFiltering(config)
}
</script>
