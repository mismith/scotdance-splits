# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/claude-code) when working with code in this repository.

## Vue Single-File Component (SFC) Order

Always use this order in Vue SFCs:

1. `<script>` (or `<script setup>`)
2. `<template>`
3. `<style>` (if present)

Example:
```vue
<script setup lang="ts">
// imports and logic
</script>

<template>
  <!-- markup -->
</template>

<style>
/* styles */
</style>
```

## Styling

Always prefer Tailwind utility classes over custom `<style>` blocks. For Vue `<Transition>` components, use the inline class props (`enter-active-class`, `leave-active-class`, etc.) with Tailwind classes instead of defining CSS transition rules in a `<style>` block.
