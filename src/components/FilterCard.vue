<template>
  <div class="border rounded-lg p-2 space-y-2">
    <!-- Reordered layout: Filter term (X), column, exclude, case-sensitive -->
    <div class="flex items-center gap-2">
      <!-- Filter term with X button - no visible label -->
      <div class="flex-1">
        <Input
          :id="`filter-term-${filter.id}`"
          :model-value="filter.term"
          @update:model-value="updateFilter({ term: String($event) })"
          placeholder="Enter text to filter by..."
        />
      </div>
      <Button
        variant="ghost"
        size="sm"
        @click="$emit('remove')"
        class="h-8 w-8 p-0 text-muted-foreground hover:text-destructive flex-shrink-0"
      >
        <X class="h-4 w-4" />
      </Button>
    </div>

    <!-- Column selection -->
    <div class="space-y-2">
      <Select
        :model-value="filter.column"
        @update:model-value="updateFilter({ column: String($event) })"
      >
        <SelectTrigger :id="`filter-column-${filter.id}`" class="w-full">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Any column</SelectItem>
          <SelectItem v-for="header in availableColumns" :key="header" :value="header">
            {{ header }}
          </SelectItem>
        </SelectContent>
      </Select>
    </div>

    <!-- Exclude and case-sensitive switches - smaller size -->
    <div class="flex gap-2">
      <label
        class="border-input data-[placeholder]:text-muted-foreground [&_svg:not([class*='text-'])]:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive dark:bg-input/30 dark:hover:bg-input/50 flex w-full items-center justify-between gap-1 rounded-md border bg-transparent px-2 py-1 text-xs whitespace-nowrap shadow-xs transition-[color,box-shadow] outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50 h-7 *:data-[slot=select-value]:line-clamp-1 *:data-[slot=select-value]:flex *:data-[slot=select-value]:items-center *:data-[slot=select-value]:gap-2 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-3"
      >
        <span>Exclude</span>
        <Switch
          :model-value="filter.mode === 'exclude'"
          @update:model-value="updateFilter({ mode: $event ? 'exclude' : 'include' })"
          class="!h-4 !w-6 [&_[data-slot=switch-thumb]]:!size-3"
        />
      </label>
      <label
        class="border-input data-[placeholder]:text-muted-foreground [&_svg:not([class*='text-'])]:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive dark:bg-input/30 dark:hover:bg-input/50 flex w-full items-center justify-between gap-1 rounded-md border bg-transparent px-2 py-1 text-xs whitespace-nowrap shadow-xs transition-[color,box-shadow] outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50 h-7 *:data-[slot=select-value]:line-clamp-1 *:data-[slot=select-value]:flex *:data-[slot=select-value]:items-center *:data-[slot=select-value]:gap-2 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-3"
      >
        <span>Case-sensitive</span>
        <Switch
          :model-value="filter.caseSensitive"
          @update:model-value="updateFilter({ caseSensitive: $event })"
          class="!h-4 !w-6 [&_[data-slot=switch-thumb]]:!size-3"
        />
      </label>
    </div>
  </div>
</template>

<script setup lang="ts">
import { X } from 'lucide-vue-next'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'

export interface FilterConfig {
  id: string
  mode: 'include' | 'exclude'
  column: 'all' | string
  term: string
  caseSensitive: boolean
}

interface Props {
  filter: FilterConfig
  filterIndex: number
  availableColumns: string[]
}

defineProps<Props>()

const emit = defineEmits<{
  'update:filter': [updates: Partial<FilterConfig>]
  remove: []
}>()

function updateFilter(updates: Partial<FilterConfig>) {
  emit('update:filter', updates)
}
</script>
