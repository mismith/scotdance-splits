<template>
  <div class="flex flex-1 h-full overflow-hidden flex-col lg:flex-row">
    <!-- Data display area -->
    <div class="flex-1 overflow-auto min-h-[400px] h-full">
      <slot />
    </div>

    <!-- Settings sidebar -->
    <div
      class="w-full lg:w-80 settings-sidebar flex flex-col border-t lg:border-t-0 lg:border-l border-border bg-sidebar"
    >
      <div class="flex-1 overflow-auto p-4 space-y-4">
        <slot name="settings" />
      </div>

      <!-- Footer with action buttons in sidebar - sticky on mobile -->
      <div
        class="sticky bottom-0 lg:static border-t border-sidebar-border p-4 bg-sidebar shadow-sm empty:hidden"
      >
        <slot name="footer" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
// No additional logic needed - this is a pure layout component
</script>
