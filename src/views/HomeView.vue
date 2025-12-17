<template>
  <FileUpload :is-loading="store.isLoadingInputFile" @file-selected="handleFileSelected">
    <template #default="{ chooseFile }">
      <header
        class="fixed top-0 inset-x-0 h-24 bg-gradient-to-b from-background to-transparent z-20"
      ></header>
      <div class="flex flex-col">
        <!-- Section 1: Hero (100vh) -->
        <section
          class="min-h-screen flex flex-col items-center justify-between px-6 py-24 relative"
        >
          <!-- Hero content -->
          <div class="flex-1 flex items-center justify-center w-full">
            <div class="max-w-4xl mx-auto text-center space-y-8">
              <!-- Logo (will become fixed on scroll) -->
              <div ref="logoWrapperRef" class="flex justify-center mb-8 w-full relative z-30">
                <Button variant="outline" as-child ref="logoRef">
                  <router-link
                    to="/"
                    class="font-semibold text-primary backdrop-blur hover:tracking-widest duration-500 transition-all"
                  >
                    <div class="flex items-center gap-2">
                      <img
                        src="/touchicon.png"
                        alt="Splits Logo"
                        class="size-4"
                        v-view-transition-name="'splits-logo'"
                      />
                      <span
                        class="text-sm font-semibold text-primary"
                        v-view-transition-name="'splits-name'"
                      >
                        Splits
                      </span>
                    </div>
                  </router-link>
                </Button>
              </div>

              <h1
                class="text-6xl md:text-7xl lg:text-8xl font-semibold tracking-tight text-foreground"
              >
                An hour of work.<br />Done in seconds.
              </h1>

              <p
                class="text-xl md:text-2xl shimmer-text text-muted-foreground leading-relaxed max-w-2xl mx-auto"
              >
                Organize dancers into balanced groups with proper bib numbers.
              </p>

              <!-- CTAs (will become fixed on scroll) -->
              <div class="flex flex-col sm:flex-row gap-4 justify-center items-center pt-4">
                <!-- Left: Choose file button -->
                <div ref="chooseFileWrapperRef">
                  <Button
                    size="lg"
                    :disabled="store.isLoadingInputFile"
                    :loading="store.isLoadingInputFile"
                    @click="chooseFile"
                    class="text-lg px-8 py-6 rounded-full backdrop-blur"
                  >
                    Choose file →
                  </Button>
                </div>

                <!-- Right: View demo button -->
                <div ref="viewDemoWrapperRef">
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
          <div class="text-center">
            <p class="text-sm text-muted-foreground">Private by design. Free forever.</p>
          </div>
        </section>

        <!-- Section 2: The Transformation - Parallax Slide-Up -->
        <section
          ref="transformationSectionRef"
          class="relative min-h-[150vh] px-6 bg-muted/20"
          style="perspective: 2000px"
        >
          <div class="max-w-6xl mx-auto" style="transform-style: preserve-3d">
            <!-- Before Table (Sticky, stays in view) -->
            <div
              class="sticky top-24 py-12 max-w-[92%] mx-auto"
              style="transform-style: preserve-3d"
            >
              <div
                class="bg-background border rounded-3xl p-6 md:p-8 shadow-lg relative z-10"
                :style="{ transform: `rotateX(${beforeRotation}deg) scale(0.95)` }"
              >
                <div class="flex items-baseline justify-between mb-6">
                  <h3 class="text-base md:text-lg font-semibold text-muted-foreground">Before</h3>
                  <p class="text-sm md:text-base text-muted-foreground/80 font-medium">
                    Unsorted. Unbalanced. Hours of work ahead.
                  </p>
                </div>
                <div
                  class="rounded-xl overflow-x-auto overflow-y-hidden border max-h-[500px] will-change-transform"
                  style="backface-visibility: hidden"
                >
                  <CellTable :data="mockInputDataRows.slice(0, 20)" :headers="mockInputHeaders" />
                </div>
              </div>
            </div>

            <!-- After Table (Slides up from below to cover Before) -->
            <div
              class="relative py-24 -mt-32 max-w-[92%] mx-auto"
              style="transform-style: preserve-3d"
            >
              <div
                class="bg-primary/5 backdrop-blur-2xl border-2 border-primary/30 rounded-3xl p-6 md:p-8 shadow-2xl relative z-20"
                :style="{
                  transform: `rotateX(-${afterRotation}deg) translateZ(300px) scale(0.95)`,
                }"
              >
                <div class="flex items-baseline justify-between mb-6">
                  <h3 class="text-base md:text-lg font-semibold text-primary">After</h3>
                  <p class="text-sm md:text-base text-primary/90 font-medium">
                    Balanced groups. Assigned bibs. Done in seconds.
                  </p>
                </div>
                <div
                  class="rounded-xl overflow-x-auto overflow-y-hidden border-2 border-primary/30 max-h-[500px] will-change-transform"
                  style="backface-visibility: hidden"
                >
                  <CellTable
                    :data="filteredOutputData"
                    :show-headers="false"
                    :show-row-headers="false"
                  />
                </div>
              </div>
            </div>
          </div>
        </section>

        <!-- Section 3: How It Works -->
        <section class="px-6 py-24 md:py-32">
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
                  <div
                    class="flex items-center justify-center w-6 h-6 md:w-8 md:h-8 rounded-full bg-foreground/10 text-foreground font-semibold text-sm md:text-base leading-none flex-shrink-0 mt-0.5"
                  >
                    1
                  </div>
                  <h2 class="text-4xl md:text-5xl font-semibold tracking-tight text-foreground">
                    Gather
                  </h2>
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
                  <div
                    class="flex items-center justify-center w-6 h-6 md:w-8 md:h-8 rounded-full bg-primary/20 text-primary font-semibold text-sm md:text-base leading-none flex-shrink-0 mt-0.5"
                  >
                    2
                  </div>
                  <h2 class="text-4xl md:text-5xl font-semibold tracking-tight text-primary">
                    Split
                  </h2>
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
                  <div
                    class="flex items-center justify-center w-6 h-6 md:w-8 md:h-8 rounded-full bg-foreground/10 text-foreground font-semibold text-sm md:text-base leading-none flex-shrink-0 mt-0.5"
                  >
                    3
                  </div>
                  <h2 class="text-4xl md:text-5xl font-semibold tracking-tight text-foreground">
                    Go
                  </h2>
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
                  <img
                    src="/src/assets/scotdance-icon.png"
                    alt="ScotDance.app"
                    class="w-8 h-8 object-contain"
                  />
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
        <section class="px-6 py-24 md:py-32 bg-muted/20">
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
        <div class="fixed bottom-0 left-0 right-0 z-40 pointer-events-none">
          <ValidationBanner
            :issues="criticalErrors"
            @review="chooseFile"
            @dismiss="handleErrorDismiss"
          />
        </div>
      </div>
    </template>
  </FileUpload>
</template>

<script setup lang="ts">
import { Shield, SparklesIcon, WandSparklesIcon } from 'lucide-vue-next'
import { parse } from 'papaparse'
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useScroll } from '@vueuse/core'
import { useAppStore } from '@/stores/app'
import { fetchDemoCSV, type ValidationIssue } from '@/lib/input'
import FileUpload from '@/components/FileUpload.vue'
import CellTable from '@/components/CellTable.vue'
import ValidationBanner from '@/components/ValidationBanner.vue'
import { Button } from '@/components/ui/button'
import { createPartitions, processCSVData } from '@/lib/input'
import { type ExportSettings, calculateDefaultMaxBib, generateExportData } from '@/lib/output'
import type { Cell } from '@/lib/types'

// Dynamic mock data loaded from CSV
const mockInputData = ref<Cell[][]>([])
const mockInputHeaders = ref<string[]>([])
const isLoadingMockData = ref(true)

// Scroll-based parallax rotation
const transformationSectionRef = ref<HTMLElement>()
const { y } = useScroll(window)

// RAF-based header animation
// Refs for wrapper elements (for transforms) and inner elements (for styling/measurement)
const logoWrapperRef = ref<HTMLElement>()
const logoRef = ref<HTMLElement>()
const chooseFileWrapperRef = ref<HTMLElement>()
const viewDemoWrapperRef = ref<HTMLElement>()

// Initial positions captured on mount (absolute page positions)
const initialLogoTop = ref<number>(0)
const initialLogoWidth = ref<number>(0)
const initialLogoHeight = ref<number>(0)
const initialChooseFileTop = ref<number>(0)
const initialChooseFileLeft = ref<number>(0)
const initialChooseFileWidth = ref<number>(0)
const initialChooseFileHeight = ref<number>(0)
const initialViewDemoTop = ref<number>(0)
const initialViewDemoLeft = ref<number>(0)
const initialViewDemoWidth = ref<number>(0)
const initialViewDemoHeight = ref<number>(0)

// Current scroll position (updated via RAF, not reactive)
let currentScrollY = 0
let rafId: number | null = null

// Easing function
const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3)

// Animation constants
const TARGET_TOP = 24 // top-6 in pixels (1.5rem)
const LOGO_TRANSFORM_DURATION = 300 // px of scroll for logo to fully transform
const BUTTON_COLLISION_DISTANCE = 100 // px before buttons start moving

// Capture initial element positions
function captureInitialBounds() {
  const logoEl = logoRef.value?.$el || logoRef.value
  const chooseFileWrapperEl = chooseFileWrapperRef.value
  const viewDemoWrapperEl = viewDemoWrapperRef.value

  const currentScroll = window.scrollY

  // Capture absolute page positions (viewport position + current scroll)
  if (logoEl && logoEl.getBoundingClientRect) {
    const logoRect = logoEl.getBoundingClientRect()
    initialLogoTop.value = logoRect.top + currentScroll
    initialLogoWidth.value = logoRect.width
    initialLogoHeight.value = logoRect.height
  }
  if (chooseFileWrapperEl && chooseFileWrapperEl.getBoundingClientRect) {
    const chooseFileRect = chooseFileWrapperEl.getBoundingClientRect()
    initialChooseFileTop.value = chooseFileRect.top + currentScroll
    initialChooseFileLeft.value = chooseFileRect.left
    initialChooseFileWidth.value = chooseFileRect.width
    initialChooseFileHeight.value = chooseFileRect.height
  }
  if (viewDemoWrapperEl && viewDemoWrapperEl.getBoundingClientRect) {
    const viewDemoRect = viewDemoWrapperEl.getBoundingClientRect()
    initialViewDemoTop.value = viewDemoRect.top + currentScroll
    initialViewDemoLeft.value = viewDemoRect.left
    initialViewDemoWidth.value = viewDemoRect.width
    initialViewDemoHeight.value = viewDemoRect.height
  }
}

// Recapture bounds on window resize
function handleResize() {
  captureInitialBounds()
}

// Calculate transforms based on scroll position
function updateHeaderTransforms() {
  currentScrollY = window.scrollY

  // Get wrapper DOM elements (for transforms)
  const logoWrapperEl = logoWrapperRef.value as HTMLElement
  const chooseFileWrapperEl = chooseFileWrapperRef.value as HTMLElement
  const viewDemoWrapperEl = viewDemoWrapperRef.value as HTMLElement

  // Get inner elements (for styling)
  const logoEl = (logoRef.value?.$el || logoRef.value) as HTMLElement

  if (
    !logoWrapperEl ||
    !logoEl ||
    !chooseFileWrapperEl ||
    !viewDemoWrapperEl ||
    !initialLogoTop.value ||
    !initialChooseFileTop.value ||
    !initialViewDemoTop.value
  ) {
    return
  }

  // PHASE 1: Calculate when logo reaches the top (using absolute page position)
  const logoNaturalTop = initialLogoTop.value - currentScrollY
  const logoShouldBeFixed = logoNaturalTop <= TARGET_TOP

  // PHASE 2: Logo transform progress (after it becomes fixed)
  let logoTransformProgress = 0
  if (logoShouldBeFixed) {
    const scrollWhenLogoFixed = initialLogoTop.value - TARGET_TOP
    const scrollSinceFixed = currentScrollY - scrollWhenLogoFixed
    logoTransformProgress = Math.max(0, Math.min(1, scrollSinceFixed / LOGO_TRANSFORM_DURATION))
  }

  // PHASE 3: Button collision detection (using absolute page position)
  const chooseFileNaturalTop = initialChooseFileTop.value - currentScrollY
  const chooseFileDistanceToLogo = chooseFileNaturalTop - TARGET_TOP
  const chooseFileShouldBeFixed =
    logoShouldBeFixed && chooseFileDistanceToLogo <= BUTTON_COLLISION_DISTANCE

  const zipperProgress = chooseFileShouldBeFixed
    ? Math.max(0, Math.min(1, 1 - chooseFileDistanceToLogo / BUTTON_COLLISION_DISTANCE))
    : 0

  // Apply easing
  const easedLogoProgress = easeOutCubic(logoTransformProgress)
  const easedZipperProgress = easeOutCubic(zipperProgress)

  // Calculate shared values used by multiple elements
  // Inverted logic: start large (2.5x) → scale down to normal (1x)
  const logoScale = 2.5 - (2.5 - 1) * easedLogoProgress
  // Border & background opacity: starts transparent → becomes visible
  const logoBorderOpacity = easedLogoProgress
  const logoBgOpacity = easedLogoProgress

  // Button scale: calculate to match logo's final height
  const logoFinalHeight = initialLogoHeight.value * 1.0 // logo at 1x scale
  const buttonInitialHeight = initialChooseFileHeight.value
  const targetButtonScale = logoFinalHeight / buttonInitialHeight
  // Interpolate from 1.0 (natural) to target scale
  const buttonScale = 1.0 - (1.0 - targetButtonScale) * easedZipperProgress

  // DIRECT DOM MANIPULATION - NO VUE REACTIVITY

  // LOGO WRAPPER & ELEMENT
  // Always apply border and background color opacity to logo element
  logoEl.style.borderColor = `oklch(from var(--input) L C H / ${logoBorderOpacity})`
  logoEl.style.backgroundColor = `oklch(from var(--input) L C H / ${logoBgOpacity / 3})`

  if (logoShouldBeFixed) {
    const logoTranslateY = TARGET_TOP - logoNaturalTop

    // Transform the wrapper (position + scale to avoid transition jank)
    logoWrapperEl.style.position = 'relative'
    logoWrapperEl.style.zIndex = '50'
    logoWrapperEl.style.transform = `translate3d(0, ${logoTranslateY}px, 0) scale(${logoScale})`
    logoWrapperEl.style.transformOrigin = 'center'
    logoWrapperEl.style.willChange = 'transform'
  } else {
    // Reset wrapper but keep scale applied
    logoWrapperEl.style.position = ''
    logoWrapperEl.style.zIndex = ''
    logoWrapperEl.style.transform = `scale(${logoScale})`
    logoWrapperEl.style.transformOrigin = 'center'
    logoWrapperEl.style.willChange = ''
  }

  // CHOOSE FILE BUTTON WRAPPER
  if (chooseFileShouldBeFixed) {
    // Scaled button dimensions
    const scaledButtonWidth = initialChooseFileWidth.value * buttonScale
    const scaledButtonHeight = initialChooseFileHeight.value * buttonScale

    // Horizontal positioning: position button center at (TARGET_TOP + half scaled width) from left edge
    const targetCenterX = TARGET_TOP + scaledButtonWidth / 2
    const initialCenterX = initialChooseFileLeft.value + initialChooseFileWidth.value / 2
    const chooseFileTranslateX = (targetCenterX - initialCenterX) * easedZipperProgress

    // Vertical positioning: align button center with logo center
    const chooseFileNaturalTop = initialChooseFileTop.value - currentScrollY
    const scaledLogoHeight = initialLogoHeight.value * logoScale

    // Calculate target top position for button (to center with logo)
    const targetButtonTop = TARGET_TOP + (scaledLogoHeight - scaledButtonHeight) / 2

    // Account for center-origin scaling shift (scaling down makes top edge move down)
    const scaleShift = ((1 - buttonScale) * scaledButtonHeight) / 2

    // Apply both the positioning and scale shift compensation (with 2px adjustment)
    const buttonTranslateY =
      (targetButtonTop - chooseFileNaturalTop - scaleShift - 2) * easedZipperProgress

    // Transform wrapper only (position and scale)
    chooseFileWrapperEl.style.position = 'relative'
    chooseFileWrapperEl.style.zIndex = '50'
    chooseFileWrapperEl.style.transform = `translate3d(${chooseFileTranslateX}px, ${buttonTranslateY}px, 0) scale(${buttonScale})`
    chooseFileWrapperEl.style.transformOrigin = 'center'
    chooseFileWrapperEl.style.willChange = 'transform'
  } else {
    chooseFileWrapperEl.style.position = ''
    chooseFileWrapperEl.style.zIndex = ''
    chooseFileWrapperEl.style.transform = ''
    chooseFileWrapperEl.style.transformOrigin = ''
    chooseFileWrapperEl.style.willChange = ''
  }

  // VIEW DEMO BUTTON WRAPPER
  if (chooseFileShouldBeFixed) {
    // Scaled button dimensions
    const scaledButtonWidth = initialViewDemoWidth.value * buttonScale
    const scaledButtonHeight = initialViewDemoHeight.value * buttonScale

    // Horizontal positioning: position button center at (viewport width - TARGET_TOP - half scaled width) from left edge
    const targetCenterX = window.innerWidth - TARGET_TOP - scaledButtonWidth / 2
    const initialCenterX = initialViewDemoLeft.value + initialViewDemoWidth.value / 2
    const viewDemoTranslateX = (targetCenterX - initialCenterX) * easedZipperProgress

    // Vertical positioning: align button center with logo center
    const viewDemoNaturalTop = initialViewDemoTop.value - currentScrollY
    const scaledLogoHeight = initialLogoHeight.value * logoScale

    // Calculate target top position for button (to center with logo)
    const targetButtonTop = TARGET_TOP + (scaledLogoHeight - scaledButtonHeight) / 2

    // Account for center-origin scaling shift (scaling down makes top edge move down)
    const scaleShift = ((1 - buttonScale) * scaledButtonHeight) / 2

    // Apply both the positioning and scale shift compensation (with 2px adjustment)
    const buttonTranslateY =
      (targetButtonTop - viewDemoNaturalTop - scaleShift - 2) * easedZipperProgress

    // Transform wrapper only (position and scale)
    viewDemoWrapperEl.style.position = 'relative'
    viewDemoWrapperEl.style.zIndex = '50'
    viewDemoWrapperEl.style.transform = `translate3d(${viewDemoTranslateX}px, ${buttonTranslateY}px, 0) scale(${buttonScale})`
    viewDemoWrapperEl.style.transformOrigin = 'center'
    viewDemoWrapperEl.style.willChange = 'transform'
  } else {
    viewDemoWrapperEl.style.position = ''
    viewDemoWrapperEl.style.zIndex = ''
    viewDemoWrapperEl.style.transform = ''
    viewDemoWrapperEl.style.transformOrigin = ''
    viewDemoWrapperEl.style.willChange = ''
  }
}

// RAF loop
function rafLoop() {
  updateHeaderTransforms()
  rafId = requestAnimationFrame(rafLoop)
}

// Start/stop RAF on mount/unmount
onMounted(async () => {
  await loadMockData()
  captureInitialBounds()
  rafLoop()
  window.addEventListener('resize', handleResize)
})

onUnmounted(() => {
  if (rafId !== null) {
    cancelAnimationFrame(rafId)
  }
  window.removeEventListener('resize', handleResize)
})

// Load mock data for preview tables
async function loadMockData() {
  try {
    const csvText = await fetchDemoCSV()

    const results = await new Promise<{ data: string[][] }>((resolve, reject) => {
      parse(csvText, {
        worker: true,
        complete: resolve,
        error: reject,
      })
    })

    const csvData = results.data as string[][]
    if (csvData && csvData.length > 0) {
      mockInputHeaders.value = csvData[0]
      // Convert string[][] to Cell[][] (no validation for demo data)
      mockInputData.value = csvData.map((row) =>
        row.map((value) => ({ value, error: false, warning: false })),
      )
    }
  } catch (error) {
    console.error('Failed to load mock data:', error)
  } finally {
    isLoadingMockData.value = false
  }
}

// Extract just the data rows for table display (without headers)
const mockInputDataRows = computed(() => {
  if (mockInputData.value.length <= 1) return []
  return mockInputData.value.slice(1)
})

// Process mock data using shared transformation logic
const mockProcessedData = computed(() => {
  if (isLoadingMockData.value || mockInputData.value.length === 0) {
    return null
  }
  try {
    // Extract raw string values for processing
    const rawData = mockInputData.value.map((row) => row.map((cell) => cell.value))
    return processCSVData(rawData)
  } catch (error) {
    console.error('Failed to process mock data:', error)
    return null
  }
})

const mockPartitions = computed(() => {
  if (!mockProcessedData.value) return {}
  return createPartitions(
    mockProcessedData.value.categories,
    mockProcessedData.value.partitionedCategories,
  )
})

// Generate actual output data using shared export logic
const realOutputData = computed(() => {
  if (!mockProcessedData.value || mockInputData.value.length === 0) {
    return []
  }

  // Extract raw string values for processing
  const rawData = mockInputData.value.map((row) => row.map((cell) => cell.value))

  const defaultMaxBib = calculateDefaultMaxBib(
    rawData,
    mockProcessedData.value.colIndexes,
    mockProcessedData.value.hasHeaderRow,
  )

  const settings: ExportSettings = {
    maxBibNumber: defaultMaxBib,
    isPrintingYears: true,
    includeCountry: false,
    combineNames: false,
  }

  return generateExportData(
    rawData,
    mockProcessedData.value.colIndexes,
    mockPartitions.value,
    settings,
    mockProcessedData.value.hasHeaderRow,
  )
})

// Filter output data to show only first 3 groups
const filteredOutputData = computed((): Cell[][] => {
  const data = realOutputData.value
  if (data.length === 0) return []

  let groupCount = 0
  let filteredData: (string | number)[][] = data

  for (let i = 0; i < data.length; i++) {
    const row = data[i]
    // Group header: first cell has text, others empty (but not all empty for separator)
    if (row[0] && !row[1] && !row[2] && !row[3]) {
      groupCount++
      if (groupCount > 3) {
        // Return everything up to (but not including) this 4th group header
        // Also exclude the separator row before it (i-1)
        filteredData = data.slice(0, Math.max(0, i - 1))
        break
      }
    }
  }

  // Convert (string | number)[][] to Cell[][]
  return filteredData.map((row) =>
    row.map((value) => ({ value: String(value), error: false, warning: false })),
  )
})

// Scroll-based rotation angles for parallax effect
const beforeRotation = computed(() => {
  if (!transformationSectionRef.value) return 0

  const rect = transformationSectionRef.value.getBoundingClientRect()
  const viewportHeight = window.innerHeight
  const elementTop = rect.top + y.value
  const elementHeight = rect.height

  // Calculate scroll progress through the section
  const scrollStart = elementTop - viewportHeight * 0.9
  const scrollEnd = elementTop + elementHeight * 0.9
  const scrollRange = scrollEnd - scrollStart

  const progress = (y.value - scrollStart) / scrollRange
  const clampedProgress = Math.max(0, Math.min(1, progress))

  // Before: 0deg → 70deg (starts flat, tilts back dramatically)
  return clampedProgress * 90
})

const afterRotation = computed(() => {
  if (!transformationSectionRef.value) return 70

  const rect = transformationSectionRef.value.getBoundingClientRect()
  const viewportHeight = window.innerHeight
  const elementTop = rect.top + y.value
  const elementHeight = rect.height

  // Calculate scroll progress through the section
  const scrollStart = elementTop - viewportHeight * 0.1
  const scrollEnd = elementTop + elementHeight * 0.4
  const scrollRange = scrollEnd - scrollStart

  const progress = (y.value - scrollStart) / scrollRange
  const clampedProgress = Math.max(0, Math.min(1, progress))

  // After: 70deg → 0deg (completes rotation at 80% scroll progress for more visible effect)
  const rotationProgress = Math.min(clampedProgress / 0.9, 1)
  return 70 - rotationProgress * 70
})

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

function handleErrorDismiss() {
  store.fileLoadError = undefined
}
</script>
