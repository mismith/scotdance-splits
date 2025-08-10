<script setup lang="ts">
import { computed } from 'vue'
import { downloadCSV } from '@/lib/helpers'
import HotTable from '@/components/HotTable.vue'
import SettingsPane from '@/components/SettingsPane.vue'
import SettingsGroup from '@/components/SettingsGroup.vue'
import HelpText from '@/components/HelpText.vue'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Accordion } from '@/components/ui/accordion'

interface Props {
  output: any[][]
  outputNumColumns: number
  outputCsv: string
  maxBibNumber?: number
  defaultMaxBibNumber?: number
  isPrintingYears: boolean
  includeCountry: boolean
  isCountryColumnMapped: boolean
}

const props = defineProps<Props>()

const emit = defineEmits<{
  'update:maxBibNumber': [value: number]
  'update:isPrintingYears': [value: boolean]
  'update:includeCountry': [value: boolean]
}>()

const bibNumbersIsValid = computed(() => {
  return props.maxBibNumber != null && props.maxBibNumber > 0
})

const csvOutputIsValid = computed(() => {
  return props.isPrintingYears != null
})

function handleMaxBibBlur() {
  if (!props.maxBibNumber && props.defaultMaxBibNumber) {
    emit('update:maxBibNumber', props.defaultMaxBibNumber)
  }
}

function handleExport() {
  downloadCSV(props.outputCsv)
}
</script>

<template>
  <div class="h-full">
    <SettingsPane>
      <HotTable
        v-if="output?.length"
        :data="output"
        :settings="{
          readOnly: true,
          columns: new Array(outputNumColumns),
          height: 600,
        }"
      />

      <template #settings>
        <div class="space-y-4">
          <HelpText>
            Bib numbers are assigned based on reverse order of registration. You can adjust the
            highest bib number to start from.
          </HelpText>

          <Accordion type="multiple">
            <SettingsGroup title="Bib numbers" :is-valid="bibNumbersIsValid">
              <div class="space-y-2">
                <Label for="max-bib">Highest bib number</Label>
                <Input
                  id="max-bib"
                  type="number"
                  :model-value="maxBibNumber"
                  @update:model-value="$emit('update:maxBibNumber', $event)"
                  :min="1"
                  @blur="handleMaxBibBlur"
                />
              </div>
            </SettingsGroup>

            <SettingsGroup title="CSV output" :is-valid="csvOutputIsValid">
              <div class="space-y-4">
                <div class="space-y-2">
                  <Label for="print-years">Age group names</Label>
                  <label
                    class="border-input data-[placeholder]:text-muted-foreground [&_svg:not([class*='text-'])]:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive dark:bg-input/30 dark:hover:bg-input/50 flex w-full items-center justify-between gap-2 rounded-md border bg-transparent px-3 py-2 text-sm whitespace-nowrap shadow-xs transition-[color,box-shadow] outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50 data-[size=default]:h-9 data-[size=sm]:h-8 *:data-[slot=select-value]:line-clamp-1 *:data-[slot=select-value]:flex *:data-[slot=select-value]:items-center *:data-[slot=select-value]:gap-2 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4"
                  >
                    <span>Print "Years"</span>
                    <Switch 
                      id="print-years" 
                      :model-value="isPrintingYears" 
                      @update:model-value="$emit('update:isPrintingYears', $event)" 
                    />
                  </label>
                </div>
                
                <div class="space-y-2">
                  <Label for="include-country">Location</Label>
                  <label
                    :class="[
                      'border-input data-[placeholder]:text-muted-foreground [&_svg:not([class*=\'text-\'])]:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive dark:bg-input/30 dark:hover:bg-input/50 flex w-full items-center justify-between gap-2 rounded-md border bg-transparent px-3 py-2 text-sm whitespace-nowrap shadow-xs transition-[color,box-shadow] outline-none focus-visible:ring-[3px] data-[size=default]:h-9 data-[size=sm]:h-8 *:data-[slot=select-value]:line-clamp-1 *:data-[slot=select-value]:flex *:data-[slot=select-value]:items-center *:data-[slot=select-value]:gap-2 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*=\'size-\'])]:size-4',
                      !isCountryColumnMapped && 'cursor-not-allowed opacity-50'
                    ]"
                  >
                    <span>Include country</span>
                    <Switch 
                      id="include-country" 
                      :model-value="includeCountry"
                      @update:model-value="$emit('update:includeCountry', $event)"
                      :disabled="!isCountryColumnMapped"
                    />
                  </label>
                </div>
              </div>
            </SettingsGroup>
          </Accordion>
        </div>
      </template>

      <template #footer>
        <Button @click="handleExport" class="w-full">Export CSV</Button>
      </template>
    </SettingsPane>
  </div>
</template>