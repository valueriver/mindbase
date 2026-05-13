<template>
  <div class="flex min-h-screen flex-col">
    <!-- 顶栏(PC / 移动端一致) -->
    <header class="sticky top-0 z-40 flex h-11 items-center justify-between border-b border-nt-divider bg-white/95 px-3 backdrop-blur">
      <div class="flex items-center gap-0.5">
        <button
          type="button"
          class="flex h-8 w-8 items-center justify-center rounded text-nt-muted hover:bg-nt-hover"
          :title="open ? '收起侧边栏' : '展开侧边栏'"
          @click="toggle"
        ><span class="text-base leading-none">☰</span></button>
        <router-link :to="{ name: 'home' }" class="px-1.5 text-sm font-semibold text-nt">
          MindBase
        </router-link>
      </div>

      <button
        v-if="user"
        ref="avatarBtn"
        type="button"
        class="flex h-7 w-7 items-center justify-center overflow-hidden rounded-full bg-nt-hover hover:bg-nt-hover-strong"
        @click="toggleMenu"
      >
        <img
          v-if="user.avatar_url"
          :src="user.avatar_url"
          referrerpolicy="no-referrer"
          class="h-full w-full object-cover"
          alt=""
        />
        <span v-else class="text-xs text-nt-muted">{{ (user.name || user.email || '').slice(0, 1).toUpperCase() }}</span>
      </button>

      <Popover :open="menuOpen" :anchor="menuAnchor" :width="220" @close="menuOpen = false">
        <div class="flex items-center gap-2 px-2 py-1.5">
          <div class="min-w-0 flex-1">
            <div class="truncate text-sm font-medium text-nt">{{ user?.name }}</div>
            <div class="truncate text-xs text-nt-soft">{{ user?.email }}</div>
          </div>
        </div>
        <div class="my-1 h-px bg-nt-divider" />
        <button
          type="button"
          class="flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-sm text-nt hover:bg-nt-hover"
          @click="goTo('assistant-settings')"
        ><span>⚙</span> 设置</button>
        <button
          type="button"
          class="flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-sm text-nt hover:bg-nt-hover"
          @click="goTo('assistant-authorize')"
        ><span>🔑</span> 对外授权</button>
        <div class="my-1 h-px bg-nt-divider" />
        <button
          type="button"
          class="flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-sm text-nt hover:bg-nt-hover"
          @click="onLogout"
        ><span>↩</span> 退出登录</button>
      </Popover>
    </header>

    <!-- 主体:侧栏 + 内容 -->
    <div class="relative flex flex-1">
      <!-- 侧栏:PC 在文档流里(宽度动画),移动端 fixed 抽屉 -->
      <aside
        :class="[
          'z-30 overflow-hidden border-r border-nt-divider bg-white transition-[width,transform] duration-200',
          // 移动端 fixed 抽屉(top:44px、bottom:0)
          'fixed top-11 bottom-0 left-0 w-64 max-w-[80%]',
          open ? 'translate-x-0' : '-translate-x-full',
          // PC 改为 sticky 跟内容并排
          'md:sticky md:top-11 md:bottom-auto md:h-[calc(100vh-2.75rem)] md:translate-x-0 md:max-w-none',
          open ? 'md:w-60' : 'md:w-0 md:border-r-0',
        ]"
      >
        <nav class="flex h-full flex-col gap-0.5 p-2">
          <SidebarLink
            v-for="m in modules"
            :key="m.name"
            :to="m.to"
            :icon="m.icon"
            :label="m.label"
            :active="isActive(m)"
            @click="onNavClick"
          />
        </nav>
      </aside>

      <!-- 移动端遮罩 -->
      <Transition name="fade">
        <div
          v-if="open"
          class="fixed inset-x-0 bottom-0 top-11 z-20 bg-black/30 md:hidden"
          @click="open = false"
        />
      </Transition>

      <!-- 内容 -->
      <main class="min-w-0 flex-1">
        <slot />
      </main>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import Popover from './Popover.vue'
import SidebarLink from './SidebarLink.vue'
import { useAuth, logout } from '@/composables/useAuth'

const route   = useRoute()
const router  = useRouter()
const { user } = useAuth()

const STORAGE_KEY = 'mindbase.sidebar.open'
const open = ref(false)

onMounted(() => {
  try {
    const v = localStorage.getItem(STORAGE_KEY)
    // 首次进入:PC 默认展开,移动端默认收起
    if (v === '1' || v === '0') open.value = v === '1'
    else open.value = window.matchMedia('(min-width: 768px)').matches
  } catch {}
})

function toggle() {
  open.value = !open.value
  try { localStorage.setItem(STORAGE_KEY, open.value ? '1' : '0') } catch {}
}

const modules = [
  { name: 'memos',     to: '/memos',     icon: '💡', label: '想法', match: (p) => p.startsWith('/memos') },
  { name: 'notes',     to: '/',          icon: '📚', label: '笔记', match: (p) => p === '/' || p.startsWith('/notebook') || p.startsWith('/note') },
  { name: 'assistant', to: '/assistant', icon: '🤖', label: '助理', match: (p) => p === '/assistant' || (p.startsWith('/assistant') && !p.startsWith('/assistant/settings') && !p.startsWith('/assistant/authorize')) },
]

function isActive(m) {
  return m.match(route.path)
}

// 移动端:点击导航后自动关闭抽屉;PC 端保持
function onNavClick() {
  if (!window.matchMedia('(min-width: 768px)').matches) {
    open.value = false
  }
}

// —— 顶栏头像菜单 ——
const avatarBtn  = ref(null)
const menuOpen   = ref(false)
const menuAnchor = ref(null)

function toggleMenu() {
  if (menuOpen.value) { menuOpen.value = false; return }
  menuAnchor.value = avatarBtn.value?.getBoundingClientRect() || null
  menuOpen.value = true
}

function goTo(name) {
  menuOpen.value = false
  router.push({ name })
}

async function onLogout() {
  menuOpen.value = false
  await logout()
  router.replace({ name: 'welcome' })
}
</script>
