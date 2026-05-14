import { createRouter, createWebHistory } from 'vue-router'
import { checkAuth, useAuth } from '@/composables/useAuth'

const DEFAULT_PATH = '/memos'  // 登录后默认进的应用

const routes = [
  { path: '/welcome',             name: 'welcome',     component: () => import('@/views/welcome/index.vue'), meta: { guestOnly: true } },
  { path: '/',                    redirect: DEFAULT_PATH },
  { path: '/notes',               name: 'home',        component: () => import('@/views/home/index.vue') },
  { path: '/notebook/:id',        name: 'notebook',    component: () => import('@/views/notes/index.vue'),  props: true },
  { path: '/note/:id',            name: 'note',        component: () => import('@/views/notes/detail.vue'), props: true },
  { path: '/memos',               name: 'memos',       component: () => import('@/views/memos/index.vue') },
  { path: '/todos',               name: 'todos',       component: () => import('@/views/todos/index.vue') },
  { path: '/ledger',              name: 'ledger',      component: () => import('@/views/ledger/index.vue') },
  { path: '/ledger/new',          name: 'ledger-new',  component: () => import('@/views/ledger/edit.vue') },
  { path: '/ledger/:id',          name: 'ledger-edit', component: () => import('@/views/ledger/edit.vue'), props: true },
  { path: '/search',              name: 'search',      component: () => import('@/views/search/index.vue') },
  { path: '/memory',              name: 'memory',      component: () => import('@/views/memory/index.vue') },
  { path: '/memory/new',          name: 'memory-new',  component: () => import('@/views/memory/edit.vue') },
  { path: '/memory/:id',          name: 'memory-edit', component: () => import('@/views/memory/edit.vue'), props: true },
  { path: '/assistant',           name: 'assistant',   component: () => import('@/views/assistant/index.vue') },
  { path: '/assistant/settings',  name: 'assistant-settings', component: () => import('@/views/settings/index.vue') },
  { path: '/assistant/authorize', redirect: { name: 'assistant-settings', query: { tab: 'collab' } } },
  { path: '/ai',                  redirect: { name: 'assistant-settings', query: { tab: 'collab' } } },
  { path: '/:pathMatch(.*)*',     redirect: DEFAULT_PATH },
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
  if (to.meta.guestOnly && isAuthenticated.value) return DEFAULT_PATH
  if (!to.meta.guestOnly && !isAuthenticated.value) return { name: 'welcome' }
  return true
})

export default router
