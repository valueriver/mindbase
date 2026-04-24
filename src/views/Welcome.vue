<template>
  <div class="flex min-h-screen flex-col items-center justify-center px-6">
    <h1 class="text-3xl font-bold tracking-tight text-nt">MindBase</h1>

    <div ref="btnHost" class="mt-8 flex min-h-[44px] items-center justify-center" />

    <p v-if="error" class="mt-4 text-sm text-nt-danger">{{ error }}</p>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { loadGoogleSdk } from '@/composables/useGoogle'
import { loginWithGoogle } from '@/composables/useAuth'
import { GOOGLE_CLIENT_ID } from '@/config'

const router = useRouter()
const btnHost = ref(null)
const error   = ref('')

onMounted(async () => {
  try {
    const google = await loadGoogleSdk()
    google.accounts.id.initialize({
      client_id: GOOGLE_CLIENT_ID,
      callback: async (resp) => {
        try {
          await loginWithGoogle(resp.credential)
          router.replace({ name: 'home' })
        } catch (e) {
          error.value = e.message || '登录失败'
        }
      },
    })
    google.accounts.id.renderButton(btnHost.value, {
      theme: 'outline',
      size:  'large',
      type:  'standard',
      shape: 'pill',
      text:  'signin_with',
      width: 260,
    })
  } catch (e) {
    error.value = 'Google 登录组件加载失败'
  }
})
</script>
