import { ref, computed } from 'vue'
import { apiUser } from '@/api/client'

const user = ref(null)
const ready = ref(false)
let inflight = null

export async function checkAuth() {
  if (ready.value) return user.value
  if (inflight) return inflight
  inflight = (async () => {
    try {
      const { user: u } = await apiUser.me()
      user.value = u
    } catch {
      user.value = null
    } finally {
      ready.value = true
      inflight = null
    }
    return user.value
  })()
  return inflight
}

export async function loginWithGoogle(idToken) {
  const { user: u } = await apiUser.googleLogin(idToken)
  user.value = u
  ready.value = true
  return u
}

export async function logout() {
  try { await apiUser.logout() } catch {}
  user.value = null
  ready.value = true
}

export function useAuth() {
  return {
    user,
    ready,
    isAuthenticated: computed(() => !!user.value),
    checkAuth,
    loginWithGoogle,
    logout,
  }
}
