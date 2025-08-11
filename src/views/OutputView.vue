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
        <h2 class="text-sm font-semibold text-foreground">Export Data</h2>
      </div>
      <DarkModeToggle />
    </header>

    <!-- Main content with top padding to account for fixed header -->
    <main class="pt-12">
      <SettingsPane>
        <HotTable
          v-if="mockOutput?.length"
          :data="mockOutput"
          :settings="{
            readOnly: true,
            columns: new Array(5),
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
                    :model-value="store.maxBibNumber"
                    @update:model-value="
                      (value) => store.updateExportSettings({ maxBibNumber: Number(value) })
                    "
                    @blur="handleMaxBibBlur"
                    class="w-full"
                  />
                </div>
              </SettingsGroup>

              <SettingsGroup title="CSV output" :is-valid="csvOutputIsValid">
                <div class="space-y-4">
                  <div class="space-y-2">
                    <Label for="printing-years">Include "Years" in age group names</Label>
                    <label
                      class="border-input data-[placeholder]:text-muted-foreground [&_svg:not([class*='text-'])]:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive dark:bg-input/30 dark:hover:bg-input/50 flex w-full items-center justify-between gap-2 rounded-md border bg-transparent px-3 py-2 text-sm whitespace-nowrap shadow-xs transition-[color,box-shadow] outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50 data-[size=default]:h-9 data-[size=sm]:h-8 *:data-[slot=select-value]:line-clamp-1 *:data-[slot=select-value]:flex *:data-[slot=select-value]:items-center *:data-[slot=select-value]:gap-2 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4"
                    >
                      <span>Include "Years"</span>
                      <Switch
                        id="printing-years"
                        :model-value="store.isPrintingYears"
                        @update:model-value="
                          (value) => store.updateExportSettings({ isPrintingYears: value })
                        "
                      />
                    </label>
                  </div>

                  <div class="space-y-2">
                    <Label for="include-country">Include country in location</Label>
                    <label
                      :class="[
                        'border-input data-[placeholder]:text-muted-foreground [&_svg:not([class*=\'text-\'])]:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive dark:bg-input/30 dark:hover:bg-input/50 flex w-full items-center justify-between gap-2 rounded-md border bg-transparent px-3 py-2 text-sm whitespace-nowrap shadow-xs transition-[color,box-shadow] outline-none focus-visible:ring-[3px] data-[size=default]:h-9 data-[size=sm]:h-8 *:data-[slot=select-value]:line-clamp-1 *:data-[slot=select-value]:flex *:data-[slot=select-value]:items-center *:data-[slot=select-value]:gap-2 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*=\'size-\'])]:size-4',
                        !isCountryColumnMapped && 'cursor-not-allowed opacity-50',
                      ]"
                    >
                      <span>Include country</span>
                      <Switch
                        id="include-country"
                        :model-value="store.includeCountry"
                        @update:model-value="
                          (value) => store.updateExportSettings({ includeCountry: value })
                        "
                        :disabled="!isCountryColumnMapped"
                      />
                    </label>
                  </div>
                </div>
              </SettingsGroup>
            </Accordion>
          </div>
        </template>
      </SettingsPane>
    </main>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAppStore } from '@/stores/app'
import { ChevronLeft } from 'lucide-vue-next'
import DarkModeToggle from '@/components/DarkModeToggle.vue'

import HotTable from '@/components/HotTable.vue'
import SettingsPane from '@/components/SettingsPane.vue'
import SettingsGroup from '@/components/SettingsGroup.vue'
import HelpText from '@/components/HelpText.vue'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Accordion } from '@/components/ui/accordion'

const router = useRouter()
const store = useAppStore()

function goBackToSplits() {
  router.push('/splits')
}

const bibNumbersIsValid = computed(() => {
  return store.maxBibNumber != null && store.maxBibNumber > 0
})

const csvOutputIsValid = computed(() => {
  return store.isPrintingYears != null
})

const isCountryColumnMapped = computed(() => {
  return true // Simplified for now
})

function handleMaxBibBlur() {
  if (!store.maxBibNumber && store.maxBibNumber !== 0) {
    store.updateExportSettings({ maxBibNumber: 100 })
  }
}

// Mock output data for now
const mockOutput = computed(() => [
  ['Name', 'Code', 'Location', 'Age Group', 'Bib'],
  ['Emma MacDonald', 'X08', 'Glasgow', 'Premier 6-8', '101'],
  ['James Campbell', 'X10', 'Toronto', 'Premier 9-11', '105'],
  ['Isla Fraser', 'X09', 'Melbourne', 'Premier 9-11', '106'],
])
</script>
