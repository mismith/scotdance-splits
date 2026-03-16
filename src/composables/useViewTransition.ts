import { type Ref, nextTick, ref } from 'vue'
import { startViewTransition } from 'vue-view-transitions'

/**
 * Composable for managing view transitions with optional transitioning state tracking.
 * @param {Ref<boolean>} [transitioningRef] - Optional external ref to track transition state
 * @returns {{ isTransitioning: Ref<boolean>, withViewTransition: Function }}
 */
export function useViewTransition(transitioningRef?: Ref<boolean>) {
  const isTransitioning = transitioningRef ?? ref(false)

  async function withViewTransition(callback: () => void) {
    isTransitioning.value = true
    await nextTick()

    const viewTransition = startViewTransition()
    await viewTransition.captured
    callback()

    await viewTransition.finished
    isTransitioning.value = false
  }

  return { isTransitioning, withViewTransition }
}
