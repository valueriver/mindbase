<template>
  <div class="flex min-h-screen flex-col items-center justify-center px-6">
    <img src="/favicon.svg" alt="" class="mb-3 h-14 w-14" />
    <h1 class="text-3xl font-bold tracking-tight text-nt">MindBase</h1>
    <p class="mt-1 text-sm text-nt-soft">个人知识库 · 想法 · 笔记 · 助理</p>

    <div v-if="checking" class="mt-8 text-sm text-nt-soft">加载中…</div>

    <!-- 首次访问:创建账户 -->
    <form
      v-else-if="!initialized"
      class="mt-8 flex w-full max-w-72 flex-col gap-3"
      @submit.prevent="onSetup"
    >
      <input
        v-model="username"
        type="text"
        autocomplete="username"
        placeholder="账号"
        :disabled="busy"
        class="rounded-md border border-nt-divider bg-white px-3 py-2.5 text-sm text-nt outline-none placeholder:text-nt-hint focus:border-nt-accent"
      />
      <input
        v-model="password"
        type="password"
        autocomplete="new-password"
        placeholder="密码(至少 6 位)"
        :disabled="busy"
        class="rounded-md border border-nt-divider bg-white px-3 py-2.5 text-sm text-nt outline-none placeholder:text-nt-hint focus:border-nt-accent"
      />
      <input
        v-model="password2"
        type="password"
        autocomplete="new-password"
        placeholder="重复密码"
        :disabled="busy"
        class="rounded-md border border-nt-divider bg-white px-3 py-2.5 text-sm text-nt outline-none placeholder:text-nt-hint focus:border-nt-accent"
      />
      <button
        type="submit"
        :disabled="busy || !canSetup"
        class="rounded-md bg-nt px-4 py-2.5 text-sm text-white hover:bg-black disabled:opacity-50"
      >{{ busy ? '创建中…' : '创建账户' }}</button>
    </form>

    <!-- 已初始化:登录 -->
    <form
      v-else
      class="mt-8 flex w-full max-w-72 flex-col gap-3"
      @submit.prevent="onLogin"
    >
      <input
        v-model="username"
        type="text"
        autocomplete="username"
        placeholder="账号"
        :disabled="busy"
        class="rounded-md border border-nt-divider bg-white px-3 py-2.5 text-sm text-nt outline-none placeholder:text-nt-hint focus:border-nt-accent"
      />
      <input
        v-model="password"
        type="password"
        autocomplete="current-password"
        placeholder="密码"
        :disabled="busy"
        class="rounded-md border border-nt-divider bg-white px-3 py-2.5 text-sm text-nt outline-none placeholder:text-nt-hint focus:border-nt-accent"
      />
      <button
        type="submit"
        :disabled="busy || !username || !password"
        class="rounded-md bg-nt px-4 py-2.5 text-sm text-white hover:bg-black disabled:opacity-50"
      >{{ busy ? '登录中…' : '登录' }}</button>
    </form>

    <p v-if="error" class="mt-4 max-w-72 text-center text-sm text-nt-danger">{{ error }}</p>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { login, setupAuth } from '@/composables/useAuth'
import { apiUser } from '@/api/client'

const router = useRouter()
const initialized = ref(true)
const checking    = ref(true)

const username  = ref('')
const password  = ref('')
const password2 = ref('')
const busy      = ref(false)
const error     = ref('')

const canSetup = computed(() =>
  username.value.trim().length >= 1 &&
  password.value.length >= 6 &&
  password.value === password2.value
)

async function onSetup() {
  if (busy.value || !canSetup.value) return
  error.value = ''
  busy.value  = true
  try {
    await setupAuth(username.value.trim(), password.value)
    router.replace('/')
  } catch (e) {
    const msg = e?.message || ''
    if (/already_initialized/.test(msg)) {
      initialized.value = true
      error.value = '系统已被初始化,请登录'
    } else if (/password_too_short/.test(msg)) {
      error.value = '密码至少 6 位'
    } else if (/invalid_username/.test(msg)) {
      error.value = '账号不能为空'
    } else {
      error.value = msg || '设置失败'
    }
  } finally {
    busy.value = false
  }
}

async function onLogin() {
  if (busy.value) return
  error.value = ''
  busy.value  = true
  try {
    await login(username.value.trim(), password.value)
    router.replace('/')
  } catch (e) {
    const msg = e?.message || ''
    if (/invalid_credentials/.test(msg)) error.value = '账号或密码错误'
    else if (/not_initialized/.test(msg)) {
      initialized.value = false
      error.value = '尚未初始化,请先设置账号密码'
    } else {
      error.value = msg || '登录失败'
    }
  } finally {
    busy.value = false
  }
}

onMounted(async () => {
  try {
    const r = await apiUser.authStatus()
    initialized.value = !!r.initialized
  } catch {
    initialized.value = true
  } finally {
    checking.value = false
  }
})
</script>
