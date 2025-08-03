# Splits App Modernization Plan

## Overview
Modernize the highland dance competition grouping tool from Vue 2 + Vuetify to Vue 3 + Tailwind v4 + shadcn-vue + latest Handsontable.

## App Purpose
The Splits app helps highland dance competition organizers:
- Take CSV files of registered dancers (from eventry.net, HDComps.com, etc.)
- Automatically group dancers by age categories using highland scrutineer codes
- Assign bib numbers in reverse registration order
- Export organized CSV files for ScotDance.app or paper programs
- **Privacy-first**: All processing happens client-side, no data leaves the machine

## Phase 0: Cleanup
1. **Remove HelloWorld boilerplate**:
   - Delete HelloWorld.vue, TheWelcome.vue, WelcomeItem.vue
   - Remove icon components
   - Clear out App.vue default content
   - Clean up main.css

## Phase 1: Dependencies & Setup
1. **Install new dependencies**:
   - `@handsontable/vue3` + `handsontable` (latest)
   - `tailwindcss@next` (v4) + `@tailwindcss/vite`
   - `shadcn-vue` + required shadcn components
   - `@vueuse/core` (for drop zone composables)
   - `papaparse` + `@types/papaparse`

2. **Configure Tailwind v4**:
   - Update `vite.config.ts` with Tailwind Vite plugin
   - Replace existing CSS with Tailwind imports
   - Set up CSS variables for theming

3. **Set up shadcn-vue**:
   - Initialize shadcn-vue in project
   - Install components: Button, Input, Switch (not Checkbox), Card, Stepper

## Phase 2: Core Components Migration
1. **Create new HotTable.vue wrapper**:
   - Update for `@handsontable/vue3`
   - Maintain same props/expose pattern
   - Keep resize observer logic

2. **Build shadcn-vue UI components**:
   - Custom file upload with drag-and-drop (port existing dropzone logic)
   - Layout components (SettingsPane, SettingsGroup equivalents)
   - CategoryCard component for age group partitioning display

3. **Create helper utilities**:
   - `getAgeGroupName` function (user-provided implementation)
   - CSV parsing/validation utilities

## Phase 3: Main App Migration
1. **Replace App.vue** with modernized Splits interface:
   - Use shadcn-vue Stepper component for 3-step workflow
   - Implement responsive layout with Tailwind classes
   - Port drag-and-drop file upload area

2. **Migrate core business logic**:
   - CSV parsing and validation with PapaParse
   - Column mapping system (INPUT_COLUMNS + colIndexes)
   - Highland scrutineer code categorization (P/B/N/I/R/X)
   - Age group partitioning logic
   - Reverse-order bib number assignment
   - CSV export functionality (maintain exact format)

3. **Use Vue 3 Composition API patterns**:
   - Convert to `<script setup>` syntax
   - Use reactive/ref for state management
   - Use Switch components for toggles (hasHeaderRow, isPrintingYears)
   - Implement computed properties for derived data
   - Use VueUse composables where appropriate

## Key Technical Details

### Highland Scrutineer Codes
- Format: `[PBNIRX][0-9]{2}` (e.g., P12, B08, N16)
- Categories:
  - P = Primary
  - B = Beginner  
  - N = Novice
  - I = Intermediate
  - R = Restricted Premier
  - X = Premier

### Column Mapping
Required CSV columns (auto-detected by regex):
- First name
- Last name
- Highland Scrutineer code (required)
- Registration date (for bib number ordering)
- City/Location (optional)
- Province/Region (optional)
- Country (optional)

### 3-Step Workflow
1. **Input**: Upload CSV, map columns, validate data
2. **Group**: Review age categories, adjust partitioning if needed
3. **Export**: Set bib number range, export formatted CSV

## Key Deliverables
- ✅ Clean modern codebase (no HelloWorld boilerplate)
- ✅ Fully functional Splits app with 100% feature parity
- ✅ Modern Vue 3 + Tailwind v4 + shadcn-vue tech stack
- ✅ Client-side only processing (privacy-first)
- ✅ Same CSV export format for ScotDance.app compatibility
- ✅ Toggle switches for better UX on boolean settings
- ✅ Responsive design for competition use on various devices