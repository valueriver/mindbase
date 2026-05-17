import { SignJWT, jwtVerify } from 'jose'
import { TOKEN_COOKIE, TOKEN_EXPIRATION, TOKEN_MAX_AGE } from '../../config.js'
import { isApiTokenShape } from './api-token.js'
import { findTokenByValue, touchToken } from '../apps/collab/repository.js'

const ALG = 'HS256'

const secret = (env) => {
  if (!env?.JWT_SECRET) {
    throw new Error('JWT_SECRET missing — set it under "vars" in wrangler.jsonc')
  }
  return new TextEncoder().encode(env.JWT_SECRET)
}

export const signJwt = (env, payload = {}) =>
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

// 鉴权:成功时返回 { source: 'cookie' | 'api_token' };失败返回 null。
export const getAuth = async (request, env) => {
  const cookies = parseCookies(request)
  let token = cookies[TOKEN_COOKIE]
  if (!token) {
    const authHeader = request.headers.get('Authorization') || ''
    if (authHeader.startsWith('Bearer ')) token = authHeader.slice(7)
  }
  if (!token) return null

  if (isApiTokenShape(token)) {
    if (!env?.DB) return null
    const row = await findTokenByValue(env.DB, token)
    if (!row) return null
    touchToken(env.DB, row.token_id).catch(err =>
      console.error('touchToken failed', err?.message)
    )
    return { source: 'api_token', scope: row.scope || 'read' }
  }

  const payload = await verifyJwt(env, token)
  if (!payload) return null
  return { source: 'cookie' }
}

// 便捷别名:仅判断是否已鉴权(密码 cookie 或对外 API token 都算)。
export const isAuthenticated = async (request, env) => !!(await getAuth(request, env))
