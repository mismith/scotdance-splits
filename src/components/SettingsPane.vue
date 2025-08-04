<template>
  <div class="flex flex-col h-full bg-background">
    <!-- Main content area -->
    <div class="flex-1 flex overflow-hidden min-h-0">
      <!-- Data display area -->
      <div class="flex-1 overflow-auto bg-card">
        <div class="data-table-container m-4">
          <slot />
        </div>
      </div>
      
      <!-- Settings sidebar -->
      <div class="w-80 settings-sidebar overflow-auto">
        <div class="p-6 space-y-6">
          <slot name="settings" />
        </div>
      </div>
    </div>
    
    <!-- Footer with action buttons -->
    <div class="border-t border-border p-4 bg-card shadow-sm">
      <slot name="footer" />
    </div>
  </div>
</template>

<script setup lang="ts">
// No additional logic needed - this is a pure layout component
</script>