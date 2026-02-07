/**
 * router/index.ts
 *
 * Manual routes configuration
 */

import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: () => import('@/pages/HomePage.vue')
    },
    {
      path: '/config',
      name: 'config',
      component: () => import('@/pages/ConfigPage.vue')
    }
  ]
})

export default router
