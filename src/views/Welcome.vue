<template>
  <div class="flex min-h-screen flex-col items-center justify-center px-6">
    <img src="/favicon.svg" alt="" class="mb-3 h-14 w-14" />
    <h1 class="text-3xl font-bold tracking-tight text-nt">MindBase</h1>
    <p class="mt-1 text-sm text-nt-soft">个人知识库 · 想法 · 笔记 · 助理</p>

    <form
      class="mt-8 flex w-full max-w-72 flex-col gap-3"
      @submit.prevent="onSubmit"
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

    <p class="mt-6 text-xs text-nt-soft">账号密码在 <code class="font-mono">wrangler.jsonc</code> 配置</p>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { login } from '@/composables/useAuth'

const router = useRouter()
const username = ref('')
const password = ref('')
const busy     = ref(false)
const error    = ref('')

async function onSubmit() {
  if (busy.value) return
  error.value = ''
  busy.value = true
  try {
    await login(username.value.trim(), password.value)
    router.replace({ name: 'home' })
  } catch (e) {
    const msg = e?.message || ''
    if (/invalid_credentials/.test(msg)) error.value = '账号或密码错误'
    else if (/auth_not_configured/.test(msg)) error.value = '后端未配置 AUTH_USERNAME / AUTH_PASSWORD'
    else error.value = msg || '登录失败'
  } finally {
    busy.value = false
  }
}
</script>
