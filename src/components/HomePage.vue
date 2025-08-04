<template>
  <div class="h-full flex flex-col">
    <!-- Header with logo and dark mode toggle -->
    <div class="border-b bg-primary text-primary-foreground shadow-sm">
      <div class="px-6 py-4">
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-3">
            <img src="/touchicon.png" alt="Splits Logo" class="w-8 h-8" />
            <h1 class="text-2xl font-bold text-primary-foreground">Splits</h1>
          </div>

          <Button
            variant="ghost"
            size="sm"
            @click="toggleDarkMode"
            class="w-9 h-9 p-0 hover:bg-primary-foreground/10"
            :title="isDark ? 'Switch to light mode' : 'Switch to dark mode'"
          >
            <Sun v-if="isDark" class="h-4 w-4" />
            <Moon v-else class="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>

    <!-- Main content using SettingsPane layout -->
    <div class="flex-1">
      <SettingsPane>
        <!-- Main content area - welcome message -->
        <div class="flex flex-col justify-center items-center h-full space-y-8 p-8">
          <div class="text-center space-y-6 max-w-2xl">
            <div class="space-y-4">
              <h2 class="text-3xl font-bold text-foreground">Welcome to Splits</h2>
              <p class="text-lg text-muted-foreground">
                Take your list of dancers/registrations and automatically group them into age
                categories with assigned bib numbers. Export for upload into ScotDance.app or use
                for your paper programs.
              </p>
            </div>
          </div>

          <!-- Upload action -->
          <div class="space-y-4">
            <div class="text-center space-y-3">
              <div class="text-2xl font-semibold text-foreground">Ready to get started?</div>
              <div class="text-muted-foreground">
                Drag your CSV file anywhere on this page or click to browse
              </div>
            </div>

            <div class="flex justify-center">
              <Button
                size="lg"
                :disabled="isLoadingInputFile"
                @click="$emit('choose-file')"
                class="px-8 py-3 text-lg"
              >
                <span v-if="isLoadingInputFile" class="flex items-center gap-2">
                  <div
                    class="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"
                  ></div>
                  Processing...
                </span>
                <span v-else>Choose CSV File</span>
              </Button>
            </div>
          </div>
        </div>

        <template #settings>
          <div class="space-y-6">
            <div>
              <h3 class="text-lg font-semibold text-sidebar-foreground mb-4">How it works</h3>
              <div class="space-y-4">
                <div class="flex items-start gap-3">
                  <div
                    class="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0 mt-0.5"
                  >
                    <span class="text-primary font-bold text-sm">1</span>
                  </div>
                  <div>
                    <p class="font-medium text-sidebar-foreground">Input spreadsheet</p>
                    <p class="text-sm text-sidebar-foreground/70">
                      Upload CSV from eventry.net or HDComps.com
                    </p>
                  </div>
                </div>

                <div class="flex items-start gap-3">
                  <div
                    class="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0 mt-0.5"
                  >
                    <span class="text-primary font-bold text-sm">2</span>
                  </div>
                  <div>
                    <p class="font-medium text-sidebar-foreground">Automatic grouping</p>
                    <p class="text-sm text-sidebar-foreground/70">
                      Algorithm splits dancers into optimal age groups
                    </p>
                  </div>
                </div>

                <div class="flex items-start gap-3">
                  <div
                    class="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0 mt-0.5"
                  >
                    <span class="text-primary font-bold text-sm">3</span>
                  </div>
                  <div>
                    <p class="font-medium text-sidebar-foreground">Assign bib numbers</p>
                    <p class="text-sm text-sidebar-foreground/70">
                      Reverse registration order numbering
                    </p>
                  </div>
                </div>

                <div class="flex items-start gap-3">
                  <div
                    class="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0 mt-0.5"
                  >
                    <span class="text-primary font-bold text-sm">4</span>
                  </div>
                  <div>
                    <p class="font-medium text-sidebar-foreground">Export results</p>
                    <p class="text-sm text-sidebar-foreground/70">
                      Ready for ScotDance.app or paper programs
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div class="p-4 bg-primary/10 border border-primary/20 rounded-lg">
              <div class="flex items-start gap-3">
                <Shield class="h-5 w-5 text-primary shrink-0" />
                <div>
                  <h4 class="font-semibold text-sidebar-foreground text-sm mb-1">Privacy First</h4>
                  <p class="text-sm text-sidebar-foreground/80">
                    All processing happens locally on your machine. Your data never leaves your
                    computer.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </template>
      </SettingsPane>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Button } from '@/components/ui/button'
import SettingsPane from '@/components/SettingsPane.vue'
import { useDarkMode } from '@/composables/useDarkMode'
import { Sun, Moon, Shield } from 'lucide-vue-next'

interface Props {
  isLoadingInputFile?: boolean
  inputError?: string
}

defineProps<Props>()

const emit = defineEmits<{
  'file-selected': [file: File]
  'error-dismiss': []
  'choose-file': []
}>()

// Dark mode
const { isDark, toggle } = useDarkMode()
function toggleDarkMode() {
  console.log('Toggling dark mode')
  toggle()
}

// Constants
const INPUT_FILE_ACCEPT = 'text/csv'
</script>
