<template>
  <div class="md:flex md:items-stretch min-h-screen">

    <!-- PC 侧栏 (md+) -->
    <aside
      :class="[
        'hidden md:flex md:flex-col md:shrink-0 md:sticky md:top-0 md:h-screen',
        'border-r border-nt-divider bg-white transition-[width] duration-200',
        collapsed ? 'md:w-14' : 'md:w-60',
      ]"
    >
      <div :class="['flex items-center px-2 py-2.5', collapsed ? 'justify-center' : 'justify-between gap-2']">
        <router-link
          v-if="!collapsed"
          :to="{ name: 'home' }"
          class="flex items-center gap-2 px-2 text-sm font-semibold text-nt"
        >
          <span class="text-base">🧠</span>
          <span>MindBase</span>
        </router-link>
        <button
          type="button"
          class="flex h-8 w-8 items-center justify-center rounded text-nt-muted hover:bg-nt-hover"
          :title="collapsed ? '展开' : '收起'"
          @click="toggle"
        >
          <span class="text-base leading-none">☰</span>
        </button>
      </div>

      <nav class="mt-1 flex-1 space-y-0.5 px-2">
        <SidebarLink
          v-for="m in modules"
          :key="m.name"
          :to="m.to"
          :icon="m.icon"
          :label="m.label"
          :collapsed="collapsed"
          :active="isActive(m)"
        />
      </nav>

      <div class="border-t border-nt-divider px-2 py-2 space-y-0.5">
        <SidebarLink
          to="/assistant/settings"
          icon="⚙"
          label="设置"
          :collapsed="collapsed"
          :active="route.path === '/assistant/settings'"
        />
        <button
          type="button"
          :class="[
            'flex w-full items-center gap-2 rounded px-2 py-1.5 text-sm text-nt-muted hover:bg-nt-hover hover:text-nt',
            collapsed ? 'justify-center' : '',
          ]"
          :title="collapsed ? '退出登录' : ''"
          @click="onLogout"
        >
          <span class="text-base leading-none">↩</span>
          <span v-if="!collapsed" class="truncate">退出</span>
        </button>
      </div>
    </aside>

    <!-- 主区域 -->
    <div class="flex-1 min-w-0 flex flex-col min-h-screen md:min-h-0">

      <!-- 移动端顶栏 -->
      <header
        class="md:hidden sticky top-0 z-30 flex h-11 items-center justify-between border-b border-nt-divider bg-white/95 px-3 backdrop-blur"
      >
        <button
          type="button"
          class="flex h-8 w-8 items-center justify-center rounded hover:bg-nt-hover"
          @click="drawerOpen = true"
        ><span class="text-base">☰</span></button>
        <span class="text-sm font-semibold text-nt">{{ currentLabel }}</span>
        <span class="w-8" />
      </header>

      <!-- 路由内容 -->
      <div class="flex-1 min-w-0 pb-14 md:pb-0">
        <slot />
      </div>
    </div>

    <!-- 移动端底部 dock -->
    <nav
      class="md:hidden fixed bottom-0 left-0 right-0 z-30 grid grid-cols-3 border-t border-nt-divider bg-white"
      :style="{ paddingBottom: 'env(safe-area-inset-bottom)' }"
    >
      <router-link
        v-for="m in modules"
        :key="m.name"
        :to="m.to"
        :class="[
          'flex flex-col items-center justify-center gap-0.5 py-2 text-[11px] leading-none transition',
          isActive(m) ? 'text-nt' : 'text-nt-soft',
        ]"
      >
        <span class="text-xl leading-none">{{ m.icon }}</span>
        <span>{{ m.label }}</span>
      </router-link>
    </nav>

    <!-- 移动端抽屉(放次级入口) -->
    <Transition name="fade">
      <div
        v-if="drawerOpen"
        class="md:hidden fixed inset-0 z-50 flex"
        @click.self="drawerOpen = false"
      >
        <div class="absolute inset-0 bg-black/30" @click="drawerOpen = false" />
        <div class="relative h-full w-64 max-w-[80%] bg-white p-3 shadow-xl flex flex-col">
          <div class="mb-3 flex items-center gap-2 px-1 text-sm font-semibold text-nt">
            <span>🧠</span> MindBase
          </div>
          <nav class="space-y-0.5">
            <SidebarLink
              v-for="m in modules"
              :key="m.name"
              :to="m.to"
              :icon="m.icon"
              :label="m.label"
              :collapsed="false"
              :active="isActive(m)"
              @click="drawerOpen = false"
            />
          </nav>
          <div class="mt-2 border-t border-nt-divider pt-2 space-y-0.5">
            <SidebarLink
              to="/assistant/settings"
              icon="⚙"
              label="设置"
              :collapsed="false"
              :active="route.path === '/assistant/settings'"
              @click="drawerOpen = false"
            />
            <SidebarLink
              to="/assistant/authorize"
              icon="🔑"
              label="对外授权"
              :collapsed="false"
              :active="route.path === '/assistant/authorize'"
              @click="drawerOpen = false"
            />
            <button
              type="button"
              class="flex w-full items-center gap-2 rounded px-2 py-1.5 text-sm text-nt-muted hover:bg-nt-hover hover:text-nt"
              @click="onLogout"
            >
              <span class="text-base leading-none">↩</span>
              <span>退出登录</span>
            </button>
          </div>
          <div class="mt-auto px-1 text-xs text-nt-soft">{{ user?.name || '' }}</div>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import SidebarLink from './SidebarLink.vue'
import { useAuth, logout } from '@/composables/useAuth'

const route   = useRoute()
const router  = useRouter()
const { user } = useAuth()

const STORAGE_KEY = 'mindbase.sidebar.collapsed'
const collapsed = ref(false)
const drawerOpen = ref(false)

onMounted(() => {
  try { collapsed.value = localStorage.getItem(STORAGE_KEY) === '1' } catch {}
})

function toggle() {
  collapsed.value = !collapsed.value
  try { localStorage.setItem(STORAGE_KEY, collapsed.value ? '1' : '0') } catch {}
}

const modules = [
  { name: 'memos',     to: '/memos',     icon: '💡', label: '想法', match: (p) => p.startsWith('/memos') },
  { name: 'notes',     to: '/',          icon: '📚', label: '笔记', match: (p) => p === '/' || p.startsWith('/notebook') || p.startsWith('/note') },
  { name: 'assistant', to: '/assistant', icon: '🤖', label: '助理', match: (p) => p === '/assistant' || (p.startsWith('/assistant') && !p.startsWith('/assistant/settings') && !p.startsWith('/assistant/authorize')) },
]

function isActive(m) {
  return m.match(route.path)
}

const currentLabel = computed(() => {
  const m = modules.find(isActive)
  if (m) return m.label
  if (route.path.startsWith('/assistant/settings')) return '设置'
  if (route.path.startsWith('/assistant/authorize')) return '对外授权'
  return 'MindBase'
})

async function onLogout() {
  drawerOpen.value = false
  await logout()
  router.replace({ name: 'welcome' })
}
</script>
