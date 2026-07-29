import { createRouter, createWebHistory } from 'vue-router'
import { useUserStore } from '../stores'
import AppLayout from '../layouts/AppLayout.vue'

/**
 * 应用路由：布局壳 + 业务页；requiresAuth 由守卫校验
 */
const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      component: AppLayout,
      children: [
        {
          path: '',
          name: 'home',
          component: () => import('../views/HomeView.vue'),
        },
        {
          path: 'login',
          name: 'login',
          component: () => import('../views/LoginView.vue'),
          meta: { guestOnly: true },
        },
        {
          path: 'register',
          name: 'register',
          component: () => import('../views/RegisterView.vue'),
          meta: { guestOnly: true },
        },
        {
          path: 'items/new',
          name: 'item-create',
          component: () => import('../views/ItemFormView.vue'),
          meta: { requiresAuth: true },
        },
        {
          path: 'items/:id/edit',
          name: 'item-edit',
          component: () => import('../views/ItemFormView.vue'),
          meta: { requiresAuth: true },
        },
        {
          path: 'items/:id',
          name: 'item-detail',
          component: () => import('../views/ItemDetailView.vue'),
        },
        {
          path: 'my/items',
          name: 'my-items',
          component: () => import('../views/MyItemsView.vue'),
          meta: { requiresAuth: true },
        },
        {
          path: 'my/favorites',
          name: 'my-favorites',
          component: () => import('../views/MyFavoritesView.vue'),
          meta: { requiresAuth: true },
        },
      ],
    },
  ],
  scrollBehavior() {
    return { top: 0 }
  },
})

router.beforeEach((to) => {
  const userStore = useUserStore()
  if (to.meta.requiresAuth && !userStore.isLoggedIn) {
    return {
      name: 'login',
      query: { redirect: to.fullPath },
    }
  }
  if (to.meta.guestOnly && userStore.isLoggedIn) {
    return { name: 'home' }
  }
  return true
})

export default router
