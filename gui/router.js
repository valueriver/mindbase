import { createRouter, createWebHistory } from 'vue-router'
import { checkAuth, useAuth } from '@/composables/useAuth'

const DEFAULT_PATH = '/home'  // 登录后默认进的应用

const routes = [
  { path: '/welcome',             name: 'welcome',     component: () => import('@/apps/welcome.vue'), meta: { guestOnly: true } },
  { path: '/',                    redirect: DEFAULT_PATH },
  { path: '/notes',               name: 'notes',       component: () => import('@/apps/notes/home.vue') },
  { path: '/notebook/:id',        name: 'notebook',    component: () => import('@/apps/notes/notebook.vue'),  props: true },
  { path: '/note/:id',            name: 'note',        component: () => import('@/apps/notes/detail.vue'), props: true },
  { path: '/home',                name: 'home',        component: () => import('@/apps/home/index.vue') },
  { path: '/todos',               name: 'todos',       component: () => import('@/apps/todos/index.vue') },
  { path: '/ledger',              name: 'ledger',      component: () => import('@/apps/ledger/index.vue') },
  { path: '/search',              name: 'search',      component: () => import('@/apps/search/index.vue') },
  { path: '/profile',             name: 'profile',     component: () => import('@/apps/profile/index.vue') },
  { path: '/bookmarks',           name: 'bookmarks',   component: () => import('@/apps/bookmarks/index.vue') },
  { path: '/music',               name: 'music',       component: () => import('@/apps/music/index.vue') },
  { path: '/movies',              name: 'movies',      component: () => import('@/apps/movies/index.vue') },
  { path: '/books',               name: 'books',       component: () => import('@/apps/books/index.vue') },
  { path: '/webs',                name: 'webs',        component: () => import('@/apps/webs/index.vue') },
  { path: '/calendar',            name: 'calendar',    component: () => import('@/apps/calendar/index.vue') },
  { path: '/travel',              name: 'travel',      component: () => import('@/apps/travel/index.vue') },
  { path: '/projects',            name: 'projects',    component: () => import('@/apps/projects/index.vue') },
  { path: '/subs',                name: 'subs',        component: () => import('@/apps/subs/index.vue') },
  { path: '/vault',               name: 'vault',       component: () => import('@/apps/vault/index.vue') },
  { path: '/resume',              name: 'resume',      component: () => import('@/apps/resume/index.vue') },
  { path: '/cards',               name: 'cards',       component: () => import('@/apps/cards/index.vue') },
  { path: '/accounts',            name: 'accounts',    component: () => import('@/apps/accounts/index.vue') },
  { path: '/emails',              name: 'emails',      component: () => import('@/apps/emails/index.vue') },
  { path: '/memories',            name: 'memories',    component: () => import('@/apps/memories/index.vue') },
  { path: '/domains',             name: 'domains',     component: () => import('@/apps/domains/index.vue') },
  { path: '/articles',            name: 'articles',    component: () => import('@/apps/articles/index.vue') },
  { path: '/assets',              name: 'assets',      component: () => import('@/apps/assets/index.vue') },
  { path: '/medical',             name: 'medical',     component: () => import('@/apps/medical/index.vue') },
  { path: '/games',               name: 'games',       component: () => import('@/apps/games/index.vue') },
  { path: '/apps',                name: 'apps',        component: () => import('@/apps/apps/index.vue') },
  { path: '/photos',              name: 'photos',      component: () => import('@/apps/photos/index.vue') },
  { path: '/manuals',             name: 'manuals',     component: () => import('@/apps/manuals/index.vue') },
  { path: '/footprints',          name: 'footprints',  component: () => import('@/apps/footprints/index.vue') },
  { path: '/docs',                name: 'docs',        component: () => import('@/apps/docs/index.vue') },
  { path: '/wishlist',            name: 'wishlist',    component: () => import('@/apps/wishlist/index.vue') },
  { path: '/contacts',            name: 'contacts',    component: () => import('@/apps/contacts/index.vue') },
  { path: '/prompts',             name: 'prompts',     component: () => import('@/apps/prompts/index.vue') },
  { path: '/servers',             name: 'servers',     component: () => import('@/apps/servers/index.vue') },
  { path: '/llms',                name: 'llms',        component: () => import('@/apps/llms/index.vue') },
  { path: '/apikeys',             name: 'apikeys',     component: () => import('@/apps/apikeys/index.vue') },
  { path: '/health',              name: 'health',      component: () => import('@/apps/health/index.vue') },
  { path: '/recipes',             name: 'recipes',     component: () => import('@/apps/recipes/index.vue') },
  { path: '/devices',             name: 'devices',     component: () => import('@/apps/devices/index.vue') },
  { path: '/exhibitions',         name: 'exhibitions', component: () => import('@/apps/exhibitions/index.vue') },
  { path: '/concerts',            name: 'concerts',    component: () => import('@/apps/concerts/index.vue') },
  { path: '/goals',               name: 'goals',       component: () => import('@/apps/goals/index.vue') },
  { path: '/chat',                name: 'chat',        component: () => import('@/apps/chat/index.vue') },
  { path: '/settings',            name: 'settings',    component: () => import('@/apps/settings/index.vue') },
  { path: '/collab',              name: 'collab',      component: () => import('@/apps/collab/index.vue') },
  { path: '/layout',              name: 'layout',      component: () => import('@/apps/layout/index.vue') },
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
