<template>
  <div class="h-full flex flex-col">
    <!-- Header with dark mode toggle -->
    <div class="border-b bg-card shadow-sm">
      <div class="px-6 py-4">
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-4">
            <h1 class="text-2xl font-bold text-foreground">Splits</h1>
            <span class="text-muted-foreground">Highland Dance Competition Organizer</span>
          </div>
          
          <Button
            variant="ghost"
            size="sm"
            @click="toggleDarkMode"
            class="w-9 h-9 p-0"
            :title="isDark ? 'Switch to light mode' : 'Switch to dark mode'"
          >
            <span v-if="isDark" class="text-lg">☀️</span>
            <span v-else class="text-lg">🌙</span>
          </Button>
        </div>
      </div>
    </div>

    <!-- Main content area -->
    <div class="flex-1 flex flex-col justify-center items-center gap-8 p-8">
      <!-- App description -->
      <div class="text-center space-y-6 max-w-4xl">
        <div class="space-y-4">
          <p class="text-lg text-foreground">
            Take your list of dancers/registrations and automatically group them into age categories with assigned bib numbers.
            Export for upload into ScotDance.app or use for your paper programs.
          </p>
          
          <div class="grid md:grid-cols-2 gap-4 text-left max-w-3xl mx-auto">
            <div class="space-y-3">
              <div class="flex items-start gap-3">
                <div class="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span class="text-primary font-bold text-sm">1</span>
                </div>
                <div>
                  <p class="font-medium">Input spreadsheet</p>
                  <p class="text-sm text-muted-foreground">Upload CSV from eventry.net or HDComps.com</p>
                </div>
              </div>
              
              <div class="flex items-start gap-3">
                <div class="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span class="text-primary font-bold text-sm">2</span>
                </div>
                <div>
                  <p class="font-medium">Automatic grouping</p>
                  <p class="text-sm text-muted-foreground">Algorithm splits dancers into optimal age groups</p>
                </div>
              </div>
            </div>
            
            <div class="space-y-3">
              <div class="flex items-start gap-3">
                <div class="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span class="text-primary font-bold text-sm">3</span>
                </div>
                <div>
                  <p class="font-medium">Assign bib numbers</p>
                  <p class="text-sm text-muted-foreground">Reverse registration order numbering</p>
                </div>
              </div>
              
              <div class="flex items-start gap-3">
                <div class="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span class="text-primary font-bold text-sm">4</span>
                </div>
                <div>
                  <p class="font-medium">Export results</p>
                  <p class="text-sm text-muted-foreground">Ready for ScotDance.app or paper programs</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Upload action -->
      <div class="space-y-4">
        <div class="text-center space-y-3">
          <div class="text-2xl font-semibold text-foreground">Ready to get started?</div>
          <div class="text-muted-foreground">Drag your CSV file anywhere on this page or click to browse</div>
        </div>
        
        <div class="flex justify-center">
          <Button 
            size="lg"
            :disabled="isLoadingInputFile"
            @click="$emit('choose-file')"
            class="px-8 py-3 text-lg"
          >
            <span v-if="isLoadingInputFile" class="flex items-center gap-2">
              <div class="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
              Processing...
            </span>
            <span v-else>Choose CSV File</span>
          </Button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Button } from '@/components/ui/button';
import { useDarkMode } from '@/composables/useDarkMode';

interface Props {
  isLoadingInputFile?: boolean;
  inputError?: string;
}

defineProps<Props>();

const emit = defineEmits<{
  'file-selected': [file: File];
  'error-dismiss': [];
  'choose-file': [];
}>();

// Dark mode
const { isDark, toggle: toggleDarkMode } = useDarkMode();

// Constants
const INPUT_FILE_ACCEPT = "text/csv";
</script>