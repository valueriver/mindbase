<template>
  <div class="flex min-h-dvh flex-col">
    <header class="sticky top-0 z-40 flex h-11 items-center justify-between border-b border-nt-divider bg-white/95 px-3 backdrop-blur md:px-4">
      <div class="flex min-w-0 items-center gap-1.5 px-1">
        <span class="text-base leading-none">{{ currentApp.icon }}</span>
        <h1 class="truncate text-sm font-semibold text-nt">{{ currentApp.label }}</h1>
      </div>

      <button
        ref="launcherBtn"
        type="button"
        class="flex h-8 w-8 items-center justify-center rounded text-nt-muted hover:bg-nt-hover hover:text-nt"
        :title="launcherOpen ? '关闭' : '切换应用'"
        @click="toggleLauncher"
      >
        <svg width="18" height="18" viewBox="0 0 18 18" fill="currentColor" aria-hidden="true">
          <rect x="1"  y="1"  width="7" height="7" rx="1.4"/>
          <rect x="10" y="1"  width="7" height="7" rx="1.4"/>
          <rect x="1"  y="10" width="7" height="7" rx="1.4"/>
          <rect x="10" y="10" width="7" height="7" rx="1.4"/>
        </svg>
      </button>

      <Popover :open="launcherOpen" :anchor="launcherAnchor" :width="320" @close="launcherOpen = false">
        <div class="flex items-center justify-between px-2 pt-1 pb-1">
          <span class="text-[10px] font-medium uppercase tracking-wider text-nt-soft">应用</span>
          <div class="flex items-center gap-0.5">
            <button
              type="button"
              class="flex items-center gap-1 rounded px-1.5 py-0.5 text-[11px] text-nt-muted hover:bg-nt-hover hover:text-nt"
              title="应用市场"
              @click="onMarket"
            ><span>🛍️</span><span>市场</span></button>
            <button
              type="button"
              class="flex items-center gap-1 rounded px-1.5 py-0.5 text-[11px] text-nt-muted hover:bg-nt-hover hover:text-nt"
              title="创建新应用"
              @click="onCreate"
            ><span>＋</span><span>创建</span></button>
          </div>
        </div>
        <div class="max-h-[60vh] overflow-y-auto">
          <div class="grid grid-cols-3 gap-1 px-1">
            <button
              v-for="app in apps"
              :key="app.name"
              type="button"
              :disabled="!app.to"
              :class="[
                'flex flex-col items-center justify-center gap-1 rounded-md py-3 transition',
                isActive(app)
                  ? 'bg-nt-hover-strong text-nt'
                  : app.to
                    ? 'text-nt hover:bg-nt-hover'
                    : 'cursor-not-allowed text-nt opacity-40',
              ]"
              @click="goTo(app)"
            >
              <span class="text-2xl leading-none">{{ app.icon }}</span>
              <span class="text-[11px] font-medium">{{ app.label }}</span>
            </button>
          </div>
        </div>

        <div class="mt-2 border-t border-nt-divider"></div>
        <div class="grid grid-cols-3 gap-1 px-1 pt-1 pb-1">
          <button
            v-for="sys in systems"
            :key="sys.name"
            type="button"
            :class="[
              'flex flex-col items-center justify-center gap-1 rounded-md py-3 transition',
              isActive(sys)
                ? 'bg-nt-hover-strong text-nt'
                : 'text-nt hover:bg-nt-hover',
            ]"
            @click="goTo(sys)"
          >
            <span class="text-2xl leading-none">{{ sys.icon }}</span>
            <span class="text-[11px] font-medium">{{ sys.label }}</span>
          </button>
        </div>
      </Popover>
    </header>

    <main class="min-w-0 flex-1">
      <slot />
    </main>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import Popover from './Popover.vue'

const route   = useRoute()
const router  = useRouter()

// 应用 = 上下文载体。to 为 null 表示模块尚未实现,显示但不可点。
const apps = [
  { name: 'feed',      icon: '🌊', label: '动态',     to: { name: 'feed' },    match: (p) => p.startsWith('/feed') },
  { name: 'todos',     icon: '✅', label: '待办',     to: { name: 'todos' },   match: (p) => p.startsWith('/todos') },
  { name: 'ledger',    icon: '💰', label: '记账',     to: { name: 'ledger' },  match: (p) => p.startsWith('/ledger') },
  { name: 'notes',     icon: '📚', label: '笔记',     to: { name: 'home' },    match: (p) => p === '/' || p === '/notes' || p.startsWith('/notebook') || p.startsWith('/note') },
  { name: 'bookmarks', icon: '🔖', label: '收藏',     to: { name: 'bookmarks' },                match: (p) => p.startsWith('/bookmarks') },
  { name: 'music',     icon: '🎵', label: '音乐',     to: { name: 'music' },                    match: (p) => p.startsWith('/music') },
  { name: 'movies',    icon: '🎬', label: '电影',     to: { name: 'movies' },                   match: (p) => p.startsWith('/movies') },
  { name: 'books',     icon: '📖', label: '书单',     to: { name: 'books' },                    match: (p) => p.startsWith('/books') },
  { name: 'outline',   icon: '📑', label: '大纲',     to: null,                match: (p) => p.startsWith('/outline') },
  { name: 'mindmap',   icon: '🕸️', label: '思维导图', to: null,                match: (p) => p.startsWith('/mindmap') },
  { name: 'webs',      icon: '🪟', label: '网页',     to: { name: 'webs' },                     match: (p) => p.startsWith('/webs') },
  { name: 'calendar',  icon: '📅', label: '日程',     to: { name: 'calendar' },                 match: (p) => p.startsWith('/calendar') },
  { name: 'travel',    icon: '✈️', label: '旅行',     to: { name: 'travel' },                   match: (p) => p.startsWith('/travel') },
  { name: 'projects',  icon: '📂', label: '项目',     to: { name: 'projects' },                 match: (p) => p.startsWith('/projects') },
  { name: 'subs',      icon: '💸', label: '订阅',     to: { name: 'subs' },                     match: (p) => p.startsWith('/subs') },
  { name: 'vault',     icon: '🔐', label: '密码箱',   to: { name: 'vault' },                    match: (p) => p.startsWith('/vault') },
  { name: 'resume',    icon: '📄', label: '简历',     to: { name: 'resume' },                   match: (p) => p.startsWith('/resume') },
  { name: 'cards',     icon: '💳', label: '银行卡',   to: { name: 'cards' },                    match: (p) => p.startsWith('/cards') },
  { name: 'accounts',  icon: '🆔', label: '网络账号', to: { name: 'accounts' },                 match: (p) => p.startsWith('/accounts') },
  { name: 'emails',    icon: '📧', label: '邮箱',     to: { name: 'emails' },                   match: (p) => p.startsWith('/emails') },
  { name: 'memories',  icon: '🕰️', label: '回忆',     to: { name: 'memories' },                 match: (p) => p.startsWith('/memories') },
  { name: 'domains',   icon: '🌐', label: '域名',     to: { name: 'domains' },                  match: (p) => p.startsWith('/domains') },
  { name: 'articles',  icon: '✍️', label: '文章',     to: { name: 'articles' },                 match: (p) => p.startsWith('/articles') },
  { name: 'assets',    icon: '💎', label: '资产',     to: { name: 'assets' },                   match: (p) => p.startsWith('/assets') },
  { name: 'medical',   icon: '🏥', label: '病例',     to: { name: 'medical' },                  match: (p) => p.startsWith('/medical') },
  { name: 'games',     icon: '🎮', label: '游戏',     to: { name: 'games' },                    match: (p) => p.startsWith('/games') },
  { name: 'apps',      icon: '📱', label: 'App',      to: { name: 'apps' },                     match: (p) => p.startsWith('/apps') },
  { name: 'photos',    icon: '🖼️', label: '影集',     to: { name: 'photos' },                   match: (p) => p.startsWith('/photos') },
  { name: 'manuals',   icon: '📘', label: '说明书',   to: { name: 'manuals' },                  match: (p) => p.startsWith('/manuals') },
  { name: 'footprints', icon: '🗺️', label: '足迹',     to: { name: 'footprints' },              match: (p) => p.startsWith('/footprints') },
  { name: 'docs',      icon: '🛂', label: '证件库',   to: { name: 'docs' },                     match: (p) => p.startsWith('/docs') },
  { name: 'wishlist',  icon: '🎁', label: '心愿单',   to: { name: 'wishlist' },                 match: (p) => p.startsWith('/wishlist') },
  { name: 'contacts',  icon: '👥', label: '通讯录',   to: { name: 'contacts' },                 match: (p) => p.startsWith('/contacts') },
  { name: 'prompts',   icon: '📜', label: '指令集',   to: { name: 'prompts' },                  match: (p) => p.startsWith('/prompts') },
  { name: 'servers',   icon: '🖥️', label: '服务器',   to: { name: 'servers' },                  match: (p) => p.startsWith('/servers') },
  { name: 'llms',      icon: '🤖', label: '大模型',   to: { name: 'llms' },                     match: (p) => p.startsWith('/llms') },
  { name: 'apikeys',   icon: '🔑', label: 'API',      to: { name: 'apikeys' },                  match: (p) => p.startsWith('/apikeys') },
  { name: 'health',    icon: '❤️', label: '健康',     to: { name: 'health' },                   match: (p) => p.startsWith('/health') },
  { name: 'recipes',   icon: '🍳', label: '菜谱',     to: { name: 'recipes' },                  match: (p) => p.startsWith('/recipes') },
  { name: 'devices',   icon: '💻', label: '设备',     to: { name: 'devices' },                  match: (p) => p.startsWith('/devices') },
  { name: 'exhibitions', icon: '🎨', label: '展览',   to: { name: 'exhibitions' },              match: (p) => p.startsWith('/exhibitions') },
  { name: 'concerts',  icon: '🎤', label: '演唱会',   to: { name: 'concerts' },                 match: (p) => p.startsWith('/concerts') },
  { name: 'goals',     icon: '🎯', label: '目标',     to: { name: 'goals' },                    match: (p) => p.startsWith('/goals') },
  { name: 'profile',   icon: '🪪', label: '个人档',   to: { name: 'profile' }, match: (p) => p.startsWith('/profile') },
]

// 系统级别 — 不是上下文,是产品功能。
const systems = [
  { name: 'chat',     icon: '💬', label: '对话', to: { name: 'chat' },     match: (p) => p === '/chat' },
  { name: 'collab',   icon: '🔗', label: '协作', to: { name: 'collab' },   match: (p) => p.startsWith('/collab') },
  { name: 'settings', icon: '⚙️', label: '设置', to: { name: 'settings' }, match: (p) => p.startsWith('/settings') },
]

function isActive(app) {
  return app.match(route.path)
}

const currentApp = computed(() => {
  const a = [...apps, ...systems].find(isActive)
  return a || { icon: '🧠', label: 'MindBase' }
})

const launcherBtn    = ref(null)
const launcherOpen   = ref(false)
const launcherAnchor = ref(null)

function toggleLauncher() {
  if (launcherOpen.value) { launcherOpen.value = false; return }
  launcherAnchor.value = launcherBtn.value || null
  launcherOpen.value = true
}

function goTo(app) {
  launcherOpen.value = false
  if (!app.to) return
  router.push(app.to)
}

function onMarket() {
  launcherOpen.value = false
}

function onCreate() {
  launcherOpen.value = false
}
</script>
