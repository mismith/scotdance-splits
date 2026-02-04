import { nextTick } from 'vue'
import { createRouter, createWebHistory } from 'vue-router'
import { startViewTransition } from 'vue-view-transitions'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  scrollBehavior(_to, _from, savedPosition) {
    if (savedPosition) {
      return savedPosition
    } else {
      return { top: 0, left: 0 }
    }
  },
  routes: [
    {
      path: '/',
      name: 'home',
      component: () => import('@/views/HomeView.vue'),
    },
    {
      path: '/splits',
      name: 'splits',
      component: () => import('@/views/SplitsView.vue'),
    },
    {
      path: '/demo',
      name: 'demo',
      component: () => import('@/views/SplitsView.vue'),
    },
  ],
})

router.beforeResolve(async (to, from) => {
  if (from.matched.length === 0) {
    // Initial page load, no transition
    return
  }

  // Determine slide direction: home=0, splits/demo=1
  const fromCol = from.name === 'home' ? 0 : 1
  const toCol = to.name === 'home' ? 0 : 1
  const direction = toCol > fromCol ? 'slide-left' : 'slide-right'

  // Set view-transition-name on document element
  document.documentElement.style.viewTransitionName = direction
  await nextTick()

  const transition = startViewTransition()
  await transition.captured

  // Clear after transition completes
  transition.finished.finally(() => {
    document.documentElement.style.viewTransitionName = ''
  })
})

export default router
