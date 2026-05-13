<template>
  <div class="flex min-h-screen flex-col">
    <!-- 顶栏:左当前应用标题、右宫格应用切换器 -->
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

      <Popover :open="launcherOpen" :anchor="launcherAnchor" :width="280" @close="launcherOpen = false">
        <div class="grid grid-cols-2 gap-1 p-1">
          <button
            v-for="app in apps"
            :key="app.name"
            type="button"
            :class="[
              'flex flex-col items-center justify-center gap-1.5 rounded-md py-4 transition',
              isActive(app)
                ? 'bg-nt-hover-strong text-nt'
                : 'text-nt-muted hover:bg-nt-hover hover:text-nt',
            ]"
            @click="goTo(app)"
          >
            <span class="text-3xl leading-none">{{ app.icon }}</span>
            <span class="text-xs font-medium">{{ app.label }}</span>
          </button>
        </div>

        <div v-if="user" class="mt-1 border-t border-nt-divider pt-1">
          <div class="flex items-center gap-2 rounded-md px-2 py-1.5">
            <img
              v-if="user.avatar_url"
              :src="user.avatar_url"
              referrerpolicy="no-referrer"
              class="h-6 w-6 shrink-0 rounded-full object-cover"
              alt=""
            />
            <span
              v-else
              class="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-nt-hover text-xs text-nt-muted"
            >{{ initial }}</span>
            <div class="min-w-0 flex-1">
              <div class="truncate text-sm text-nt">{{ user.name }}</div>
              <div class="truncate text-[11px] text-nt-soft">{{ user.email }}</div>
            </div>
            <button
              type="button"
              class="rounded px-2 py-1 text-xs text-nt-muted hover:bg-nt-hover hover:text-nt-danger"
              @click="onLogout"
            >退出</button>
          </div>
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
import { useAuth, logout } from '@/composables/useAuth'

const route   = useRoute()
const router  = useRouter()
const { user } = useAuth()

const apps = [
  { name: 'memos',     icon: '💡', label: '想法', to: { name: 'memos' },              match: (p) => p.startsWith('/memos') },
  { name: 'notes',     icon: '📚', label: '笔记', to: { name: 'home' },               match: (p) => p === '/' || p.startsWith('/notebook') || p.startsWith('/note') },
  { name: 'assistant', icon: '🤖', label: '助理', to: { name: 'assistant' },          match: (p) => p === '/assistant' },
  { name: 'settings',  icon: '⚙',  label: '设置', to: { name: 'assistant-settings' }, match: (p) => p.startsWith('/assistant/settings') || p.startsWith('/assistant/authorize') },
]

function isActive(app) {
  return app.match(route.path)
}

const currentApp = computed(() => {
  if (route.path.startsWith('/assistant/authorize')) {
    return { icon: '🔑', label: '对外授权' }
  }
  const a = apps.find(isActive)
  return a || { icon: '🧠', label: 'MindBase' }
})

const launcherBtn    = ref(null)
const launcherOpen   = ref(false)
const launcherAnchor = ref(null)

function toggleLauncher() {
  if (launcherOpen.value) { launcherOpen.value = false; return }
  launcherAnchor.value = launcherBtn.value?.getBoundingClientRect() || null
  launcherOpen.value = true
}

function goTo(app) {
  launcherOpen.value = false
  router.push(app.to)
}

async function onLogout() {
  launcherOpen.value = false
  await logout()
  router.replace({ name: 'welcome' })
}

const initial = computed(() => {
  const n = user.value?.name || user.value?.email || ''
  return n.slice(0, 1).toUpperCase()
})
</script>
