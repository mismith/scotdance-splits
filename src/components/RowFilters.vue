<template>
  <div class="space-y-2">
    <!-- Filters list -->
    <div v-if="filters.length > 0" class="space-y-2">
      <FilterCard
        v-for="(filter, index) in filters"
        :key="filter.id"
        :filter="filter"
        :filter-index="index"
        :available-columns="props.inputHeaders"
        @update:filter="updateFilter(filter.id, $event)"
        @remove="removeFilter(filter.id)"
      />
    </div>

    <!-- Add filter button -->
    <Button @click="addFilter" variant="outline" class="w-full">
      <Plus class="h-4 w-4 mr-2" />
      Add Filter
    </Button>

    <!-- Preview mode toggle - moved to bottom and full width -->
    <div v-if="filters.length > 0" class="space-y-2 mt-2">
      <Label for="preview-mode">Preview mode</Label>
      <Select v-model="showFilteredRowsDimmed" class="w-full">
        <SelectTrigger id="preview-mode" class="w-full">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="true">Show filtered rows dimmed</SelectItem>
          <SelectItem value="false">Hide filtered rows completely</SelectItem>
        </SelectContent>
      </Select>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Plus } from 'lucide-vue-next'
import { ref, watch, withDefaults } from 'vue'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import FilterCard, { type FilterConfig } from './FilterCard.vue'

interface Props {
  inputHeaders: string[]
  filters?: FilterConfig[]
  showDimmed?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  filters: () => [],
  showDimmed: true
})

const emit = defineEmits<{
  'filters-changed': [config: { enabled: boolean; showDimmed: boolean; filters: FilterConfig[] }]
}>()

// Use values from props
const showFilteredRowsDimmed = ref(props.showDimmed ? 'true' : 'false')
const filters = ref<FilterConfig[]>([...props.filters])

// Generate unique filter ID
function generateFilterId(): string {
  return `filter-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
}

// Add a new filter
function addFilter() {
  const newFilter: FilterConfig = {
    id: generateFilterId(),
    mode: 'include',
    column: 'all',
    term: '',
    caseSensitive: false,
  }
  filters.value.push(newFilter)
  emitFiltersChanged()
}

// Remove a filter
function removeFilter(id: string) {
  const index = filters.value.findIndex((f) => f.id === id)
  if (index !== -1) {
    filters.value.splice(index, 1)
    emitFiltersChanged()
  }
}

// Update a filter
function updateFilter(id: string, updates: Partial<FilterConfig>) {
  const filter = filters.value.find((f) => f.id === id)
  if (filter) {
    Object.assign(filter, updates)
    emitFiltersChanged()
  }
}

// Emit filters changed event
function emitFiltersChanged() {
  const hasFilters = filters.value.length > 0
  emit('filters-changed', {
    enabled: hasFilters,
    showDimmed: showFilteredRowsDimmed.value === 'true',
    filters: filters.value,
  })
}

// Watch for changes to emit events
watch([showFilteredRowsDimmed], emitFiltersChanged)
</script>
