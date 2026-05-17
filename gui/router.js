import { createRouter, createWebHistory } from 'vue-router'
import { checkAuth, useAuth } from '@/system/composables/useAuth'

const DEFAULT_PATH = '/home'  // 登录后默认进的应用

// 文件系统即路由表 —— `apps/<name>/index.vue` 和 `system/apps/<name>/index.vue`
// 各自映射到 `/<name>`。装一个新包,把目录丢进去就有路由,不用改 router。
//
// 例外:welcome(登录)、layout、create —— 不属于上下文应用,显式列出。
const userPages   = import.meta.glob('@/apps/*/index.vue')
const systemPages = import.meta.glob('@/system/apps/*/index.vue')

const toRoute = ([path, loader]) => {
  const name = path.match(/\/([^/]+)\/index\.vue$/)[1]
  return { path: `/${name}`, name, component: loader }
}

const routes = [
  // 登录页(无需认证)
  { path: '/welcome',         name: 'welcome', component: () => import('@/system/apps/user/welcome.vue'), meta: { guestOnly: true } },
  { path: '/',                redirect: DEFAULT_PATH },

  // 应用路由(自动派生)
  ...Object.entries(userPages).map(toRoute),
  ...Object.entries(systemPages).filter(([p]) => !p.endsWith('/user/index.vue')).map(toRoute),

  // 系统页(无应用归属)
  { path: '/create',          name: 'create', component: () => import('@/system/create/index.vue') },
  { path: '/layout',          name: 'layout', component: () => import('@/system/layout/index.vue') },

  // 笔记的子路由(notes 应用是多视图,glob 派生只覆盖 /notes 列表页)
  { path: '/notebook/:id',    name: 'notebook', component: () => import('@/apps/notes/notebook.vue'), props: true },
  { path: '/note/:id',        name: 'note',     component: () => import('@/apps/notes/detail.vue'),   props: true },

  { path: '/:pathMatch(.*)*', redirect: DEFAULT_PATH },
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
