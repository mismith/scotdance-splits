import { useDark, useToggle } from '@vueuse/core'

export function useDarkMode() {
  const isDark = useDark({
    selector: 'html',
    attribute: 'style',
    valueDark: 'color-scheme: dark',
    valueLight: 'color-scheme: light',
  })

  const toggle = useToggle(isDark)

  return {
    isDark,
    toggle,
  }
}
