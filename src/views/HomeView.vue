<template>
  <FileUpload
    :is-loading="store.isLoadingInputFile"
    @file-selected="handleFileSelected"
    @file-rejected="handleFileRejected"
  >
    <template #default="{ chooseFile }">
      <!-- Sticky Logo (no background, sticks when logo reaches top) -->
      <div
        class="fixed top-6 left-1/2 -translate-x-1/2 z-50 transition-all duration-300"
        :class="isLogoSticky ? 'opacity-100 scale-100' : 'opacity-0 scale-150 pointer-events-none'"
      >
        <Button
          variant="outline"
          size="sm"
          class="backdrop-blur font-semibold text-primary hover:tracking-widest duration-500 transition-all"
          @click="scrollToTop"
        >
          <div class="flex items-center gap-2">
            <img
              src="/touchicon.png"
              alt="Splits Logo"
              class="size-4"
              :class="{ '[view-transition-name:splits-logo]': isLogoSticky }"
            />
            <span
              class="font-semibold text-primary"
              :class="{ '[view-transition-name:splits-name]': isLogoSticky }"
            >
              Splits
            </span>
          </div>
        </Button>
      </div>

      <!-- Sticky Buttons (stick to corners when buttons reach top) -->
      <div
        class="fixed top-6 left-6 z-50 transition-all duration-500 origin-left"
        :class="
          isButtonsSticky ? 'opacity-100 scale-100' : 'opacity-0 scale-150 pointer-events-none'
        "
      >
        <Button
          size="sm"
          :disabled="store.isLoadingInputFile"
          :loading="store.isLoadingInputFile"
          @click="chooseFile"
          class="rounded-full"
        >
          Choose file →
        </Button>
      </div>
      <div
        class="fixed top-6 right-6 z-50 transition-all duration-500 origin-right"
        :class="
          isButtonsSticky ? 'opacity-100 scale-100' : 'opacity-0 scale-150 pointer-events-none'
        "
      >
        <Button size="sm" variant="outline" as-child class="rounded-full">
          <router-link to="/demo">View demo</router-link>
        </Button>
      </div>

      <!-- Gradient header background -->
      <header
        class="fixed top-0 inset-x-0 h-24 bg-gradient-to-b from-background to-transparent z-20 pointer-events-none"
      ></header>

      <div class="flex flex-col">
        <!-- Section 1: Hero (100vh) -->
        <section
          class="min-h-svh flex flex-col items-center justify-between px-6 py-24 relative bg-gradient-to-b from-transparent to-background/25"
        >
          <!-- Hero content -->
          <div class="flex-1 flex items-center justify-center w-full">
            <div class="max-w-4xl mx-auto text-center space-y-8">
              <!-- Large Logo (scales down and fades out when sticky) -->
              <div ref="logoRef" class="mb-8 w-full relative z-30">
                <div
                  class="flex justify-center transition-all duration-500"
                  :class="
                    isLogoSticky
                      ? 'opacity-0 scale-50 pointer-events-none'
                      : 'opacity-100 scale-100'
                  "
                >
                  <Button
                    variant="outline"
                    size="lg"
                    class="p-8 font-semibold text-primary backdrop-blur hover:tracking-widest duration-500 transition-all"
                    @click="scrollToTop"
                  >
                    <div class="flex items-center gap-3">
                      <img
                        src="/touchicon.png"
                        alt="Splits Logo"
                        class="size-8"
                        :class="{ '[view-transition-name:splits-logo]': !isLogoSticky }"
                      />
                      <span
                        class="text-2xl font-semibold text-primary"
                        :class="{ '[view-transition-name:splits-name]': !isLogoSticky }"
                      >
                        Splits
                      </span>
                    </div>
                  </Button>
                </div>
              </div>

              <h1
                class="text-4xl sm:text-6xl md:text-7xl lg:text-8xl font-semibold tracking-tight text-foreground"
              >
                An hour of work.<br />Done in seconds.
              </h1>

              <p
                class="text-xl md:text-2xl shimmer-text text-muted-foreground leading-relaxed max-w-2xl mx-auto"
              >
                Organize dancers into balanced groups with proper bib numbers.
              </p>

              <!-- CTAs (scale down and fade out when buttons become sticky) -->
              <div ref="buttonsRef" class="pt-4">
                <div
                  class="flex flex-col sm:flex-row gap-4 justify-center items-center transition-all duration-500"
                  :class="
                    isButtonsSticky
                      ? 'opacity-0 scale-50 pointer-events-none'
                      : 'opacity-100 scale-100'
                  "
                >
                  <!-- Left: Choose file button -->
                  <Button
                    size="lg"
                    :disabled="store.isLoadingInputFile"
                    :loading="store.isLoadingInputFile"
                    @click="chooseFile"
                    class="text-lg px-8 py-6 rounded-full backdrop-blur"
                  >
                    Choose file →
                  </Button>

                  <!-- Right: View demo button -->
                  <Button
                    size="lg"
                    variant="outline"
                    as-child
                    class="text-lg px-8 py-6 rounded-full backdrop-blur"
                  >
                    <router-link to="/demo">View demo</router-link>
                  </Button>
                </div>
              </div>
            </div>
          </div>

          <!-- Footer note -->
          <div class="text-center pt-8">
            <p class="text-xs uppercase tracking-widest text-muted-foreground">
              Private by design. Free forever.
            </p>
          </div>
        </section>

        <!-- Section 2: The Transformation - Parallax Slide-Up -->
        <TransformationSection class="bg-gradient-to-b from-transparent to-background/25" />

        <!-- Section 3: How It Works -->
        <section class="px-6 py-24 md:py-32 bg-gradient-to-b from-transparent to-background/25">
          <header class="flex mb-16">
            <h2 class="text-[10px] uppercase tracking-widest mx-auto text-muted-foreground">
              How it works
            </h2>
          </header>
          <div class="max-w-3xl mx-auto text-center space-y-16">
            <div class="space-y-24">
              <!-- Step 1: Choose -->
              <div class="space-y-6">
                <div class="flex items-center justify-center gap-4">
                  <div class="flex-1 flex justify-end">
                    <div
                      class="flex items-center justify-center w-6 h-6 md:w-8 md:h-8 rounded-full bg-foreground/10 text-foreground font-semibold text-sm md:text-base leading-none flex-shrink-0 mt-0.5"
                    >
                      1
                    </div>
                  </div>
                  <h2 class="text-4xl md:text-5xl font-semibold tracking-tight text-foreground">
                    Gather
                  </h2>
                  <span class="flex-1" />
                </div>
                <p class="text-lg md:text-xl text-muted-foreground">
                  Start with your dancer registration data.
                </p>
                <p class="text-sm text-muted-foreground/70 max-w-lg mx-auto">
                  Choose a CSV file exported from
                  <a
                    href="http://eventry.net"
                    target="_blank"
                    rel="noopener noreferrer"
                    class="underline hover:text-muted-foreground transition-colors"
                  >
                    Eventry</a
                  >,
                  <a
                    href="https://hdcomps.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    class="underline hover:text-muted-foreground transition-colors"
                  >
                    HD Comps</a
                  >, Google Forms, or whatever tool you use to gather dancer registrations.
                </p>
              </div>

              <!-- Step 2: Split -->
              <div class="space-y-6">
                <div class="flex items-center justify-center gap-4">
                  <div class="flex-1 flex justify-end">
                    <div
                      class="flex items-center justify-center w-6 h-6 md:w-8 md:h-8 rounded-full bg-primary/20 text-primary font-semibold text-sm md:text-base leading-none flex-shrink-0 mt-0.5"
                    >
                      2
                    </div>
                  </div>
                  <h2 class="text-4xl md:text-5xl font-semibold tracking-tight text-primary">
                    Split
                  </h2>
                  <span class="flex-1" />
                </div>
                <p class="text-lg md:text-xl text-muted-foreground">
                  Balance groups automatically—or adjust manually.
                </p>

                <p class="text-sm text-muted-foreground/70 max-w-lg mx-auto">
                  Each age group gets as close to an equal number of dancers as possible. Bib
                  numbers count down from your highest number in reverse registration order. You can
                  tweak these settings and/or drag to resize groups as needed.
                </p>

                <!-- Visual diagram showing splitting -->
                <div class="relative">
                  <svg
                    viewBox="0 0 420 220"
                    class="w-full max-w-lg mx-auto"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <!-- Left side: Individual dancers (8 dancers) -->
                    <g>
                      <rect
                        x="20"
                        y="30"
                        width="90"
                        height="14"
                        rx="3"
                        fill="currentColor"
                        class="text-muted-foreground/30"
                      />
                      <rect
                        x="20"
                        y="52"
                        width="90"
                        height="14"
                        rx="3"
                        fill="currentColor"
                        class="text-muted-foreground/30"
                      />
                      <rect
                        x="20"
                        y="74"
                        width="90"
                        height="14"
                        rx="3"
                        fill="currentColor"
                        class="text-muted-foreground/30"
                      />
                      <rect
                        x="20"
                        y="96"
                        width="90"
                        height="14"
                        rx="3"
                        fill="currentColor"
                        class="text-muted-foreground/30"
                      />
                      <rect
                        x="20"
                        y="118"
                        width="90"
                        height="14"
                        rx="3"
                        fill="currentColor"
                        class="text-muted-foreground/30"
                      />
                      <rect
                        x="20"
                        y="140"
                        width="90"
                        height="14"
                        rx="3"
                        fill="currentColor"
                        class="text-muted-foreground/30"
                      />
                      <rect
                        x="20"
                        y="162"
                        width="90"
                        height="14"
                        rx="3"
                        fill="currentColor"
                        class="text-muted-foreground/30"
                      />
                      <rect
                        x="20"
                        y="184"
                        width="90"
                        height="14"
                        rx="3"
                        fill="currentColor"
                        class="text-muted-foreground/30"
                      />
                    </g>

                    <!-- Curved lines using cubic Bezier - CROSSING to show sorting -->
                    <!-- Group 1: Gets dancers from positions 1, 5, 7 (crossing lines) -->
                    <path
                      d="M 110 37 L 125 37 C 205 37, 205 49, 285 49 L 310 49"
                      stroke="currentColor"
                      class="text-primary"
                      stroke-width="2"
                      stroke-linecap="round"
                      fill="none"
                      opacity="0.7"
                    />
                    <path
                      d="M 110 125 L 125 125 C 205 125, 205 60, 285 60 L 310 60"
                      stroke="currentColor"
                      class="text-primary"
                      stroke-width="2"
                      stroke-linecap="round"
                      fill="none"
                      opacity="0.7"
                    />
                    <path
                      d="M 110 169 L 125 169 C 205 169, 205 71, 285 71 L 310 71"
                      stroke="currentColor"
                      class="text-primary"
                      stroke-width="2"
                      stroke-linecap="round"
                      fill="none"
                      opacity="0.7"
                    />

                    <!-- Group 2: Gets dancers from positions 2, 4, 8 (crossing lines) -->
                    <path
                      d="M 110 59 L 125 59 C 205 59, 205 119, 285 119 L 310 119"
                      stroke="currentColor"
                      class="text-primary"
                      stroke-width="2"
                      stroke-linecap="round"
                      fill="none"
                      opacity="0.7"
                    />
                    <path
                      d="M 110 103 L 125 103 C 205 103, 205 130, 285 130 L 310 130"
                      stroke="currentColor"
                      class="text-primary"
                      stroke-width="2"
                      stroke-linecap="round"
                      fill="none"
                      opacity="0.7"
                    />
                    <path
                      d="M 110 191 L 125 191 C 205 191, 205 141, 285 141 L 310 141"
                      stroke="currentColor"
                      class="text-primary"
                      stroke-width="2"
                      stroke-linecap="round"
                      fill="none"
                      opacity="0.7"
                    />

                    <!-- Group 3: Gets dancers from positions 3, 6 (crossing lines) -->
                    <path
                      d="M 110 81 L 125 81 C 205 81, 205 179, 285 179 L 310 179"
                      stroke="currentColor"
                      class="text-primary"
                      stroke-width="2"
                      stroke-linecap="round"
                      fill="none"
                      opacity="0.7"
                    />
                    <path
                      d="M 110 147 L 125 147 C 205 147, 205 190, 285 190 L 310 190"
                      stroke="currentColor"
                      class="text-primary"
                      stroke-width="2"
                      stroke-linecap="round"
                      fill="none"
                      opacity="0.7"
                    />

                    <!-- Right side: Three balanced groups -->
                    <g>
                      <!-- Group 1 (3 dancers) -->
                      <rect
                        x="310"
                        y="42"
                        width="90"
                        height="36"
                        rx="3"
                        fill="currentColor"
                        class="text-primary/40"
                      />
                      <text
                        x="355"
                        y="64"
                        text-anchor="middle"
                        class="fill-primary text-xs font-medium"
                        font-size="11"
                      >
                        3 dancers
                      </text>

                      <!-- Group 2 (3 dancers) -->
                      <rect
                        x="310"
                        y="112"
                        width="90"
                        height="36"
                        rx="3"
                        fill="currentColor"
                        class="text-primary/40"
                      />
                      <text
                        x="355"
                        y="134"
                        text-anchor="middle"
                        class="fill-primary text-xs font-medium"
                        font-size="11"
                      >
                        3 dancers
                      </text>

                      <!-- Group 3 (2 dancers) -->
                      <rect
                        x="310"
                        y="172"
                        width="90"
                        height="25"
                        rx="3"
                        fill="currentColor"
                        class="text-primary/40"
                      />
                      <text
                        x="355"
                        y="188"
                        text-anchor="middle"
                        class="fill-primary text-xs font-medium"
                        font-size="11"
                      >
                        2 dancers
                      </text>
                    </g>

                    <!-- Labels -->
                    <text
                      x="65"
                      y="18"
                      text-anchor="middle"
                      class="fill-muted-foreground text-xs font-medium"
                      font-size="12"
                    >
                      8 Individual Dancers
                    </text>
                    <text
                      x="355"
                      y="18"
                      text-anchor="middle"
                      class="fill-primary text-xs font-medium"
                      font-size="12"
                    >
                      3 Balanced Groups
                    </text>
                  </svg>
                </div>
              </div>

              <!-- Step 3: Go -->
              <div class="space-y-6">
                <div class="flex items-center justify-center gap-4">
                  <div class="flex-1 flex justify-end">
                    <div
                      class="flex items-center justify-center w-6 h-6 md:w-8 md:h-8 rounded-full bg-foreground/10 text-foreground font-semibold text-sm md:text-base leading-none flex-shrink-0 mt-0.5"
                    >
                      3
                    </div>
                  </div>
                  <h2 class="text-4xl md:text-5xl font-semibold tracking-tight text-foreground">
                    Go
                  </h2>
                  <span class="flex-1" />
                </div>
                <p class="text-lg md:text-xl text-muted-foreground">
                  Export—and carry on organizing your competition.
                </p>
                <p class="text-sm text-muted-foreground/70 max-w-lg mx-auto">
                  Download a CSV file to import into
                  <a
                    href="https://scotdance.app"
                    target="_blank"
                    rel="noopener noreferrer"
                    class="underline hover:text-muted-foreground transition-colors"
                  >
                    ScotDance.app</a
                  >, or bring the formatted data into Sheets/Excel or Docs/Word to build a paper
                  program your own way.
                </p>

                <!-- Made for ScotDance.app Badge -->
                <a
                  href="https://scotdance.app"
                  target="_blank"
                  rel="noopener noreferrer"
                  class="inline-flex items-center gap-3 px-2 py-1 rounded-sm border-2 bg-[#1976d2] border-[#1976d2] hover:bg-[#1565c0] hover:border-[#1565c0] transition-all shadow-md hover:shadow-lg min-w-[140px]"
                  style="border-color: #1976d2"
                >
                  <img :src="scotdanceIcon" alt="ScotDance.app" class="w-8 h-8 object-contain" />
                  <div class="flex flex-col items-start -space-y-0.5">
                    <span class="text-[10px] font-medium text-white/90 uppercase tracking-wide">
                      Made for
                    </span>
                    <span class="text-base font-semibold text-white"> ScotDance.app </span>
                  </div>
                </a>
              </div>
            </div>
          </div>
        </section>

        <!-- Section 4: Privacy -->
        <section class="px-6 py-24 md:py-32 bg-gradient-to-b from-transparent to-background/25">
          <div class="max-w-2xl mx-auto text-center space-y-6">
            <div class="space-y-6">
              <div
                class="inline-flex items-center justify-center w-16 h-16 rounded-full bg-accent/10 mb-4"
              >
                <Shield class="h-8 w-8 text-accent" />
              </div>
              <h2 class="text-3xl md:text-4xl font-semibold tracking-tight text-foreground">
                Your data never leaves your device.
              </h2>
              <p class="text-lg md:text-xl text-muted-foreground max-w-xl mx-auto">
                Everything happens in your browser—your data is never uploaded, stored, or accessed
                remotely in any way.
              </p>
              <p class="text-sm text-muted-foreground/70 max-w-xl mx-auto">
                You can check for yourself since this tool is fully
                <a
                  href="https://github.com/mismith/scotdance-splits"
                  target="_blank"
                  rel="noopener noreferrer"
                  class="underline font-medium"
                  >open source</a
                >.
              </p>
            </div>
          </div>
        </section>

        <!-- Validation Banner (floating) -->
        <div class="fixed bottom-2 md:bottom-8 left-0 right-0 px-2 z-40 pointer-events-none">
          <ValidationBanner
            :issues="criticalErrors"
            review-label="Try another file"
            dismiss-label="Close"
            @review="chooseFile"
            @dismiss="handleErrorDismiss"
          />
        </div>
      </div>
    </template>
  </FileUpload>
</template>

<script setup lang="ts">
import { useIntersectionObserver } from '@vueuse/core'
import { Shield } from 'lucide-vue-next'
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import scotdanceIcon from '@/assets/scotdance-icon.png'
import { useAppStore } from '@/stores/app'
import FileUpload from '@/components/FileUpload.vue'
import TransformationSection from '@/components/TransformationSection.vue'
import ValidationBanner from '@/components/ValidationBanner.vue'
import { Button } from '@/components/ui/button'
import { type ValidationIssue } from '@/lib/input'

// Refs for measuring element positions
const logoRef = ref<HTMLElement>()
const buttonsRef = ref<HTMLElement>()

// Sticky detection via IntersectionObserver (passive, no layout thrashing during scroll)
// rootMargin shrinks the intersection area by 24px from the top (matching top-6),
// so elements are "not intersecting" once their top edge crosses that 24px line
const isLogoSticky = ref(false)
useIntersectionObserver(
  logoRef,
  ([entry]) => {
    isLogoSticky.value = !entry?.isIntersecting
  },
  { rootMargin: '-24px 0px 0px 0px', threshold: 1 },
)

const isButtonsSticky = ref(false)
useIntersectionObserver(
  buttonsRef,
  ([entry]) => {
    isButtonsSticky.value = !entry?.isIntersecting
  },
  { rootMargin: '-24px 0px 0px 0px', threshold: 1 },
)

const store = useAppStore()
const router = useRouter()

// Critical errors (file load errors that prevent navigation)
const criticalErrors = computed((): ValidationIssue[] => {
  // Only show critical file load errors on home screen (parse errors, empty file, etc.)
  return store.inputErrors.filter((error) => error.type === 'parse-error')
})

async function handleFileSelected(file: File) {
  const success = await store.loadFile(file)
  if (success) {
    router.push('/splits')
  }
}

function handleFileRejected(message: string) {
  store.fileLoadError = message
}

function handleErrorDismiss() {
  store.fileLoadError = undefined
}

function scrollToTop() {
  window.scrollTo({ top: 0, behavior: 'smooth' })
}
</script>
