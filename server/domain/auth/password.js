// 单用户密码登录:wrangler.jsonc 配 AUTH_USERNAME / AUTH_PASSWORD
// 用恒定时间比较防止时序泄漏(虽然单用户场景影响小,顺手做掉)。

export const SINGLE_USER_ID = 'mindbase00000001'

const timingSafeEqual = (a, b) => {
  if (typeof a !== 'string' || typeof b !== 'string') return false
  if (a.length !== b.length) return false
  let r = 0
  for (let i = 0; i < a.length; i++) r |= a.charCodeAt(i) ^ b.charCodeAt(i)
  return r === 0
}

export const verifyCredentials = (env, username, password) => {
  const u = env?.AUTH_USERNAME
  const p = env?.AUTH_PASSWORD
  if (!u || !p) throw new Error('auth_not_configured')
  return timingSafeEqual(String(username || ''), u) &&
         timingSafeEqual(String(password || ''), p)
}
