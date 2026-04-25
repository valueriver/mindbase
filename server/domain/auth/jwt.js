import { SignJWT, jwtVerify } from 'jose'
import { TOKEN_COOKIE, TOKEN_EXPIRATION, TOKEN_MAX_AGE } from '../../config.js'
import { isApiTokenShape } from './api-token.js'
import { findTokenByValue, touchToken } from '../../repository/token.js'

const ALG = 'HS256'

const secret = (env) => {
  if (!env?.JWT_SECRET) {
    throw new Error('JWT_SECRET missing — set it under "vars" in wrangler.jsonc')
  }
  return new TextEncoder().encode(env.JWT_SECRET)
}

export const signJwt = (env, payload) =>
  new SignJWT(payload)
    .setProtectedHeader({ alg: ALG })
    .setIssuedAt()
    .setExpirationTime(TOKEN_EXPIRATION)
    .sign(secret(env))

export const verifyJwt = async (env, token) => {
  try {
    const { payload } = await jwtVerify(token, secret(env), { algorithms: [ALG] })
    return payload
  } catch {
    return null
  }
}

const COOKIE_BASE = `${TOKEN_COOKIE}=`
const COOKIE_ATTRS_PROD = `Path=/; HttpOnly; Secure; SameSite=Lax`
const COOKIE_ATTRS_DEV  = `Path=/; HttpOnly; SameSite=Lax`

export const buildAuthCookie = (token, { secure = true } = {}) =>
  `${COOKIE_BASE}${encodeURIComponent(token)}; ${secure ? COOKIE_ATTRS_PROD : COOKIE_ATTRS_DEV}; Max-Age=${TOKEN_MAX_AGE}`

export const clearAuthCookie = ({ secure = true } = {}) =>
  `${COOKIE_BASE}; ${secure ? COOKIE_ATTRS_PROD : COOKIE_ATTRS_DEV}; Max-Age=0`

const parseCookies = (request) => {
  const out = {}
  const raw = request.headers.get('cookie') || ''
  for (const part of raw.split(';')) {
    const i = part.indexOf('=')
    if (i <= 0) continue
    out[part.slice(0, i).trim()] = decodeURIComponent(part.slice(i + 1).trim())
  }
  return out
}

export const getUserFromRequest = async (request, env) => {
  const cookies = parseCookies(request)
  let token = cookies[TOKEN_COOKIE]
  if (!token) {
    const authHeader = request.headers.get('Authorization') || ''
    if (authHeader.startsWith('Bearer ')) token = authHeader.slice(7)
  }
  if (!token) return null

  // AI 授权令牌(mb_ 开头):明文直接比对
  if (isApiTokenShape(token)) {
    if (!env?.DB) return null
    const row = await findTokenByValue(env.DB, token)
    if (!row) return null
    // 顺手更新 last_used_at;失败不影响鉴权
    touchToken(env.DB, row.token_id).catch(err =>
      console.error('touchToken failed', err?.message)
    )
    return {
      id:         row.user_id,
      name:       row.name  || '',
      email:      row.email || '',
      avatar:     row.avatar_url || '',
      isApiToken: true,
      scope:      row.scope || 'read',
    }
  }

  // 普通 cookie/JWT
  const payload = await verifyJwt(env, token)
  if (!payload?.sub) return null

  return {
    id:     String(payload.sub),
    name:   payload.name || '',
    email:  payload.email || '',
    avatar: payload.avatar || '',
  }
}
