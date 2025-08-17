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
            <!-- Left side: Preview content -->
            <div class="space-y-4">
              <slot name="preview">
                <h3 class="text-sm font-medium">Preview</h3>
                <div class="border rounded-lg p-4 bg-muted/20">
                  <p class="text-sm text-muted-foreground">No preview available</p>
                </div>
              </slot>
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
import { Button } from '@/components/ui/button'
import { X } from 'lucide-vue-next'

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

</script>