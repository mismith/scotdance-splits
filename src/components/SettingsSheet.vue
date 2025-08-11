<template>
  <!-- Modal overlay -->
  <Transition
    enter-active-class="transition-opacity duration-300"
    enter-from-class="opacity-0"
    enter-to-class="opacity-100"
    leave-active-class="transition-opacity duration-300"
    leave-from-class="opacity-100"
    leave-to-class="opacity-0"
  >
    <div
      v-if="open"
      class="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      @click.self="$emit('update:open', false)"
    >
      <!-- Modal content -->
      <div class="bg-background border rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] flex flex-col">
        <!-- Header -->
        <div class="flex-shrink-0 p-6 border-b">
          <div class="flex items-center justify-between">
            <div>
              <h2 class="text-xl font-semibold">{{ title }}</h2>
              <p v-if="description" class="text-sm text-muted-foreground mt-1">
                {{ description }}
              </p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              @click="$emit('update:open', false)"
              class="w-8 h-8 p-0"
            >
              <X class="h-4 w-4" />
            </Button>
          </div>
        </div>

        <!-- Content -->
        <div class="flex-1 overflow-y-auto p-6">
          <div class="grid lg:grid-cols-2 gap-6">
            <!-- Left side: Table preview -->
            <div class="space-y-4">
              <h3 class="text-sm font-medium">Data Preview</h3>
              <div class="border rounded-lg">
                <HotTable
                  v-if="previewData?.length"
                  :data="previewData"
                  :settings="{
                    colHeaders: store.hasHeaderRow ? store.inputHeaders : true,
                    readOnly: true,
                    height: 300,
                  }"
                />
              </div>
            </div>

            <!-- Right side: Settings -->
            <div class="space-y-4">
              <slot name="settings" />
            </div>
          </div>
        </div>

        <!-- Footer -->
        <div class="flex-shrink-0 p-6 border-t flex justify-end gap-3">
          <Button variant="outline" @click="$emit('update:open', false)">
            Cancel
          </Button>
          <Button @click="$emit('save')">
            Save Changes
          </Button>
        </div>
      </div>
    </div>
  </Transition>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useAppStore } from '@/stores/app'
import { Button } from '@/components/ui/button'
import { X } from 'lucide-vue-next'
import HotTable from '@/components/HotTable.vue'

interface Props {
  open: boolean
  title: string
  description?: string
}

defineProps<Props>()

defineEmits<{
  'update:open': [value: boolean]
  save: []
}>()

const store = useAppStore()

// Preview a subset of data
const previewData = computed(() => {
  return store.inputCSV?.slice(0, 10) || []
})
</script>