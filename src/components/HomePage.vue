<template>
  <div class="h-full flex flex-col">
    <AppHeader />

    <!-- Main content using SettingsPane layout -->
    <div class="flex-1">
      <SettingsPane>
        <!-- Main content area - visual preview -->
        <div class="flex flex-col h-full p-6">
          <!-- Stylish intro -->
          <div class="text-center mb-8">
            <p class="text-xl md:text-2xl font-light text-foreground">
              This <span class="font-semibold text-primary">free online tool</span> splits dance
              competition registrations into <strong class="font-bold">age groups</strong> with
              <strong class="font-bold">bib numbers</strong>
              <br />
              <span class="text-base text-muted-foreground font-normal mt-1 inline-block"
                >(so you don't have to figure it out manually).</span
              >
            </p>
          </div>

          <!-- Two-column preview with more data -->
          <div class="flex-1 flex">
            <div class="flex gap-4 max-w-6xl mx-auto flex-wrap">
              <!-- Input preview -->
              <div class="space-y-4">
                <h3
                  class="text-lg text-center pr-12 font-semibold text-foreground animate-fade-in-up opacity-0 [animation-delay:200ms]!"
                >
                  Input
                </h3>
                <div class="flex-1 flex items-center gap-4">
                  <div
                    class="bg-card border rounded-lg p-4 min-w-max animate-fade-in-up opacity-0 [animation-delay:100ms]!"
                  >
                    <div
                      class="text-sm font-medium text-muted-foreground mb-3 animate-fade-in-up opacity-0 [animation-delay:300ms]!"
                    >
                      Your CSV file
                    </div>
                    <div class="grid grid-cols-5 gap-1 text-xs min-w-max">
                      <div
                        class="bg-muted px-2 py-1 rounded font-medium whitespace-nowrap animate-fade-in-up opacity-0 [animation-delay:400ms]!"
                      >
                        First Name
                      </div>
                      <div
                        class="bg-muted px-2 py-1 rounded font-medium whitespace-nowrap animate-fade-in-up opacity-0 [animation-delay:400ms]!"
                      >
                        Last Name
                      </div>
                      <div
                        class="bg-muted px-2 py-1 rounded font-medium whitespace-nowrap animate-fade-in-up opacity-0 [animation-delay:400ms]!"
                      >
                        Code
                      </div>
                      <div
                        class="bg-muted px-2 py-1 rounded font-medium whitespace-nowrap animate-fade-in-up opacity-0 [animation-delay:400ms]!"
                      >
                        Location
                      </div>
                      <div
                        class="bg-muted px-2 py-1 rounded font-medium whitespace-nowrap animate-fade-in-up opacity-0 [animation-delay:400ms]!"
                      >
                        Registered
                      </div>

                      <div
                        class="px-2 whitespace-nowrap animate-fade-in-up opacity-0 [animation-delay:500ms]!"
                      >
                        Emma
                      </div>
                      <div
                        class="px-2 whitespace-nowrap animate-fade-in-up opacity-0 [animation-delay:500ms]!"
                      >
                        MacDonald
                      </div>
                      <div
                        class="px-2 whitespace-nowrap animate-fade-in-up opacity-0 [animation-delay:500ms]!"
                      >
                        X08
                      </div>
                      <div
                        class="px-2 whitespace-nowrap animate-fade-in-up opacity-0 [animation-delay:500ms]!"
                      >
                        Glasgow
                      </div>
                      <div
                        class="px-2 whitespace-nowrap animate-fade-in-up opacity-0 [animation-delay:500ms]!"
                      >
                        Jan 15
                      </div>

                      <div
                        class="px-2 whitespace-nowrap animate-fade-in-up opacity-0 [animation-delay:600ms]!"
                      >
                        James
                      </div>
                      <div
                        class="px-2 whitespace-nowrap animate-fade-in-up opacity-0 [animation-delay:600ms]!"
                      >
                        Campbell
                      </div>
                      <div
                        class="px-2 whitespace-nowrap animate-fade-in-up opacity-0 [animation-delay:600ms]!"
                      >
                        X10
                      </div>
                      <div
                        class="px-2 whitespace-nowrap animate-fade-in-up opacity-0 [animation-delay:600ms]!"
                      >
                        Toronto
                      </div>
                      <div
                        class="px-2 whitespace-nowrap animate-fade-in-up opacity-0 [animation-delay:600ms]!"
                      >
                        Jan 22
                      </div>

                      <div
                        class="px-2 whitespace-nowrap animate-fade-in-up opacity-0 [animation-delay:700ms]!"
                      >
                        Isla
                      </div>
                      <div
                        class="px-2 whitespace-nowrap animate-fade-in-up opacity-0 [animation-delay:700ms]!"
                      >
                        Fraser
                      </div>
                      <div
                        class="px-2 whitespace-nowrap animate-fade-in-up opacity-0 [animation-delay:700ms]!"
                      >
                        X09
                      </div>
                      <div
                        class="px-2 whitespace-nowrap animate-fade-in-up opacity-0 [animation-delay:700ms]!"
                      >
                        Melbourne
                      </div>
                      <div
                        class="px-2 whitespace-nowrap animate-fade-in-up opacity-0 [animation-delay:700ms]!"
                      >
                        Feb 03
                      </div>

                      <div
                        class="px-2 whitespace-nowrap animate-fade-in-up opacity-0 [animation-delay:800ms]!"
                      >
                        Connor
                      </div>
                      <div
                        class="px-2 whitespace-nowrap animate-fade-in-up opacity-0 [animation-delay:800ms]!"
                      >
                        McLeod
                      </div>
                      <div
                        class="px-2 whitespace-nowrap animate-fade-in-up opacity-0 [animation-delay:800ms]!"
                      >
                        X11
                      </div>
                      <div
                        class="px-2 whitespace-nowrap animate-fade-in-up opacity-0 [animation-delay:800ms]!"
                      >
                        Edinburgh
                      </div>
                      <div
                        class="px-2 whitespace-nowrap animate-fade-in-up opacity-0 [animation-delay:800ms]!"
                      >
                        Feb 12
                      </div>

                      <div
                        class="px-2 whitespace-nowrap animate-fade-in-up opacity-0 [animation-delay:900ms]!"
                      >
                        Sophie
                      </div>
                      <div
                        class="px-2 whitespace-nowrap animate-fade-in-up opacity-0 [animation-delay:900ms]!"
                      >
                        Stewart
                      </div>
                      <div
                        class="px-2 whitespace-nowrap animate-fade-in-up opacity-0 [animation-delay:900ms]!"
                      >
                        X12
                      </div>
                      <div
                        class="px-2 whitespace-nowrap animate-fade-in-up opacity-0 [animation-delay:900ms]!"
                      >
                        Vancouver
                      </div>
                      <div
                        class="px-2 whitespace-nowrap animate-fade-in-up opacity-0 [animation-delay:900ms]!"
                      >
                        Feb 18
                      </div>

                      <div
                        class="px-2 whitespace-nowrap animate-fade-in-up opacity-0 [animation-delay:1000ms]!"
                      >
                        Hamish
                      </div>
                      <div
                        class="px-2 whitespace-nowrap animate-fade-in-up opacity-0 [animation-delay:1000ms]!"
                      >
                        Murray
                      </div>
                      <div
                        class="px-2 whitespace-nowrap animate-fade-in-up opacity-0 [animation-delay:1000ms]!"
                      >
                        X07
                      </div>
                      <div
                        class="px-2 whitespace-nowrap animate-fade-in-up opacity-0 [animation-delay:1000ms]!"
                      >
                        Sydney
                      </div>
                      <div
                        class="px-2 whitespace-nowrap animate-fade-in-up opacity-0 [animation-delay:1000ms]!"
                      >
                        Mar 05
                      </div>

                      <div
                        class="px-2 whitespace-nowrap animate-fade-in-up opacity-0 [animation-delay:1100ms]!"
                      >
                        Fiona
                      </div>
                      <div
                        class="px-2 whitespace-nowrap animate-fade-in-up opacity-0 [animation-delay:1100ms]!"
                      >
                        Sinclair
                      </div>
                      <div
                        class="px-2 whitespace-nowrap animate-fade-in-up opacity-0 [animation-delay:1100ms]!"
                      >
                        X13
                      </div>
                      <div
                        class="px-2 whitespace-nowrap animate-fade-in-up opacity-0 [animation-delay:1100ms]!"
                      >
                        Aberdeen
                      </div>
                      <div
                        class="px-2 whitespace-nowrap animate-fade-in-up opacity-0 [animation-delay:1100ms]!"
                      >
                        Mar 14
                      </div>

                      <div
                        class="px-2 whitespace-nowrap animate-fade-in-up opacity-0 [animation-delay:1200ms]!"
                      >
                        Liam
                      </div>
                      <div
                        class="px-2 whitespace-nowrap animate-fade-in-up opacity-0 [animation-delay:1200ms]!"
                      >
                        Robertson
                      </div>
                      <div
                        class="px-2 whitespace-nowrap animate-fade-in-up opacity-0 [animation-delay:1200ms]!"
                      >
                        X06
                      </div>
                      <div
                        class="px-2 whitespace-nowrap animate-fade-in-up opacity-0 [animation-delay:1200ms]!"
                      >
                        Calgary
                      </div>
                      <div
                        class="px-2 whitespace-nowrap animate-fade-in-up opacity-0 [animation-delay:1200ms]!"
                      >
                        Mar 20
                      </div>
                    </div>
                  </div>

                  <!-- Arrow -->
                  <div
                    class="flex-shrink-0 text-muted-foreground animate-slide-in-left opacity-0 [animation-delay:1800ms]!"
                  >
                    <ChevronRight class="h-8 w-8" />
                  </div>
                </div>
              </div>

              <!-- Output preview -->
              <div class="space-y-4">
                <h3
                  class="text-lg text-center font-semibold text-foreground animate-fade-in-up opacity-0 [animation-delay:2100ms]!"
                >
                  Output
                </h3>
                <div
                  class="bg-card border rounded-lg p-4 space-y-4 min-w-max transform hover:scale-105 transition-all duration-300 hover:shadow-lg animate-fade-in-up opacity-0 [animation-delay:2000ms]!"
                >
                  <div
                    class="text-sm font-medium text-muted-foreground animate-fade-in-up opacity-0 [animation-delay:2200ms]!"
                  >
                    Organized by age groups with bib numbers
                  </div>

                  <!-- Premier 6-8 Years -->
                  <div class="space-y-2">
                    <div
                      class="px-3 py-0.5 bg-primary/20 text-primary font-bold text-sm rounded-md inline-block animate-fade-in-up opacity-0 [animation-delay:2300ms]!"
                    >
                      Premier 6-8 Years
                    </div>
                    <div class="grid grid-cols-4 gap-1 text-xs min-w-max">
                      <div
                        class="px-2 py-0.5 bg-primary/20 text-primary font-bold rounded whitespace-nowrap animate-fade-in-up opacity-0 [animation-delay:2400ms]!"
                      >
                        101
                      </div>
                      <div
                        class="px-2 whitespace-nowrap animate-fade-in-up opacity-0 [animation-delay:2400ms]!"
                      >
                        Liam
                      </div>
                      <div
                        class="px-2 whitespace-nowrap animate-fade-in-up opacity-0 [animation-delay:2400ms]!"
                      >
                        Robertson
                      </div>
                      <div
                        class="px-2 whitespace-nowrap animate-fade-in-up opacity-0 [animation-delay:2400ms]!"
                      >
                        Calgary
                      </div>
                      <div
                        class="px-2 py-0.5 bg-primary/20 text-primary font-bold rounded whitespace-nowrap animate-fade-in-up opacity-0 [animation-delay:2500ms]!"
                      >
                        103
                      </div>
                      <div
                        class="px-2 whitespace-nowrap animate-fade-in-up opacity-0 [animation-delay:2500ms]!"
                      >
                        Hamish
                      </div>
                      <div
                        class="px-2 whitespace-nowrap animate-fade-in-up opacity-0 [animation-delay:2500ms]!"
                      >
                        Murray
                      </div>
                      <div
                        class="px-2 whitespace-nowrap animate-fade-in-up opacity-0 [animation-delay:2500ms]!"
                      >
                        Sydney
                      </div>
                      <div
                        class="px-2 py-0.5 bg-primary/20 text-primary font-bold rounded whitespace-nowrap animate-fade-in-up opacity-0 [animation-delay:2600ms]!"
                      >
                        108
                      </div>
                      <div
                        class="px-2 whitespace-nowrap animate-fade-in-up opacity-0 [animation-delay:2600ms]!"
                      >
                        Emma
                      </div>
                      <div
                        class="px-2 whitespace-nowrap animate-fade-in-up opacity-0 [animation-delay:2600ms]!"
                      >
                        MacDonald
                      </div>
                      <div
                        class="px-2 whitespace-nowrap animate-fade-in-up opacity-0 [animation-delay:2600ms]!"
                      >
                        Glasgow
                      </div>
                    </div>
                  </div>

                  <!-- Premier 9-11 Years -->
                  <div class="space-y-2">
                    <div
                      class="px-3 py-0.5 bg-primary/20 text-primary font-bold text-sm rounded-md inline-block animate-fade-in-up opacity-0 [animation-delay:2900ms]!"
                    >
                      Premier 9-11 Years
                    </div>
                    <div class="grid grid-cols-4 gap-1 text-xs min-w-max">
                      <div
                        class="px-2 py-0.5 bg-primary/20 text-primary font-bold rounded whitespace-nowrap animate-fade-in-up opacity-0 [animation-delay:3000ms]!"
                      >
                        105
                      </div>
                      <div
                        class="px-2 whitespace-nowrap animate-fade-in-up opacity-0 [animation-delay:3000ms]!"
                      >
                        Connor
                      </div>
                      <div
                        class="px-2 whitespace-nowrap animate-fade-in-up opacity-0 [animation-delay:3000ms]!"
                      >
                        McLeod
                      </div>
                      <div
                        class="px-2 whitespace-nowrap animate-fade-in-up opacity-0 [animation-delay:3000ms]!"
                      >
                        Edinburgh
                      </div>
                      <div
                        class="px-2 py-0.5 bg-primary/20 text-primary font-bold rounded whitespace-nowrap animate-fade-in-up opacity-0 [animation-delay:3100ms]!"
                      >
                        106
                      </div>
                      <div
                        class="px-2 whitespace-nowrap animate-fade-in-up opacity-0 [animation-delay:3100ms]!"
                      >
                        Isla
                      </div>
                      <div
                        class="px-2 whitespace-nowrap animate-fade-in-up opacity-0 [animation-delay:3100ms]!"
                      >
                        Fraser
                      </div>
                      <div
                        class="px-2 whitespace-nowrap animate-fade-in-up opacity-0 [animation-delay:3100ms]!"
                      >
                        Melbourne
                      </div>
                      <div
                        class="px-2 py-0.5 bg-primary/20 text-primary font-bold rounded whitespace-nowrap animate-fade-in-up opacity-0 [animation-delay:3200ms]!"
                      >
                        107
                      </div>
                      <div
                        class="px-2 whitespace-nowrap animate-fade-in-up opacity-0 [animation-delay:3200ms]!"
                      >
                        James
                      </div>
                      <div
                        class="px-2 whitespace-nowrap animate-fade-in-up opacity-0 [animation-delay:3200ms]!"
                      >
                        Campbell
                      </div>
                      <div
                        class="px-2 whitespace-nowrap animate-fade-in-up opacity-0 [animation-delay:3200ms]!"
                      >
                        Toronto
                      </div>
                    </div>
                  </div>

                  <!-- Premier 12-13 Years -->
                  <div class="space-y-2">
                    <div
                      class="px-3 py-0.5 bg-primary/20 text-primary font-bold text-sm rounded-md inline-block animate-fade-in-up opacity-0 [animation-delay:3500ms]!"
                    >
                      Premier 12-13 Years
                    </div>
                    <div class="grid grid-cols-4 gap-1 text-xs min-w-max">
                      <div
                        class="px-2 py-0.5 bg-primary/20 text-primary font-bold rounded whitespace-nowrap animate-fade-in-up opacity-0 [animation-delay:3600ms]!"
                      >
                        102
                      </div>
                      <div
                        class="px-2 whitespace-nowrap animate-fade-in-up opacity-0 [animation-delay:3600ms]!"
                      >
                        Fiona
                      </div>
                      <div
                        class="px-2 whitespace-nowrap animate-fade-in-up opacity-0 [animation-delay:3600ms]!"
                      >
                        Sinclair
                      </div>
                      <div
                        class="px-2 whitespace-nowrap animate-fade-in-up opacity-0 [animation-delay:3600ms]!"
                      >
                        Aberdeen
                      </div>
                      <div
                        class="px-2 py-0.5 bg-primary/20 text-primary font-bold rounded whitespace-nowrap animate-fade-in-up opacity-0 [animation-delay:3700ms]!"
                      >
                        104
                      </div>
                      <div
                        class="px-2 whitespace-nowrap animate-fade-in-up opacity-0 [animation-delay:3700ms]!"
                      >
                        Sophie
                      </div>
                      <div
                        class="px-2 whitespace-nowrap animate-fade-in-up opacity-0 [animation-delay:3700ms]!"
                      >
                        Stewart
                      </div>
                      <div
                        class="px-2 whitespace-nowrap animate-fade-in-up opacity-0 [animation-delay:3700ms]!"
                      >
                        Vancouver
                      </div>
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
                        Choose a CSV file exported from:
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
                      The algorithm splits dancers into optimal age groups, which can you customize
                      if needed
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
                      Uses reverse-registration-order with automatic and adjustable numbering
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
                      Ready for <a
                        href="https://scotdance.app"
                        target="_blank"
                        rel="noopener noreferrer"
                        class="inline-flex items-center font-bold gap-1 text-primary hover:text-primary/80 transition-colors"
                      >
                        ScotDance.app <ExternalLink class="h-3 w-3" />
                      </a> or paper programs
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
import AppHeader from '@/components/AppHeader.vue'
import { Shield, ChevronRight, ExternalLink } from 'lucide-vue-next'

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
</script>

<style scoped>
@keyframes fade-in-up {
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes bounce-x {
  0%,
  100% {
    transform: translateX(0);
  }
  50% {
    transform: translateX(10px);
  }
}

@keyframes slide-in-left {
  from {
    opacity: 0;
    transform: translateX(-30px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

.animate-fade-in-up {
  animation: fade-in-up 0.8s ease-out forwards;
}

.animate-bounce-x {
  animation: bounce-x 2s ease-in-out infinite;
}

.animate-slide-in-left {
  animation: slide-in-left 0.8s ease-out forwards;
}
</style>
