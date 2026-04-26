import { createRouter, createWebHistory } from 'vue-router'
import { checkAuth, useAuth } from '@/composables/useAuth'

const routes = [
  { path: '/welcome',      name: 'welcome',  component: () => import('@/views/Welcome.vue'),  meta: { guestOnly: true } },
  { path: '/',             name: 'home',     component: () => import('@/views/Home.vue') },
  { path: '/notebook/:id', name: 'notebook', component: () => import('@/views/Notebook.vue'), props: true },
  { path: '/note/:id',     name: 'note',     component: () => import('@/views/Note.vue'),     props: true },
  { path: '/ai',           name: 'ai',       component: () => import('@/views/Ai.vue') },
  { path: '/:pathMatch(.*)*', redirect: '/' },
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
  scrollBehavior(to, from, savedPosition) {
    // 浏览器前进/后退:恢复之前的位置
    if (savedPosition) return savedPosition
    // 锚点跳转:滚到锚点
    if (to.hash) return { el: to.hash, behavior: 'smooth' }
    // 其它路由切换:始终回到顶部
    return { top: 0 }
  },
})

router.beforeEach(async (to) => {
  await checkAuth()
  const { isAuthenticated } = useAuth()

  if (to.meta.guestOnly && isAuthenticated.value) return { name: 'home' }
  if (!to.meta.guestOnly && !isAuthenticated.value) return { name: 'welcome' }
  return true
})

export default router
