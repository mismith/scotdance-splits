import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: () => import('@/views/HomeView.vue')
    },
    {
      path: '/splits',
      name: 'splits',
      component: () => import('@/views/SplitsView.vue')
    },
    {
      path: '/input',
      name: 'input',
      component: () => import('@/views/InputView.vue')
    },
    {
      path: '/output',
      name: 'output',
      component: () => import('@/views/OutputView.vue')
    }
  ]
})

export default router