# Splits App Redesign Plan

## Overview
Transform the current 3-step workflow into a native macOS-style app with progressive disclosure and desktop-first design.

## 1. Home View Redesign (`HomeView.vue`)

### Layout Structure
- **Header**: Center-aligned Splits logo + name (no toolbar)
- **Description**: Brief explanation of what the tool does
- **Hero Content**: Educational example/before-after (can flow below fold)
- **Sticky CTA**: Floating "Get started" frame with file chooser button
- **Drag & Drop**: Entire page accepts file drops (maintain current functionality)

### Key Changes
- Remove complex animated demo tables
- Remove sidebar entirely 
- Focus on educational content with real examples
- Make import the primary sticky action

## 2. Main Splits View (New Component)

### Layout (Desktop-First)
```
┌─────────────────────────────────────────────────┐
│ [←] [Input Data] [Logo] [👥] [Output Data] [⚙️]  │ ← Toolbar
├─────────────────┬───────────────────────────────┤
│   Age Groups    │        Individual Ages        │
│    (Left)       │           (Right)             │
│                 │                               │
│ Premier 6-8 Yrs │ Age 6 (3 dancers)            │
│ ──curved line── │ Age 7 (7 dancers)            │
│ Premier 9-11    │ Age 8 (6 dancers)            │
│ ──curved line── │ ──curved separator──          │
│ Premier 12-13   │ Age 9 (5 dancers)            │
│                 │ Age 10 (4 dancers)           │
│                 │ Age 11 (6 dancers)           │
└─────────────────┴───────────────────────────────┘
                 [Export] ← Sticky floating button
```

### Toolbar Elements
- **Far Left**: Input data icon/button → slides to Step1 view
- **Left**: Back button (when in Step1 view) → returns to splits
- **Center**: Splits logo (smaller)
- **Right**: Preview dancers icon/button → shows dancer details
- **Far Right**: Output data icon/button → slides to Step3 view

### Navigation Pattern
- **NavigationStack-style**: Views slide left/right like macOS apps
- **Back buttons**: Appear contextually when in sub-views
- **Maintain state**: All views remember their state when switching

## 3. Step1 Input View (Modified)

### Changes
- **Add back button**: Top-left to return to splits view
- **Maintain current functionality**: Column mapping, row filtering, etc.
- **Slide-in pattern**: Enters from left, exits to right
- **Keep sidebar**: Existing SettingsPane layout works well here

## 4. Step3 Output View (Modified)  

### Changes
- **Add back button**: Top-left to return to splits view
- **Maintain current functionality**: Export options, preview, etc.
- **Slide-in pattern**: Enters from right, exits to left
- **Keep layout**: Existing export interface is good

## 5. Preview Dancers Feature (New)

### Functionality
- **Toggle button**: In toolbar next to output button
- **Enhanced view**: Shows full dancer details in right panel
- **Export preview**: Displays bib numbers, names, locations
- **Visual hierarchy**: Stylized version of export CSV data

## 6. Technical Implementation

### App.vue Changes
- **Navigation state management**: Track current view (home/splits/input/output)
- **View transitions**: Implement slide animations (LATER)
- **Maintain existing logic**: File handling, data processing unchanged

### Component Structure
```
App.vue
├── HomeView.vue (redesigned)
├── MainSplitsView.vue (new)
├── Step1Input.vue (add back button)
└── Step3Export.vue (add back button)
```

### Design System Updates
- **Smaller fonts/spacing**: Desktop-optimized for information density
- **Native macOS patterns**: Toolbar, navigation
- **Sticky elements**: Import and Export floating buttons
- **Curved separators**: Maintain as key visual element

## 7. Benefits of This Approach

- **Familiar UX**: Native macOS app patterns users already know
- **Progressive disclosure**: Complexity hidden until needed
- **Desktop-optimized**: Efficient use of screen real estate
- **Maintains functionality**: All current features preserved
- **Better onboarding**: Clear home → splits → export flow

## Implementation Order

1. ✅ Write PLAN.md documentation
2. Redesign HomeView.vue with educational hero content
3. Create new MainSplitsView.vue component
4. Add back buttons and navigation to Step1Input.vue and Step3Export.vue
5. Update App.vue navigation system (without transitions initially)
6. Implement preview dancers functionality
7. Optimize design system for desktop-first approach
8. Add slide transitions (final polish)