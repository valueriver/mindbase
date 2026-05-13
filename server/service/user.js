import { readJsonBody } from '../api/utils/body.js'
import { ok, fail } from '../api/utils/json.js'
import {
  isAuthenticated,
  verifyCredentials,
  signJwt,
  buildAuthCookie,
  clearAuthCookie,
} from '../domain/auth/index.js'

const issueCookie = (token, url) =>
  buildAuthCookie(token, { secure: url.protocol === 'https:' })

export const passwordLoginAction = async (request, env, url) => {
  const body = await readJsonBody(request)
  const username = String(body?.username || '').trim()
  const password = String(body?.password || '')
  if (!username || !password) return fail('username_and_password_required', 400)

  let valid
  try { valid = verifyCredentials(env, username, password) }
  catch { return fail('auth_not_configured', 500) }
  if (!valid) return fail('invalid_credentials', 401)

  const token = await signJwt(env, { sub: 'owner' })
  return ok({}, 200, issueCookie(token, url))
}

export const logoutAction = (_request, _env, url) =>
  ok({}, 200, clearAuthCookie({ secure: url.protocol === 'https:' }))

export const meAction = async (request, env) => {
  const ok_ = await isAuthenticated(request, env)
  if (!ok_) return fail('unauthorized', 401)
  return ok({ authenticated: true })
}
