<template>
  <div class="flex flex-col h-full">
    <!-- Main content area -->
    <div class="flex-1 flex overflow-hidden">
      <!-- Data display area -->
      <div class="flex-1 overflow-auto">
        <slot />
      </div>
      
      <!-- Settings sidebar -->
      <div class="w-80 border-l border-border bg-muted/30 overflow-auto">
        <div class="p-4">
          <slot name="settings" />
        </div>
      </div>
    </div>
    
    <!-- Footer with action buttons -->
    <div class="border-t border-border p-4 bg-background">
      <slot name="footer" />
    </div>
  </div>
</template>

<script setup lang="ts">
// No additional logic needed - this is a pure layout component
</script>