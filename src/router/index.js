import { createRouter, createWebHistory } from 'vue-router'
import { checkAuth, useAuth } from '@/composables/useAuth'

const routes = [
  { path: '/welcome',       name: 'welcome',           component: () => import('@/views/Welcome.vue'),           meta: { guestOnly: true } },
  { path: '/',              name: 'home',              component: () => import('@/views/Home.vue') },
  { path: '/notebook/:id',  name: 'notebook',          component: () => import('@/views/Notebook.vue'),          props: true },
  { path: '/note/:id',      name: 'note',              component: () => import('@/views/Note.vue'),              props: true },
  { path: '/memos',         name: 'memos',             component: () => import('@/views/Memos.vue') },
  { path: '/todos',         name: 'todos',             component: () => import('@/views/Todos.vue') },
  { path: '/search',        name: 'search',            component: () => import('@/views/Search.vue') },
  { path: '/assistant',     name: 'assistant',         component: () => import('@/views/Assistant.vue') },
  { path: '/assistant/settings', name: 'assistant-settings', component: () => import('@/views/AssistantSettings.vue') },
  // 老链接兼容:授权页并入设置的 tab
  { path: '/assistant/authorize', redirect: { name: 'assistant-settings', query: { tab: 'collab' } } },
  { path: '/ai', redirect: { name: 'assistant-settings', query: { tab: 'collab' } } },
  { path: '/:pathMatch(.*)*', redirect: '/' },
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
  scrollBehavior(to, from, savedPosition) {
    if (savedPosition) return savedPosition
    if (to.hash) return { el: to.hash, behavior: 'smooth' }
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
