<template>
  <div
    ref="dropZoneRef"
    class="flex flex-col justify-center items-center h-full relative gap-4 p-8"
  >
    <!-- Drop zone overlay -->
    <svg
      v-show="isOverDropZone"
      preserveAspectRatio="none"
      class="absolute inset-8 w-[calc(100%-4rem)] h-[calc(100%-4rem)] pointer-events-none"
    >
      <rect width="100%" height="100%" class="fill-none stroke-black stroke-[0.25rem] stroke-dashed animate-pulse" />
    </svg>

    <!-- Content -->
    <div class="flex-1 flex flex-col justify-center text-center space-y-4">
      <div class="text-lg">
        Take your list of dancers/registrations and automatically group them into age categories with assigned bib numbers.
        You can then export for upload into ScotDance.app or use them in your own paper program.
      </div>
      <ul class="text-left space-y-2 max-w-2xl">
        <li>• input = spreadsheet of registered dancers (e.g. from eventry.net or HDComps.com)</li>
        <li>• automatically split dancers in age groups - take away the guess work and the math, let this algorithm do the work for you</li>
        <li>• assign bib numbers to dancers based on reverse registration order</li>
        <li>• output = spreadsheet you can upload into ScotDance.app, or use for you paper programs</li>
      </ul>
    </div>

    <!-- Upload area -->
    <div class="flex-1 flex flex-col justify-center items-center text-center space-y-2">
      <div class="text-xl">Drag your CSV file here</div>
      <small class="text-muted-foreground">or</small>
      <Button 
        :disabled="isLoading"
        @click="fileInputRef?.click()"
        class="relative"
      >
        <span v-if="isLoading">Loading...</span>
        <span v-else>Choose file</span>
        <input
          ref="fileInputRef"
          type="file"
          :accept="accept"
          @change="handleFileChange"
          class="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        />
      </Button>
    </div>

    <!-- Error display -->
    <div v-if="error" class="fixed bottom-4 right-4 bg-destructive text-destructive-foreground p-4 rounded-md shadow-lg max-w-md">
      <div class="flex items-center gap-2">
        <span class="text-sm">⚠️</span>
        <span>{{ error }}</span>
        <button @click="$emit('error-dismiss')" class="ml-auto text-lg">&times;</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useDropZone } from '@vueuse/core';
import { Button } from '@/components/ui/button';

interface Props {
  accept?: string;
  isLoading?: boolean;
  error?: string;
}

const props = withDefaults(defineProps<Props>(), {
  accept: 'text/csv',
  isLoading: false,
});

const emit = defineEmits<{
  'file-selected': [file: File];
  'error-dismiss': [];
}>();

const dropZoneRef = ref<HTMLElement>();
const fileInputRef = ref<HTMLInputElement>();

const { isOverDropZone } = useDropZone(dropZoneRef, {
  onDrop(files) {
    emit('error-dismiss');
    if (files?.length === 1 && files[0].type === props.accept) {
      emit('file-selected', files[0]);
    } else {
      // Error will be handled by parent component
    }
  },
});

function handleFileChange(event: Event) {
  const target = event.target as HTMLInputElement;
  const file = target.files?.[0];
  if (file) {
    emit('file-selected', file);
  }
}
</script>