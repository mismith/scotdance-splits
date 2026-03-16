<script setup lang="ts">
import { useLocalStorage } from '@vueuse/core'
import { computed } from 'vue'
import { useAppStore } from '@/stores/app'
import { useViewTransition } from '@/composables/useViewTransition'
import CellTable from '@/components/CellTable.vue'
import DialogWithSidebar from '@/components/DialogWithSidebar.vue'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { INPUT_COLUMNS, SYNTHESIS_COLUMN_IDS } from '@/lib/input'

defineProps<{ open: boolean }>()
const emit = defineEmits<{ 'update:open': [value: boolean] }>()

const store = useAppStore()
const showSidebar = useLocalStorage('columnMappingShowSidebar', true)

// Main field columns (excluding code and synthesis-only columns)
const mainColumns = computed(() =>
  INPUT_COLUMNS.filter((col) => col.id !== 'code' && !SYNTHESIS_COLUMN_IDS.includes(col.id)),
)

// Code column rendered separately (before "or" divider)
const codeColumn = computed(() => INPUT_COLUMNS.find((col) => col.id === 'code')!)

function handleHeaderRowToggle(value: boolean) {
  store.hasHeaderRow = value
  // Force errors to regenerate with correct row offsets
  store.updateColIndexes(store.colIndexes)
}

const { isTransitioning, withViewTransition } = useViewTransition()

function updateColIndex(id: string, value: string | null) {
  const newIndexes = { ...store.colIndexes }
  const stringValue = String(value || 'none')
  newIndexes[id] = stringValue === 'none' ? -1 : store.inputHeaders.indexOf(stringValue)
  store.updateColIndexes(newIndexes)
}

function updateCodeColIndex(value: string | null) {
  const wasUnmapped = store.colIndexes.code === -1
  const willBeUnmapped = !value || value === 'none'
  if (wasUnmapped !== willBeUnmapped) {
    withViewTransition(() => updateColIndex('code', value))
  } else {
    updateColIndex('code', value)
  }
}

function isFieldValid(fieldId: string) {
  if (fieldId === 'code') {
    // Code is valid if mapped OR if synthesis mode is active
    return store.colIndexes.code >= 0 || store.synthesisMode
  }
  return true
}
</script>

<template>
  <DialogWithSidebar
    :open="open"
    v-model:show-sidebar="showSidebar"
    title="Fields"
    description="Your imported dancer registration data. Column mappings can be adjusted as needed."
    @update:open="emit('update:open', $event)"
  >
    <CellTable
      :data="
        store.hasHeaderRow ? (store.validatedCSV || []).slice(1) : store.validatedCSV || []
      "
      :headers="store.hasHeaderRow ? store.inputHeaders : undefined"
      wrapper-class="border rounded-3xl h-full bg-muted/50"
    />

    <template #sidebar>
      <div class="space-y-4">
        <div class="space-y-2">
          <Label for="header-row">Header row</Label>
          <label
            class="border-input data-[placeholder]:text-muted-foreground [&_svg:not([class*='text-'])]:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive dark:bg-input/30 dark:hover:bg-input/50 flex w-full items-center justify-between gap-2 rounded-md border bg-transparent px-3 py-2 text-sm whitespace-nowrap shadow-xs transition-[color,box-shadow] outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50 data-[size=default]:h-9 data-[size=sm]:h-8 *:data-[slot=select-value]:line-clamp-1 *:data-[slot=select-value]:flex *:data-[slot=select-value]:items-center *:data-[slot=select-value]:gap-2 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4"
          >
            <span>First row is headers</span>
            <Switch
              id="header-row"
              :model-value="store.hasHeaderRow"
              @update:model-value="handleHeaderRowToggle"
            />
          </label>
        </div>

        <!-- Code resolution card -->
        <div
          :class="[
            'space-y-3',
            store.colIndexes.code === -1 &&
              'rounded-xl border p-3 ' + (store.synthesisMode ? 'border-accent bg-accent/5' : ''),
            isTransitioning &&
              '[view-transition-name:match-element] [view-transition-class:contain]',
          ]"
        >
          <!-- Code column select -->
          <div class="space-y-2">
            <Label
              for="code"
              :class="[
                !isFieldValid('code') && 'text-destructive',
                isTransitioning && '[view-transition-name:match-element]',
              ]"
            >
              {{ codeColumn.name }}{{ !store.synthesisMode ? ' *' : '' }}
            </Label>
            <Select
              :model-value="(store.inputHeaders[store.colIndexes.code] || 'none') as string"
              @update:model-value="updateCodeColIndex(String($event))"
            >
              <SelectTrigger
                class="w-full"
                :class="isTransitioning && '[view-transition-name:match-element]'"
              >
                <SelectValue placeholder="Select column..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">None</SelectItem>
                <SelectSeparator />
                <SelectItem v-for="header in store.inputHeaders" :key="header" :value="header">
                  {{ header }}
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <!-- Synthesis section (only when code column is unmapped) -->
          <template v-if="store.colIndexes.code === -1">
            <div class="flex items-center gap-3">
              <div class="flex-1 border-t" />
              <span class="text-muted-foreground text-xs">or</span>
              <div class="flex-1 border-t" />
            </div>

            <!-- Category -->
            <div class="space-y-2">
              <Label for="category">Category</Label>
              <Select
                :model-value="
                  (store.inputHeaders[store.colIndexes.category] || 'none') as string
                "
                @update:model-value="updateColIndex('category', String($event))"
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

            <!-- Age / Birthday card -->
            <div class="rounded-lg border p-3 space-y-3">
              <!-- Age -->
              <div class="space-y-2">
                <Label for="age">Age</Label>
                <Select
                  :model-value="(store.inputHeaders[store.colIndexes.age] || 'none') as string"
                  @update:model-value="updateColIndex('age', String($event))"
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

              <!-- "or" divider -->
              <div class="flex items-center gap-3">
                <div class="flex-1 border-t" />
                <span class="text-muted-foreground text-xs">or</span>
                <div class="flex-1 border-t" />
              </div>

              <!-- Birthday -->
              <div class="space-y-2">
                <Label for="birthday">Birthday</Label>
                <Select
                  :model-value="
                    (store.inputHeaders[store.colIndexes.birthday] || 'none') as string
                  "
                  @update:model-value="updateColIndex('birthday', String($event))"
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

              <!-- Competition date (only when birthday mapped and age not mapped) -->
              <div
                v-if="store.colIndexes.birthday !== -1 && store.colIndexes.age === -1"
                class="space-y-2"
              >
                <Label
                  for="competition-date"
                  :class="{
                    'text-destructive': !store.competitionDate,
                  }"
                >
                  Competition date *
                </Label>
                <Input
                  id="competition-date"
                  type="date"
                  :model-value="store.competitionDate || ''"
                  class="w-full"
                  @update:model-value="
                    store.updateCompetitionDate($event ? String($event) : undefined)
                  "
                />
              </div>
            </div>
          </template>
        </div>

        <!-- Other field columns -->
        <div v-for="{ id, name } in mainColumns" :key="id" class="space-y-2">
          <Label :for="id">{{ name }}</Label>
          <Select
            :model-value="(store.inputHeaders[store.colIndexes[id]] || 'none') as string"
            @update:model-value="updateColIndex(id, String($event))"
          >
            <SelectTrigger class="w-full">
              <SelectValue placeholder="Select column..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">None</SelectItem>
              <SelectSeparator />
              <SelectItem v-for="header in store.inputHeaders" :key="header" :value="header">
                {{ header }}
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </template>

    <template #submit="{ close }">
      <Button @click="close()">Done</Button>
    </template>
  </DialogWithSidebar>
</template>
