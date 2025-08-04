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
        <!-- Main content area - visual preview -->
        <div class="flex flex-col h-full p-6">
          <!-- Intro line -->
          <p class="text-muted-foreground text-center mb-6">
            This free online tool splits dance competition registrations into groups with bib
            numbers so you don't have to figure it out manually.
          </p>

          <!-- Two-column preview with more data -->
          <div class="flex-1 flex">
            <div class="flex gap-4 max-w-6xl mx-auto flex-wrap">
              <!-- Input preview -->
              <div class="space-y-4">
                <h3 class="text-lg font-semibold text-foreground">Input</h3>
                <div class="flex-1 flex items-center gap-4">
                  <div class="bg-card border rounded-lg p-4 min-w-max">
                    <div class="text-sm font-medium text-muted-foreground mb-3">Your CSV file</div>
                    <div class="grid grid-cols-5 gap-1 text-xs min-w-max">
                      <div class="bg-muted px-2 py-1 rounded font-medium whitespace-nowrap">
                        First Name
                      </div>
                      <div class="bg-muted px-2 py-1 rounded font-medium whitespace-nowrap">
                        Last Name
                      </div>
                      <div class="bg-muted px-2 py-1 rounded font-medium whitespace-nowrap">
                        Code
                      </div>
                      <div class="bg-muted px-2 py-1 rounded font-medium whitespace-nowrap">
                        Location
                      </div>
                      <div class="bg-muted px-2 py-1 rounded font-medium whitespace-nowrap">
                        Registered
                      </div>

                      <div class="px-2 whitespace-nowrap">Emma</div>
                      <div class="px-2 whitespace-nowrap">MacDonald</div>
                      <div class="px-2 whitespace-nowrap">X08</div>
                      <div class="px-2 whitespace-nowrap">Glasgow</div>
                      <div class="px-2 whitespace-nowrap">Jan 15</div>

                      <div class="px-2 whitespace-nowrap">James</div>
                      <div class="px-2 whitespace-nowrap">Campbell</div>
                      <div class="px-2 whitespace-nowrap">X10</div>
                      <div class="px-2 whitespace-nowrap">Toronto</div>
                      <div class="px-2 whitespace-nowrap">Jan 22</div>

                      <div class="px-2 whitespace-nowrap">Isla</div>
                      <div class="px-2 whitespace-nowrap">Fraser</div>
                      <div class="px-2 whitespace-nowrap">X09</div>
                      <div class="px-2 whitespace-nowrap">Melbourne</div>
                      <div class="px-2 whitespace-nowrap">Feb 03</div>

                      <div class="px-2 whitespace-nowrap">Connor</div>
                      <div class="px-2 whitespace-nowrap">McLeod</div>
                      <div class="px-2 whitespace-nowrap">X11</div>
                      <div class="px-2 whitespace-nowrap">Edinburgh</div>
                      <div class="px-2 whitespace-nowrap">Feb 12</div>

                      <div class="px-2 whitespace-nowrap">Sophie</div>
                      <div class="px-2 whitespace-nowrap">Stewart</div>
                      <div class="px-2 whitespace-nowrap">X12</div>
                      <div class="px-2 whitespace-nowrap">Vancouver</div>
                      <div class="px-2 whitespace-nowrap">Feb 18</div>

                      <div class="px-2 whitespace-nowrap">Hamish</div>
                      <div class="px-2 whitespace-nowrap">Murray</div>
                      <div class="px-2 whitespace-nowrap">X07</div>
                      <div class="px-2 whitespace-nowrap">Sydney</div>
                      <div class="px-2 whitespace-nowrap">Mar 05</div>

                      <div class="px-2 whitespace-nowrap">Fiona</div>
                      <div class="px-2 whitespace-nowrap">Sinclair</div>
                      <div class="px-2 whitespace-nowrap">X13</div>
                      <div class="px-2 whitespace-nowrap">Aberdeen</div>
                      <div class="px-2 whitespace-nowrap">Mar 14</div>

                      <div class="px-2 whitespace-nowrap">Liam</div>
                      <div class="px-2 whitespace-nowrap">Robertson</div>
                      <div class="px-2 whitespace-nowrap">X06</div>
                      <div class="px-2 whitespace-nowrap">Calgary</div>
                      <div class="px-2 whitespace-nowrap">Mar 20</div>
                    </div>
                  </div>

                  <!-- Arrow -->
                  <div class="flex-shrink-0 text-muted-foreground">
                    <ChevronRight class="h-8 w-8" />
                  </div>
                </div>
              </div>

              <!-- Output preview -->
              <div class="space-y-4">
                <h3 class="text-lg font-semibold text-foreground">Output</h3>
                <div class="bg-card border rounded-lg p-4 space-y-4 min-w-max">
                  <div class="text-sm font-medium text-muted-foreground">
                    Organized by age groups with bib numbers
                  </div>

                  <!-- Premier 6-8 Years -->
                  <div class="space-y-2">
                    <div
                      class="px-3 py-0.5 bg-primary/20 text-primary font-bold text-sm rounded-md inline-block"
                    >
                      Premier 6-8 Years
                    </div>
                    <div class="grid grid-cols-4 gap-1 text-xs min-w-max">
                      <div
                        class="px-2 py-0.5 bg-primary/20 text-primary font-bold rounded whitespace-nowrap"
                      >
                        101
                      </div>
                      <div class="px-2 whitespace-nowrap">Liam</div>
                      <div class="px-2 whitespace-nowrap">Robertson</div>
                      <div class="px-2 whitespace-nowrap">Calgary</div>
                      <div
                        class="px-2 py-0.5 bg-primary/20 text-primary font-bold rounded whitespace-nowrap"
                      >
                        103
                      </div>
                      <div class="px-2 whitespace-nowrap">Hamish</div>
                      <div class="px-2 whitespace-nowrap">Murray</div>
                      <div class="px-2 whitespace-nowrap">Sydney</div>
                      <div
                        class="px-2 py-0.5 bg-primary/20 text-primary font-bold rounded whitespace-nowrap"
                      >
                        108
                      </div>
                      <div class="px-2 whitespace-nowrap">Emma</div>
                      <div class="px-2 whitespace-nowrap">MacDonald</div>
                      <div class="px-2 whitespace-nowrap">Glasgow</div>
                    </div>
                  </div>

                  <!-- Premier 9-11 Years -->
                  <div class="space-y-2">
                    <div
                      class="px-3 py-0.5 bg-primary/20 text-primary font-bold text-sm rounded-md inline-block"
                    >
                      Premier 9-11 Years
                    </div>
                    <div class="grid grid-cols-4 gap-1 text-xs min-w-max">
                      <div
                        class="px-2 py-0.5 bg-primary/20 text-primary font-bold rounded whitespace-nowrap"
                      >
                        105
                      </div>
                      <div class="px-2 whitespace-nowrap">Connor</div>
                      <div class="px-2 whitespace-nowrap">McLeod</div>
                      <div class="px-2 whitespace-nowrap">Edinburgh</div>
                      <div
                        class="px-2 py-0.5 bg-primary/20 text-primary font-bold rounded whitespace-nowrap"
                      >
                        106
                      </div>
                      <div class="px-2 whitespace-nowrap">Isla</div>
                      <div class="px-2 whitespace-nowrap">Fraser</div>
                      <div class="px-2 whitespace-nowrap">Melbourne</div>
                      <div
                        class="px-2 py-0.5 bg-primary/20 text-primary font-bold rounded whitespace-nowrap"
                      >
                        107
                      </div>
                      <div class="px-2 whitespace-nowrap">James</div>
                      <div class="px-2 whitespace-nowrap">Campbell</div>
                      <div class="px-2 whitespace-nowrap">Toronto</div>
                    </div>
                  </div>

                  <!-- Premier 12-13 Years -->
                  <div class="space-y-2">
                    <div
                      class="px-3 py-0.5 bg-primary/20 text-primary font-bold text-sm rounded-md inline-block"
                    >
                      Premier 12-13 Years
                    </div>
                    <div class="grid grid-cols-4 gap-1 text-xs min-w-max">
                      <div
                        class="px-2 py-0.5 bg-primary/20 text-primary font-bold rounded whitespace-nowrap"
                      >
                        102
                      </div>
                      <div class="px-2 whitespace-nowrap">Fiona</div>
                      <div class="px-2 whitespace-nowrap">Sinclair</div>
                      <div class="px-2 whitespace-nowrap">Aberdeen</div>
                      <div
                        class="px-2 py-0.5 bg-primary/20 text-primary font-bold rounded whitespace-nowrap"
                      >
                        104
                      </div>
                      <div class="px-2 whitespace-nowrap">Sophie</div>
                      <div class="px-2 whitespace-nowrap">Stewart</div>
                      <div class="px-2 whitespace-nowrap">Vancouver</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Privacy banner at bottom -->
          <div class="mt-8 p-4 bg-primary/10 border border-primary/20 rounded-lg">
            <div class="flex items-start gap-3">
              <Shield class="h-5 w-5 text-primary shrink-0" />
              <div>
                <h4 class="font-semibold text-foreground text-sm mb-1">Privacy First</h4>
                <p class="text-sm text-muted-foreground">
                  All processing happens locally. Your data never leaves your computer. It is never
                  sent or shared in any capacity.
                </p>
              </div>
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
                    <p class="font-bold text-sidebar-foreground">You input spreadsheets</p>
                    <div class="text-sm text-sidebar-foreground/70 space-y-1">
                      <p>
                        Choose CSV file exported from:
                        <a
                          href="http://eventry.net"
                          target="_blank"
                          rel="noopener noreferrer"
                          class="inline-flex items-center font-bold gap-1 text-primary hover:text-primary/80 transition-colors"
                        >
                          eventry.net <ExternalLink class="h-3 w-3" />
                        </a>
                        or
                        <a
                          href="https://hdcomps.com"
                          target="_blank"
                          rel="noopener noreferrer"
                          class="inline-flex items-center font-bold gap-1 text-primary hover:text-primary/80 transition-colors"
                        >
                          HDComps.com <ExternalLink class="h-3 w-3" />
                        </a>
                        or any other dancer registration system
                      </p>
                    </div>
                  </div>
                </div>

                <div class="flex items-start gap-3">
                  <div
                    class="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0 mt-0.5"
                  >
                    <span class="text-primary font-bold text-sm">2</span>
                  </div>
                  <div>
                    <p class="font-bold text-sidebar-foreground">It groups automatically</p>
                    <p class="text-sm text-sidebar-foreground/70">
                      Algorithm splits dancers into optimal age groups, which can you adjust if
                      needed
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
                    <p class="font-bold text-sidebar-foreground">It numbers bibs</p>
                    <p class="text-sm text-sidebar-foreground/70">
                      Reverse registration order numbering with automatic and customizable number
                      assignment
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
                    <p class="font-bold text-sidebar-foreground">You export results</p>
                    <p class="text-sm text-sidebar-foreground/70">
                      Ready for ScotDance.app or paper programs
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </template>

        <template #footer>
          <div class="space-y-3">
            <div class="text-center text-sm text-sidebar-foreground/70">
              Drag & drop your CSV file anywhere or
            </div>
            <Button
              size="lg"
              :disabled="isLoadingInputFile"
              @click="$emit('choose-file')"
              class="w-full"
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
        </template>
      </SettingsPane>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Button } from '@/components/ui/button'
import SettingsPane from '@/components/SettingsPane.vue'
import { useDarkMode } from '@/composables/useDarkMode'
import { Sun, Moon, Shield, ChevronRight, ExternalLink } from 'lucide-vue-next'

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
