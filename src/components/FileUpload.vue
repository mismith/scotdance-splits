<script setup lang="ts">
import { useDropZone } from '@vueuse/core'
import { ref } from 'vue'
import { Button } from '@/components/ui/button'

interface Props {
  accept?: string
  isLoading?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  accept: 'text/csv',
  isLoading: false,
})

const emit = defineEmits<{
  'file-selected': [file: File]
  'file-rejected': [message: string]
}>()

const dropZoneRef = ref<HTMLElement>()
const fileInputRef = ref<HTMLInputElement>()

const { isOverDropZone } = useDropZone(dropZoneRef, {
  onDrop(files) {
    if (!files?.length) return
    if (files.length > 1) {
      emit('file-rejected', 'Please drop a single CSV file')
    } else if (files[0].type !== props.accept) {
      emit('file-rejected', 'Only CSV files are supported')
    } else {
      emit('file-selected', files[0])
    }
  },
})

function handleFileChange(event: Event) {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]
  if (file) {
    if (file.type !== props.accept) {
      emit('file-rejected', 'Only CSV files are supported')
    } else {
      emit('file-selected', file)
    }
  }
}
</script>

<template>
  <div
    ref="dropZoneRef"
    class="h-full w-full relative transition-colors duration-200"
    :class="{ 'bg-primary/5': isOverDropZone }"
  >
    <!-- Drop zone overlay -->
    <div
      v-show="isOverDropZone"
      class="fixed inset-4 border-2 border-dashed border-primary bg-background/50 backdrop-blur-md rounded-4xl pointer-events-none z-50"
    >
      <div class="w-full h-full flex items-center justify-center">
        <div class="text-5xl font-semibold text-primary animate-pulse">Drop your CSV file here</div>
      </div>
    </div>

    <!-- Content slot -->
    <slot :choose-file="() => fileInputRef?.click()">
      <!-- Default upload content if no slot provided -->
      <div class="h-full flex items-center justify-center">
        <div class="text-center space-y-4 max-w-md">
          <div class="text-5xl font-semibold text-foreground">Ready to get started?</div>
          <div class="text-muted-foreground">Drag your CSV file here or click to browse</div>

          <Button
            size="lg"
            :disabled="isLoading"
            @click="fileInputRef?.click()"
            class="relative px-8 py-3 text-lg"
          >
            <span v-if="isLoading" class="flex items-center gap-2">
              <div
                class="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"
              ></div>
              Processing...
            </span>
            <span v-else>Choose CSV File</span>
          </Button>
        </div>
      </div>
    </slot>

    <!-- Hidden file input -->
    <input
      ref="fileInputRef"
      type="file"
      :accept="accept"
      @change="handleFileChange"
      class="hidden"
    />
  </div>
</template>
