<template>
  <header class="sticky top-0 z-30 flex h-11 items-center justify-between border-b border-nt-divider bg-white/95 px-4 backdrop-blur">
    <router-link :to="{ name: 'home' }" class="text-sm font-semibold text-nt">
      MindBase
    </router-link>

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
        <img
          v-if="user?.avatar_url"
          :src="user.avatar_url"
          referrerpolicy="no-referrer"
          class="h-8 w-8 rounded-full object-cover"
          alt=""
        />
        <div class="min-w-0 flex-1">
          <div class="truncate text-sm font-medium text-nt">{{ user?.name }}</div>
          <div class="truncate text-xs text-nt-soft">{{ user?.email }}</div>
        </div>
      </div>
      <div class="my-1 h-px bg-nt-divider" />
      <button
        type="button"
        class="flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-sm text-nt hover:bg-nt-hover"
        @click="onOpenAi"
      >
        <span>🤖</span> AI 授权
      </button>
      <button
        type="button"
        class="flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-sm text-nt hover:bg-nt-hover"
        @click="onLogout"
      >
        <span>↩</span> 退出登录
      </button>
    </Popover>
  </header>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import Popover from './Popover.vue'
import { useAuth, logout } from '@/composables/useAuth'

const router = useRouter()
const { user } = useAuth()

const avatarBtn  = ref(null)
const menuOpen   = ref(false)
const menuAnchor = ref(null)

function toggleMenu() {
  if (menuOpen.value) {
    menuOpen.value = false
    return
  }
  menuAnchor.value = avatarBtn.value?.getBoundingClientRect() || null
  menuOpen.value = true
}

async function onLogout() {
  menuOpen.value = false
  await logout()
  router.replace({ name: 'welcome' })
}

function onOpenAi() {
  menuOpen.value = false
  router.push({ name: 'ai' })
}
</script>
