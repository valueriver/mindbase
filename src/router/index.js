import { createRouter, createWebHistory } from 'vue-router'
import { checkAuth, useAuth } from '@/composables/useAuth'

const routes = [
  { path: '/welcome',      name: 'welcome',  component: () => import('@/views/Welcome.vue'),  meta: { guestOnly: true } },
  { path: '/',             name: 'home',     component: () => import('@/views/Home.vue') },
  { path: '/n/:id',        name: 'notebook', component: () => import('@/views/Notebook.vue'), props: true },
  { path: '/note/:id',     name: 'note',     component: () => import('@/views/Note.vue'),     props: true },
  { path: '/:pathMatch(.*)*', redirect: '/' },
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
})

router.beforeEach(async (to) => {
  await checkAuth()
  const { isAuthenticated } = useAuth()

  if (to.meta.guestOnly && isAuthenticated.value) return { name: 'home' }
  if (!to.meta.guestOnly && !isAuthenticated.value) return { name: 'welcome' }
  return true
})

export default router
