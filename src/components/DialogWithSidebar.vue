<script setup lang="ts">
import { X } from 'lucide-vue-next'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { cn } from '@/lib/utils'

interface Props {
  open: boolean
  showSidebar: boolean
  title: string
  description?: string
}

const props = defineProps<Props>()

const emit = defineEmits<{
  'update:open': [value: boolean]
  'update:show-sidebar': [value: boolean]
}>()

function closeDialog() {
  emit('update:open', false)
}
</script>

<template>
  <Dialog :open="open" @update:open="$emit('update:open', $event)">
    <DialogContent :class="cn('p-0 gap-0 h-full')">
      <!-- Header -->
      <div class="flex-shrink-0 p-4 pb-0 flex items-center justify-between">
        <DialogHeader class="flex-1 gap-1">
          <DialogTitle class="text-xl">{{ title }}</DialogTitle>
          <DialogDescription v-if="description" class="mt-1">
            {{ description }}
          </DialogDescription>
        </DialogHeader>
        <DialogClose as-child class="self-start">
          <Button variant="ghost" size="sm" class="w-8 h-8 p-0 flex-shrink-0">
            <X class="h-4 w-4" />
          </Button>
        </DialogClose>
      </div>

      <!-- Content -->
      <div class="flex-1 p-4 min-h-0 overflow-hidden">
        <div class="flex flex-col lg:flex-row h-full min-h-0">
          <!-- Main content -->
          <div class="flex flex-col gap-4 flex-1 min-h-0 min-w-0 transition-all">
            <div class="overflow-auto flex-1 min-h-0">
              <slot />
            </div>
          </div>

          <!-- Settings sidebar -->
          <div
            class="flex flex-col gap-4 min-h-0 overflow-hidden transition-all"
            :class="
              showSidebar
                ? 'w-full max-h-[50%] lg:max-h-none lg:w-80 opacity-100 mt-6 lg:mt-0 lg:ml-6'
                : 'max-h-0 lg:max-h-none lg:w-0 opacity-0'
            "
          >
            <div class="w-full lg:w-80 overflow-y-auto">
              <slot name="sidebar" />
            </div>
          </div>
        </div>
      </div>

      <!-- Footer -->
      <DialogFooter class="p-4 pt-0 flex-shrink-0">
        <Button variant="outline" @click="$emit('update:show-sidebar', !showSidebar)">
          {{ showSidebar ? 'Hide' : 'Show' }} settings
        </Button>
        <slot name="submit" :close="closeDialog" />
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>
