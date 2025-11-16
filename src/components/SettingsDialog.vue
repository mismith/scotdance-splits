<template>
  <Dialog :open="open" @update:open="$emit('update:open', $event)">
    <DialogContent
      :class="cn('max-w-[calc(100vw-2rem)] sm:max-w-[calc(100vw-4rem)] w-full max-h-[90vh] p-0 gap-0 grid-rows-[auto_1fr_auto]', props.class)"
      :show-close-button="false"
    >
      <!-- Header -->
      <div class="flex-shrink-0 p-6 border-b">
        <div class="flex items-center justify-between">
          <DialogHeader class="flex-1 gap-1">
            <DialogTitle class="text-xl">{{ title }}</DialogTitle>
            <DialogDescription v-if="description" class="mt-1">
              {{ description }}
            </DialogDescription>
          </DialogHeader>
          <DialogClose as-child>
            <Button variant="ghost" size="sm" class="w-8 h-8 p-0 flex-shrink-0">
              <X class="h-4 w-4" />
            </Button>
          </DialogClose>
        </div>
      </div>

      <!-- Content -->
      <div class="flex-1 p-6">
        <div class="flex flex-col xl:flex-row gap-6 min-h-0">
          <!-- Preview content -->
          <div class="flex flex-col gap-4 flex-1 min-h-0 min-w-0 overflow-hidden">
            <div class="flex items-center justify-between">
              <h3 class="text-sm font-medium">Preview</h3>
              <Button
                v-if="sidebarCollapsed"
                variant="outline"
                size="sm"
                @click="$emit('update:sidebar-collapsed', false)"
                class="hidden lg:flex"
              >
                Show settings
              </Button>
            </div>
            <div class="overflow-auto flex-1 min-h-0">
              <slot name="preview">
                <div class="border rounded-lg p-4 bg-muted/20">
                  <p class="text-sm text-muted-foreground">No preview available</p>
                </div>
              </slot>
            </div>
          </div>

          <!-- Settings sidebar -->
          <div class="flex-shrink-0 overflow-y-auto">
            <TransitionExpand orientation="horizontal">
              <div v-if="!sidebarCollapsed" class="flex flex-col gap-4 w-full xl:w-80">
                <div class="flex items-center justify-between lg:hidden">
                  <h3 class="text-sm font-medium">Settings</h3>
                </div>
                <div class="items-center justify-between hidden lg:flex">
                  <h3 class="text-sm font-medium">Settings</h3>
                  <Button variant="ghost" size="sm" @click="$emit('update:sidebar-collapsed', true)">
                    Hide
                  </Button>
                </div>
                <slot name="settings" />
              </div>
            </TransitionExpand>
          </div>
        </div>
      </div>

      <!-- Footer -->
      <DialogFooter class="flex-shrink-0 p-6 border-t gap-3">
        <Button variant="outline" @click="$emit('update:open', false)"> Cancel </Button>
        <Button @click="$emit('save')"> Save Changes </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>

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
import TransitionExpand from '@/components/TransitionExpand.vue'
import { cn } from '@/lib/utils'
import type { HTMLAttributes } from 'vue'

interface Props {
  open: boolean
  title: string
  description?: string
  sidebarCollapsed?: boolean
  class?: HTMLAttributes['class']
}

const props = withDefaults(defineProps<Props>(), {
  sidebarCollapsed: false,
  class: undefined,
})

defineEmits<{
  'update:open': [value: boolean]
  'update:sidebar-collapsed': [value: boolean]
  save: []
}>()
</script>
