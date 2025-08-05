import { useDark, useToggle } from '@vueuse/core'

export function useDarkMode() {
  const isDark = useDark()

  const toggle = useToggle(isDark)

  return {
    isDark,
    toggle,
  }
}
