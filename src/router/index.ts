import { createRouter, createWebHistory } from 'vue-router'
import { startViewTransition } from 'vue-view-transitions'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
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

  const transition = startViewTransition()
  await transition.captured
})

export default router
