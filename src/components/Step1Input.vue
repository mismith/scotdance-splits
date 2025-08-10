<script setup lang="ts">
import { computed } from 'vue'
import { INPUT_COLUMNS } from '@/lib/helpers'
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
import { Columns } from 'lucide-vue-next'

interface FilterConfig {
  id: string
  mode: 'include' | 'exclude'
  column: 'all' | string
  term: string
  caseSensitive: boolean
}

interface Props {
  inputData?: string[][]
  inputCsv?: string[][]
  inputHeaders: string[]
  hasHeaderRow: boolean
  colIndexes: Record<string, number>
  rowFilteringConfig: {
    enabled: boolean
    showDimmed: boolean
    filters: FilterConfig[]
  }
  filteredOutRowIndexes: number[]
}

const props = defineProps<Props>()

const emit = defineEmits<{
  'update:hasHeaderRow': [value: boolean]
  'update:colIndexes': [value: Record<string, number>]
  'filters-changed': [config: { enabled: boolean; showDimmed: boolean; filters: FilterConfig[] }]
  'next-step': []
}>()

const columnMappingIsValid = computed(() => {
  const requiredColumns = INPUT_COLUMNS.filter((col) => col.required)
  return requiredColumns.every((col) => props.colIndexes[col.id] >= 0)
})

const isFieldValid = computed(() => (fieldId: string) => {
  const column = INPUT_COLUMNS.find((col) => col.id === fieldId)
  if (column?.required) {
    return props.colIndexes[fieldId] >= 0
  }
  return true
})

const rowFilteringIsValid = computed(() => {
  return true
})

function updateColIndex(id: string, value: string) {
  const newIndexes = { ...props.colIndexes }
  newIndexes[id] = value === 'none' ? -1 : props.inputHeaders.indexOf(value)
  emit('update:colIndexes', newIndexes)
}

function handleFiltersChanged(config: { enabled: boolean; showDimmed: boolean; filters: FilterConfig[] }) {
  emit('filters-changed', config)
}
</script>

<template>
  <div class="h-full">
    <SettingsPane>
      <HotTable
        v-if="inputData"
        :data="rowFilteringConfig.showDimmed && rowFilteringConfig.enabled ? (inputCsv?.slice(hasHeaderRow ? 1 : 0) || []) : inputData"
        :dimmed-rows="rowFilteringConfig.showDimmed && rowFilteringConfig.enabled ? filteredOutRowIndexes : []"
        :settings="{
          colHeaders: hasHeaderRow ? inputHeaders : true,
          readOnly: true,
        }"
      />

      <template #settings>
        <HelpText>
          Map the columns to the correct fields for automatic grouping. 
        </HelpText>

        <Accordion
          type="multiple"
          :default-value="columnMappingIsValid === false ? ['Column mapping'] : []"
        >
          <SettingsGroup
            title="Column mapping"
            :icon="Columns"
            :is-valid="columnMappingIsValid"
          >
            <div class="space-y-4">
              <div class="space-y-2">
                <Label for="header-row">Header row</Label>
                <label
                  class="border-input data-[placeholder]:text-muted-foreground [&_svg:not([class*='text-'])]:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive dark:bg-input/30 dark:hover:bg-input/50 flex w-full items-center justify-between gap-2 rounded-md border bg-transparent px-3 py-2 text-sm whitespace-nowrap shadow-xs transition-[color,box-shadow] outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50 data-[size=default]:h-9 data-[size=sm]:h-8 *:data-[slot=select-value]:line-clamp-1 *:data-[slot=select-value]:flex *:data-[slot=select-value]:items-center *:data-[slot=select-value]:gap-2 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4"
                >
                  <span>Present</span>
                  <Switch id="header-row" :model-value="hasHeaderRow" @update:model-value="$emit('update:hasHeaderRow', $event)" />
                </label>
              </div>

              <div v-for="{ id, name, required } in INPUT_COLUMNS" :key="id" class="space-y-2">
                <Label 
                  :for="id" 
                  :class="{
                    'text-destructive': required && !isFieldValid(id)
                  }"
                >
                  {{ name }}{{ required ? ' *' : '' }}
                </Label>
                <Select
                  :model-value="inputHeaders[colIndexes[id]]"
                  @update:model-value="updateColIndex(id, $event)"
                >
                  <SelectTrigger class="w-full">
                    <SelectValue placeholder="Select column..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    <SelectSeparator />
                    <SelectItem v-for="header in inputHeaders" :key="header" :value="header">
                      {{ header }}
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </SettingsGroup>

          <SettingsGroup
            title="Row filtering"
            :is-valid="rowFilteringIsValid"
          >
            <RowFilters 
              :input-headers="inputHeaders"
              :filters="rowFilteringConfig.filters"
              :show-dimmed="rowFilteringConfig.showDimmed"
              @filters-changed="handleFiltersChanged"
            />
          </SettingsGroup>
        </Accordion>
      </template>

      <template #footer>
        <Button @click="$emit('next-step')" class="w-full">Next</Button>
      </template>
    </SettingsPane>
  </div>
</template>