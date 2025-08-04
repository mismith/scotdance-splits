<template>
  <div class="flex h-full bg-background">
    <!-- Data display area -->
    <div class="flex-1 overflow-auto bg-card">
      <div class="data-table-container min-h-[400px] h-full">
        <slot />
      </div>
    </div>

    <!-- Settings sidebar -->
    <div class="w-80 settings-sidebar flex flex-col border-l border-border bg-sidebar">
      <div class="flex-1 overflow-auto p-6 space-y-6">
        <slot name="settings" />
      </div>

      <!-- Footer with action buttons in sidebar -->
      <div class="border-t border-sidebar-border p-4 bg-sidebar shadow-sm empty:hidden">
        <slot name="footer" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
// No additional logic needed - this is a pure layout component
</script>
