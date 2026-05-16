import { readJsonBody } from '../../lib/utils/body.js'
import { ok, fail } from '../../lib/utils/json.js'
import {
  isAuthenticated,
  hashPassword,
  verifyPassword,
  signJwt,
  buildAuthCookie,
  clearAuthCookie,
} from '../../lib/auth/index.js'
import { getSetting, setSetting } from '../settings/repository.js'

const KEYS = {
  username: 'auth_username',
  hash:     'auth_password_hash',
  salt:     'auth_password_salt',
}
const MIN_USERNAME = 1
const MIN_PASSWORD = 6
const MAX_LEN      = 200

const issueCookie = (token, url) =>
  buildAuthCookie(token, { secure: url.protocol === 'https:' })

const readAuth = async (db) => ({
  username: await getSetting(db, KEYS.username) || '',
  hash:     await getSetting(db, KEYS.hash)     || '',
  salt:     await getSetting(db, KEYS.salt)     || '',
})

const writeAuth = async (db, { username, hash, salt }) => {
  await Promise.all([
    setSetting(db, KEYS.username, username),
    setSetting(db, KEYS.hash,     hash),
    setSetting(db, KEYS.salt,     salt),
  ])
}

// GET /api/auth/status — 不需要鉴权,告诉前端是否已初始化
export const authStatusAction = async (_request, env) => {
  const a = await readAuth(env.DB)
  return ok({ initialized: !!(a.username && a.hash) })
}

// POST /api/auth/setup — 仅在未初始化时允许;调用者直接成为 owner
export const setupAuthAction = async (request, env, url) => {
  const cur = await readAuth(env.DB)
  if (cur.username && cur.hash) return fail('already_initialized', 409)

  const body = await readJsonBody(request)
  const username = String(body?.username || '').trim()
  const password = String(body?.password || '')
  if (username.length < MIN_USERNAME || username.length > MAX_LEN) return fail('invalid_username', 400)
  if (password.length < MIN_PASSWORD || password.length > MAX_LEN) return fail('password_too_short', 400)

  const { hash, salt } = await hashPassword(password)
  await writeAuth(env.DB, { username, hash, salt })

  const token = await signJwt(env, { sub: 'owner' })
  return ok({ initialized: true }, 200, issueCookie(token, url))
}

// POST /api/user/login
export const passwordLoginAction = async (request, env, url) => {
  const a = await readAuth(env.DB)
  if (!a.username || !a.hash) return fail('not_initialized', 409)

  const body = await readJsonBody(request)
  const username = String(body?.username || '').trim()
  const password = String(body?.password || '')
  if (!username || !password) return fail('username_and_password_required', 400)
  if (username !== a.username) return fail('invalid_credentials', 401)

  const okPwd = await verifyPassword(password, a.hash, a.salt)
  if (!okPwd) return fail('invalid_credentials', 401)

  const token = await signJwt(env, { sub: 'owner' })
  return ok({}, 200, issueCookie(token, url))
}

export const logoutAction = (_request, _env, url) =>
  ok({}, 200, clearAuthCookie({ secure: url.protocol === 'https:' }))

export const meAction = async (request, env) => {
  if (!(await isAuthenticated(request, env))) return fail('unauthorized', 401)
  return ok({ authenticated: true })
}

// POST /api/user/password — 已登录用户改密码;需要旧密码
export const changePasswordAction = async (request, env) => {
  if (!(await isAuthenticated(request, env))) return fail('unauthorized', 401)
  const a = await readAuth(env.DB)
  if (!a.username || !a.hash) return fail('not_initialized', 409)

  const body = await readJsonBody(request)
  const oldPassword = String(body?.old_password || '')
  const newPassword = String(body?.new_password || '')
  if (newPassword.length < MIN_PASSWORD || newPassword.length > MAX_LEN) return fail('password_too_short', 400)

  const okPwd = await verifyPassword(oldPassword, a.hash, a.salt)
  if (!okPwd) return fail('invalid_old_password', 401)

  const { hash, salt } = await hashPassword(newPassword)
  await writeAuth(env.DB, { username: a.username, hash, salt })
  return ok({})
}
