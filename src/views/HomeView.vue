<template>
  <FileUpload
    :is-loading="store.isLoadingInputFile"
    :error="store.inputError"
    @file-selected="handleFileSelected"
    @error-dismiss="handleErrorDismiss"
  >
    <template #default="{ chooseFile }">
      <div class="flex flex-col">
        <!-- Header - Center-aligned logo -->
        <header class="py-16 text-center relative">
          <!-- Dark mode toggle -->
          <div class="absolute top-8 right-8">
            <DarkModeToggle />
          </div>

          <a
            href="/"
            class="will-change-transform flex items-center justify-center gap-4 text-4xl font-semibold text-primary hover:text-primary/80 transition-colors"
          >
            <img
              src="/touchicon.png"
              alt="Splits Logo"
              class="size-12"
              v-view-transition-name="'splits-logo'"
            />
            <span v-view-transition-name="'splits-name'">Splits</span>
          </a>
          <p class="text-lg text-muted-foreground mt-4">
            Split registrants into groups with bib numbers
          </p>
        </header>

        <!-- Main content -->
        <main ref="containerRef" class="flex-1 max-w-6xl mx-auto px-6 relative">
          <!-- Dynamic curvy lines -->
          <svg
            ref="topSvgRef"
            class="absolute inset-0 w-full h-full pointer-events-none"
            style="overflow: visible; z-index: 5"
          ></svg>
          <svg
            ref="bottomSvgRef"
            class="absolute inset-0 w-full h-full pointer-events-none"
            style="overflow: visible; z-index: 5"
          ></svg>

          <!-- Input sources -->
          <section class="mb-20">
            <div class="flex justify-center items-center gap-16">
              <div
                :ref="(el) => setInputSourceRef(el as HTMLElement, 0)"
                class="flex flex-col items-center gap-2"
              >
                <div
                  class="w-20 h-20 rounded-xl bg-white flex items-center justify-center overflow-hidden p-3"
                >
                  <img src="/src/assets/eventry-icon.png" alt="Eventry" class="size-full invert" />
                </div>
                <span class="font-semibold text-foreground text-center">Eventry</span>
              </div>
              <div
                :ref="(el) => setInputSourceRef(el as HTMLElement, 1)"
                class="flex flex-col items-center gap-2"
              >
                <div
                  class="w-20 h-20 rounded-xl bg-white flex items-center justify-center overflow-hidden"
                >
                  <img
                    src="/src/assets/hdc-icon.png"
                    alt="HDComps"
                    class="w-full h-full object-contain"
                  />
                </div>
                <span class="font-semibold text-foreground text-center">HDComps</span>
              </div>
              <div
                :ref="(el) => setInputSourceRef(el as HTMLElement, 2)"
                class="flex flex-col items-center gap-2"
              >
                <div
                  class="w-20 h-20 rounded-xl bg-white flex items-center justify-center overflow-hidden"
                >
                  <TextCursorInput class="h-10 w-10 text-gray-600" />
                </div>
                <span class="font-semibold text-foreground text-center">Others</span>
              </div>
            </div>
          </section>

          <!-- Tables comparison -->
          <section class="mb-20 relative">
            <div class="grid lg:grid-cols-2 gap-16 relative z-10">
              <!-- Before: Input table -->
              <div ref="leftTableRef" class="space-y-0">
                <div class="bg-muted/20 border border-border rounded-xl p-4 shadow-sm">
                  <div class="mb-4">
                    <h4 class="text-xl font-semibold text-muted-foreground">From:</h4>
                    <p class="text-sm text-muted-foreground">
                      Raw registration data containing dancer info
                    </p>
                  </div>
                  <div class="h-80 w-full rounded-lg overflow-hidden border border-border/50">
                    <HotTable :settings="inputTableSettings" />
                  </div>
                  <div class="grid grid-cols-2 gap-4 mt-6 text-sm">
                    <div class="space-y-2">
                      <div class="flex items-center gap-2 text-muted-foreground">
                        <X class="h-4 w-4 text-destructive" />
                        <span>Manual age calculation</span>
                      </div>
                      <div class="flex items-center gap-2 text-muted-foreground">
                        <X class="h-4 w-4 text-destructive" />
                        <span>Unorganized data</span>
                      </div>
                    </div>
                    <div class="space-y-2">
                      <div class="flex items-center gap-2 text-muted-foreground">
                        <X class="h-4 w-4 text-destructive" />
                        <span>Hours of manual work</span>
                      </div>
                      <div class="flex items-center gap-2 text-muted-foreground">
                        <X class="h-4 w-4 text-destructive" />
                        <span>Error-prone process</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <!-- After: Output table -->
              <div ref="rightTableRef" class="space-y-0">
                <div class="bg-primary/5 border border-primary/20 rounded-xl p-4 shadow-sm">
                  <div class="mb-4">
                    <h4 class="text-xl font-semibold text-primary">To:</h4>
                    <p class="text-sm text-primary/80">Groups balanced and bib numbers assigned</p>
                  </div>
                  <div class="h-80 w-full rounded-lg overflow-hidden border border-primary/20">
                    <HotTable :settings="outputTableSettings" />
                  </div>
                  <div class="grid grid-cols-2 gap-4 mt-6 text-sm">
                    <div class="space-y-2">
                      <div class="flex items-center gap-2 text-primary">
                        <Check class="h-4 w-4" />
                        <span>Automatic age grouping</span>
                      </div>
                      <div class="flex items-center gap-2 text-primary">
                        <Check class="h-4 w-4" />
                        <span>Perfect bib numbering</span>
                      </div>
                    </div>
                    <div class="space-y-2">
                      <div class="flex items-center gap-2 text-primary">
                        <Check class="h-4 w-4" />
                        <span>Organized in seconds</span>
                      </div>
                      <div class="flex items-center gap-2 text-primary">
                        <Check class="h-4 w-4" />
                        <span>Ready to export</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <!-- Output sources -->
          <section class="mb-20">
            <div class="flex justify-center items-center gap-16">
              <div
                :ref="(el) => setOutputSourceRef(el as HTMLElement, 0)"
                class="flex flex-col items-center gap-2"
              >
                <div
                  class="w-20 h-20 rounded-xl bg-white flex items-center justify-center overflow-hidden"
                >
                  <img
                    src="/src/assets/scotdance-icon.png"
                    alt="ScotDance"
                    class="w-full h-full object-contain"
                  />
                </div>
                <div class="text-center font-semibold text-foreground">ScotDance.app</div>
              </div>
              <div
                :ref="(el) => setOutputSourceRef(el as HTMLElement, 1)"
                class="flex flex-col items-center gap-2"
              >
                <div
                  class="w-20 h-20 p-3 rounded-xl bg-white flex items-center justify-center overflow-hidden"
                >
                  <img
                    src="/src/assets/sheets-icon.png"
                    alt="Google Sheets"
                    class="w-full h-full object-contain"
                  />
                </div>
                <div class="text-center font-semibold text-foreground">Google Sheets</div>
              </div>
              <div
                :ref="(el) => setOutputSourceRef(el as HTMLElement, 2)"
                class="flex flex-col items-center gap-2"
              >
                <div
                  class="w-20 h-20 p-3 rounded-xl bg-white flex items-center justify-center overflow-hidden"
                >
                  <img
                    src="/src/assets/excel-icon.png"
                    alt="Excel"
                    class="w-full h-full object-contain"
                  />
                </div>
                <div class="text-center font-semibold text-foreground">Microsoft Excel</div>
              </div>
            </div>
          </section>
        </main>

        <!-- Sticky floating CTA -->
        <div class="sticky bottom-0 z-40 mt-12 pb-8" v-view-transition-name="'FloatingFooter'">
          <div
            class="bg-card/95 backdrop-blur-lg border border-border/50 shadow-2xl rounded-2xl p-8 max-w-lg mx-auto"
          >
            <div class="text-center mb-6">
              <p class="text-muted-foreground mb-2">Ready to organize your competition?</p>
              <p class="text-sm text-muted-foreground">Drag & drop your CSV file anywhere or</p>
            </div>
            <Button
              size="lg"
              :disabled="store.isLoadingInputFile"
              @click="chooseFile"
              class="w-full h-12 text-base font-semibold shadow-lg hover:shadow-xl transition-shadow"
            >
              <span v-if="store.isLoadingInputFile" class="flex items-center gap-2">
                <div
                  class="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin"
                ></div>
                Processing...
              </span>
              <span v-else>Choose CSV File</span>
            </Button>
          </div>
        </div>
      </div>
    </template>
  </FileUpload>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, nextTick } from 'vue'
import { parse } from 'papaparse'
import { useAppStore } from '@/stores/app'
import { Button } from '@/components/ui/button'
import DarkModeToggle from '@/components/DarkModeToggle.vue'
import FileUpload from '@/components/FileUpload.vue'
import HotTable from '@/components/HotTable.vue'
import { X, Check, TextCursorInput } from 'lucide-vue-next'
import {
  detectColumnMapping,
  categorizeData,
  autoPartitionCategories,
  INPUT_COLUMNS,
} from '@/lib/data'

// Mock data for table previews
const mockInputHeaders = [
  'Status',
  'Type',
  'PaymentMethod',
  'EntrantId',
  'FirstName',
  'LastName',
  'Sex',
  'Age',
  'Year',
  'Month',
  'Day',
  'Email',
  'ParticipantStatus',
  'MealChoice',
  'FoodAllergies',
  'Address',
]

const mockInputData = [
  [
    'Completed',
    'Conference',
    'Paypal',
    '4611',
    'John',
    'Velasco',
    'M',
    '32',
    '0000',
    '00',
    '00',
    'johnvelasco@gmail.com',
    'Dancer (Premier Only)',
    'Salmon',
    '',
    '3454 Union St.',
  ],
  [
    'Completed',
    'Conference',
    'Paypal',
    '4603',
    'Leslie',
    'Stewart',
    'F',
    '',
    '0000',
    '00',
    '00',
    'lesvegas@cox.net',
    'Parent or Organizer',
    'Chicken',
    '',
    '2483 Bench Reef Pl',
  ],
  [
    'Completed',
    'Conference',
    'Paypal',
    '4599',
    'Joyce',
    'Kite',
    'F',
    '',
    '0000',
    '00',
    '00',
    'joyce@scottishdance.com',
    'Professional (Including Teacher or SOBHD Adjudicator)',
    'Salmon',
    '',
    '7 Ashwood Crescent',
  ],
  [
    'Completed',
    'Conference',
    'Paypal',
    '4597',
    'Medina',
    'Skinner',
    'F',
    '',
    '0000',
    '00',
    '00',
    'aberdeena_mum@yahoo.ca',
    'Parent or Organizer',
    'Chicken',
    '',
    '9684 Maurice Street',
  ],
  [
    'Completed',
    'Conference',
    'Paypal',
    '4596',
    'Aberdeem',
    'Skinner',
    'F',
    '12',
    '0000',
    '00',
    '00',
    'aberdeena_mum@yahoo.ca',
    'Dancer (Premier Only)',
    'Chicken',
    '',
    '9684 Maurice Street',
  ],
  [
    'Completed',
    'Conference',
    'Paypal',
    '4595',
    'Jessica',
    'Imeson',
    'F',
    '',
    '0000',
    '00',
    '00',
    'imesontghland@gmail.com',
    'Professional (Including Teacher or SOBHD Adjudicator)',
    'Chicken',
    '',
    '#93 Sundown Grove',
  ],
  [
    'Completed',
    'Conference',
    'Paypal',
    '4594',
    'Sylvia',
    'Calder',
    'F',
    '',
    '0000',
    '00',
    '00',
    'sylviacalder08@gmail.com',
    'Professional (Including Teacher or SOBHD Adjudicator)',
    'Salmon',
    '',
    '18 Calle Pelicano',
  ],
  [
    'Completed',
    'Conference',
    'Paypal',
    '4593',
    'Isabella',
    'Connolly',
    'F',
    '18',
    '0000',
    '00',
    '00',
    'aberdeendance@shaw.ca',
    'Dancer (Premier Only)',
    'Chicken',
    '',
    '42792 Janzen Road',
  ],
  [
    'Completed',
    'Conference',
    'Paypal',
    '4592',
    'Reave',
    'Macleod',
    'F',
    '',
    '0000',
    '00',
    '00',
    'hurleod@telus.net',
    'Parent or Organizer',
    'Salmon',
    '',
    '13 Juniper Ridge',
  ],
  [
    'Completed',
    'Conference',
    'Paypal',
    '4591',
    'Viamle',
    'Ring-Connolly',
    'F',
    '',
    '0000',
    '00',
    '00',
    'aberdeendance@shaw.ca',
    'Professional (Including Teacher or SOBHD Adjudicator)',
    'Salmon',
    '',
    '42792 Janzen Road',
  ],
  [
    'Completed',
    'Conference',
    'Paypal',
    '4590',
    'Jennifer',
    'Seaman',
    'F',
    '',
    '0000',
    '00',
    '00',
    'seamandj@hotmail.com',
    'Professional (Including Teacher or SOBHD Adjudicator)',
    'Salmon',
    '',
    '2635 Garnet Street',
  ],
  [
    'Completed',
    'Conference',
    'Paypal',
    '4577',
    'Heather',
    'Donehoo',
    'F',
    '',
    '0000',
    '00',
    '00',
    'h.donehoo@comcast.net',
    'Professional (Including Teacher or SOBHD Adjudicator)',
    'Chicken',
    '',
    '12722 S. Verona Creek Way',
  ],
  [
    'Completed',
    'Conference',
    'Paypal',
    '4571',
    'Kelly',
    'MacArthur',
    'F',
    '',
    '0000',
    '00',
    '00',
    'kelly@macarthurdance.com',
    'Professional (Including Teacher or SOBHD Adjudicator)',
    'Chicken',
    '',
    '251 Kings Road',
  ],
  [
    'Completed',
    'Conference',
    'Paypal',
    '4564',
    'Suzanne',
    'Burgoyne',
    'F',
    '',
    '0000',
    '00',
    '00',
    'sueburg1@gmail.com',
    'Professional (Including Teacher or SOBHD Adjudicator)',
    'Chicken',
    '',
    '2/2 Hulme Place, McLaren Park',
  ],
  [
    'Completed',
    'Conference',
    'Paypal',
    '4554',
    'Veronica',
    'Paskulin',
    'F',
    '17',
    '0000',
    '00',
    '00',
    'veronicapaskulin18@gmail.com',
    'Dancer (Premier Only)',
    'Chicken',
    '',
    '3005 Martyn St.',
  ],
  [
    'Completed',
    'Conference',
    'Paypal',
    '4529',
    'Christine',
    'Van Der Klink',
    'F',
    '',
    '0000',
    '00',
    '00',
    'cvdklink@hotmail.com',
    'Non-Participant (Meals Only)',
    'Salmon',
    '',
    '47385 McGuire Road',
  ],
  [
    'Completed',
    'Conference',
    'Paypal',
    '4473',
    'Lorna',
    'Grant',
    'F',
    '',
    '0000',
    '00',
    '00',
    'rn4mykids@yahoo.com',
    'Non-Participant (Meals Only)',
    'Chicken',
    '',
    '46347 Portage Ave',
  ],
  [
    'Completed',
    'Conference',
    'Paypal',
    '4472',
    'Eilidh',
    'Deakin',
    'F',
    '13',
    '0000',
    '00',
    '00',
    'rn4mykids@yahoo.com',
    'Dancer (Premier Only)',
    'Beef',
    '',
    '46347 Portage Ave',
  ],
  [
    'Completed',
    'Conference',
    'Paypal',
    '4460',
    'Evelyn',
    'Hall',
    'F',
    '',
    '0000',
    '00',
    '00',
    'hilandmom@gmail.com',
    'Parent or Organizer',
    'Salmon',
    '',
    '21983 21st Place W.',
  ],
  [
    'Completed',
    'Conference',
    'Paypal',
    '4456',
    'Elizabeth',
    'Constantine',
    'F',
    '',
    '0000',
    '00',
    '00',
    'tampabayhighlanddancers@gmail.com',
    'Professional (Including Teacher or SOBHD Adjudicator)',
    'Beef',
    '',
    '718 1/2 Louden',
  ],
  [
    'Completed',
    'Conference',
    'Paypal',
    '4455',
    'Emma',
    'MacDougall',
    'F',
    '8',
    '0000',
    '00',
    '00',
    'kmacdougall@shaw.ca',
    'Dancer (Premier Only)',
    'Chicken',
    '',
    '1442 Riverside Dr.',
  ],
  [
    'Completed',
    'Conference',
    'Paypal',
    '4454',
    'Caoimhe',
    'Stewart',
    'F',
    '11',
    '0000',
    '00',
    '00',
    'kmacdougall@shaw.ca',
    'Dancer (Premier Only)',
    'Salmon',
    '',
    '1442 Riverside Dr.',
  ],
  [
    'Completed',
    'Conference',
    'Paypal',
    '4453',
    'Fiona',
    'MacDougall',
    'F',
    '15',
    '0000',
    '00',
    '00',
    'kmacdougall@shaw.ca',
    'Dancer (Premier Only)',
    'Beef',
    '',
    '1442 Riverside Dr.',
  ],
  [
    'Completed',
    'Conference',
    'Paypal',
    '4452',
    'Isla',
    'Campbell',
    'F',
    '9',
    '0000',
    '00',
    '00',
    'campbells@highland.net',
    'Dancer (Premier Only)',
    'Chicken',
    '',
    '892 Glen Valley Road',
  ],
  [
    'Completed',
    'Conference',
    'Paypal',
    '4451',
    'Connor',
    'MacLeod',
    'M',
    '14',
    '0000',
    '00',
    '00',
    'macleods@edinburgh.ac.uk',
    'Dancer (Premier Only)',
    'Salmon',
    '',
    '45 Princes Street, Edinburgh',
  ],
]

const mockOutputHeaders = ['Group/Dancer', 'Bib', 'Age', 'Location']

const mockOutputData = [
  ['Premier 6-8 Years', '', '', ''],
  ['  Emma MacDougall', '101', '8', 'Calgary'],
  ['', '', '', ''],
  ['Premier 9-11 Years', '', '', ''],
  ['  Isla Campbell', '102', '9', 'Glasgow'],
  ['  Caoimhe Stewart', '103', '11', 'Edinburgh'],
  ['', '', '', ''],
  ['Premier 12-14 Years', '', '', ''],
  ['  Aberdeem Skinner', '104', '12', 'Toronto'],
  ['  Eilidh Deakin', '105', '13', 'Melbourne'],
  ['  Connor MacLeod', '106', '14', 'Sydney'],
  ['', '', '', ''],
  ['Premier 15-17 Years', '', '', ''],
  ['  Fiona MacDougall', '107', '15', 'Vancouver'],
  ['  Veronica Paskulin', '108', '17', 'Auckland'],
  ['', '', '', ''],
  ['Premier 18+ Years', '', '', ''],
  ['  Isabella Connolly', '109', '18', 'Dublin'],
  ['  John Velasco', '110', '32', 'Wellington'],
]

// Hot table settings for previews
const inputTableSettings = {
  data: mockInputData,
  colHeaders: mockInputHeaders,
  rowHeaders: true,
  width: '100%',
  height: 300,
  stretchH: 'all',
  columnSorting: false,
  manualColumnResize: true,
  readOnly: true,
  licenseKey: 'non-commercial-and-evaluation',
}

const outputTableSettings = {
  data: mockOutputData,
  colHeaders: mockOutputHeaders,
  rowHeaders: true,
  width: '100%',
  height: 300,
  stretchH: 'all',
  columnSorting: false,
  manualColumnResize: true,
  readOnly: true,
  licenseKey: 'non-commercial-and-evaluation',
}

const store = useAppStore()

// Refs for dynamic curvy lines
const containerRef = ref<HTMLElement>()
const inputSourcesRef = ref<HTMLElement[]>([])
const leftTableRef = ref<HTMLElement>()
const rightTableRef = ref<HTMLElement>()
const outputSourcesRef = ref<HTMLElement[]>([])
const topSvgRef = ref<SVGElement>()
const bottomSvgRef = ref<SVGElement>()

// Functions to set refs for arrays
function setInputSourceRef(el: HTMLElement | null, index: number) {
  if (el) {
    inputSourcesRef.value[index] = el
  }
}

function setOutputSourceRef(el: HTMLElement | null, index: number) {
  if (el) {
    outputSourcesRef.value[index] = el
  }
}

// Dynamic curvy line system
let rafId: number | null = null
let isActive = false

function getInputCurvePath(inputIndex: number) {
  if (!containerRef.value || !inputSourcesRef.value[inputIndex] || !leftTableRef.value) {
    return ''
  }

  const container = containerRef.value.getBoundingClientRect()
  const input = inputSourcesRef.value[inputIndex].getBoundingClientRect()
  const leftTable = leftTableRef.value.getBoundingClientRect()

  // Calculate relative positions - connect to card edges with 8px offset
  const startX = input.left - container.left + input.width / 2
  const startY = input.bottom - container.top + 8 // 8px below input icon
  const endX = leftTable.left - container.left + leftTable.width / 2
  const endY = leftTable.top - container.top - 8 // 8px above table card

  // Create Z-shaped curve with Bézier handles at 50% height
  const midY = (startY + endY) / 2 // 50% height between start and end

  // Control points at 50% height for clean Z-shape
  return `M ${startX} ${startY} C ${startX} ${midY}, ${endX} ${midY}, ${endX} ${endY}`
}

function getOutputCurvePath(outputIndex: number) {
  if (!containerRef.value || !outputSourcesRef.value[outputIndex] || !rightTableRef.value) return ''

  const container = containerRef.value.getBoundingClientRect()
  const output = outputSourcesRef.value[outputIndex].getBoundingClientRect()
  const rightTable = rightTableRef.value.getBoundingClientRect()

  // Calculate relative positions - connect from card edges with 8px offset
  const startX = rightTable.left - container.left + rightTable.width / 2
  const startY = rightTable.bottom - container.top + 8 // 8px below table card
  const endX = output.left - container.left + output.width / 2
  const endY = output.top - container.top - 8 // 8px above output icon

  // Create Z-shaped curve with Bézier handles at 50% height
  const midY = (startY + endY) / 2 // 50% height between start and end

  // Control points at 50% height for clean Z-shape
  return `M ${startX} ${startY} C ${startX} ${midY}, ${endX} ${midY}, ${endX} ${endY}`
}

function updateCurvesDirectly() {
  if (!isActive) {
    rafId = requestAnimationFrame(updateCurvesDirectly)
    return
  }

  // Update top curves (input sources to left table)
  if (topSvgRef.value && inputSourcesRef.value?.length === 3 && leftTableRef.value) {
    const svg = topSvgRef.value

    // Ensure we have 3 path elements for input curves
    while (svg.children.length < 3) {
      const path = document.createElementNS('http://www.w3.org/2000/svg', 'path')
      path.setAttribute('stroke', '#fbbf24')
      path.setAttribute('stroke-width', '3')
      path.setAttribute('fill', 'none')
      path.setAttribute('stroke-linecap', 'round')
      path.setAttribute('opacity', '0.7')
      svg.appendChild(path)
    }

    // Update each input curve
    for (let i = 0; i < 3; i++) {
      const pathElement = svg.children[i] as SVGPathElement
      const newPath = getInputCurvePath(i)
      if (newPath && pathElement.getAttribute('d') !== newPath) {
        pathElement.setAttribute('d', newPath)
      }
    }
  }

  // Update bottom curves (right table to output sources)
  if (bottomSvgRef.value && outputSourcesRef.value?.length === 3 && rightTableRef.value) {
    const svg = bottomSvgRef.value

    // Ensure we have 3 path elements for output curves
    while (svg.children.length < 3) {
      const path = document.createElementNS('http://www.w3.org/2000/svg', 'path')
      path.setAttribute('stroke', '#fbbf24')
      path.setAttribute('stroke-width', '3')
      path.setAttribute('fill', 'none')
      path.setAttribute('stroke-linecap', 'round')
      path.setAttribute('opacity', '0.7')
      svg.appendChild(path)
    }

    // Update each output curve
    for (let i = 0; i < 3; i++) {
      const pathElement = svg.children[i] as SVGPathElement
      const newPath = getOutputCurvePath(i)
      if (newPath && pathElement.getAttribute('d') !== newPath) {
        pathElement.setAttribute('d', newPath)
      }
    }
  }

  rafId = requestAnimationFrame(updateCurvesDirectly)
}

onMounted(async () => {
  await nextTick()
  // Give DOM elements more time to render
  setTimeout(() => {
    isActive = true
    // Start the curve animation
    rafId = requestAnimationFrame(updateCurvesDirectly)
  }, 200)
})

onUnmounted(() => {
  isActive = false
  if (rafId) {
    cancelAnimationFrame(rafId)
  }
})

async function handleFileSelected(file: File) {
  store.clearError()
  store.setLoading(true)

  try {
    const results = await new Promise<{ data: string[][] }>((resolve, reject) => {
      parse(file, {
        worker: true,
        complete: resolve,
        error: reject,
      })
    })

    const csvData = results.data as string[][]
    if (!csvData || csvData.length === 0) {
      throw new Error('CSV file is empty')
    }

    // Set basic input data
    store.setInputData([file], csvData)

    // Detect if first row is headers
    const potentialHeaders = csvData[0]
    const hasHeaders = potentialHeaders.some((header) =>
      INPUT_COLUMNS.some((col) => col.regex.test(header)),
    )
    store.hasHeaderRow = hasHeaders

    // Auto-detect column mappings
    const headers = hasHeaders ? potentialHeaders : []
    const colIndexes = detectColumnMapping(headers)
    store.updateColIndexes(colIndexes)

    // Extract data rows (skip headers if present)
    const dataRows = hasHeaders ? csvData.slice(1) : csvData

    // Process data into categories
    const categories = categorizeData(dataRows, colIndexes)

    // Auto-partition categories into age groups
    const partitionedCategories = autoPartitionCategories(categories)

    // Update store with processed data
    store.setProcessedData(categories, partitionedCategories)

    // Calculate default max bib number
    const defaultMaxBib = Math.round((dataRows.length + 50) / 100) * 100 + 100
    store.updateExportSettings({ maxBibNumber: defaultMaxBib })

    // Data is now processed and hasData will be true, causing SplitsView to show
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to parse CSV file'
    store.setError(errorMessage)
  } finally {
    store.setLoading(false)
  }
}

function handleErrorDismiss() {
  store.clearError()
}
</script>
