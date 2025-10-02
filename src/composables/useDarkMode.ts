import { ref } from 'vue'

export function useDarkMode() {
  // Always return true to force dark mode
  const isDark = ref(true)

  // No-op toggle function (keeping for compatibility)
  const toggle = () => {
    // Do nothing - always stay in dark mode
  }

  return {
    isDark,
    toggle,
  }
}
