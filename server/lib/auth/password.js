// 纯密码学:PBKDF2-SHA256 100k 轮哈希 + 验证。
// 不碰 DB,DB 读写在 service 层。

const ITERATIONS  = 100_000
const KEY_BITS    = 256
const SALT_BYTES  = 16

const bytesToHex = (b) => Array.from(b, x => x.toString(16).padStart(2, '0')).join('')
const hexToBytes = (h) => {
  const out = new Uint8Array(h.length / 2)
  for (let i = 0; i < out.length; i++) out[i] = parseInt(h.slice(i * 2, i * 2 + 2), 16)
  return out
}

const deriveKey = async (password, saltBytes) => {
  const enc = new TextEncoder()
  const base = await crypto.subtle.importKey('raw', enc.encode(password), 'PBKDF2', false, ['deriveBits'])
  const bits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', salt: saltBytes, iterations: ITERATIONS, hash: 'SHA-256' },
    base,
    KEY_BITS,
  )
  return new Uint8Array(bits)
}

export const hashPassword = async (password) => {
  const salt = crypto.getRandomValues(new Uint8Array(SALT_BYTES))
  const key  = await deriveKey(password, salt)
  return { hash: bytesToHex(key), salt: bytesToHex(salt) }
}

// 恒定时间比较
const timingSafeEqStr = (a, b) => {
  if (a.length !== b.length) return false
  let r = 0
  for (let i = 0; i < a.length; i++) r |= a.charCodeAt(i) ^ b.charCodeAt(i)
  return r === 0
}

export const verifyPassword = async (password, storedHashHex, storedSaltHex) => {
  try {
    const saltBytes = hexToBytes(String(storedSaltHex || ''))
    const key = await deriveKey(String(password || ''), saltBytes)
    return timingSafeEqStr(bytesToHex(key), String(storedHashHex || ''))
  } catch {
    return false
  }
}
