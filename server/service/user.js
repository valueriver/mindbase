import { readJsonBody } from '../api/utils/body.js'
import { ok, fail } from '../api/utils/json.js'
import {
  getUserFromRequest,
  verifyCredentials,
  signJwt,
  buildAuthCookie,
  clearAuthCookie,
  SINGLE_USER_ID,
} from '../domain/auth/index.js'
import { ensureUser, findUserById } from '../repository/user.js'

const sanitize = (u) => u && ({
  id:         u.id,
  email:      u.email,
  name:       u.name,
  avatar_url: u.avatar_url,
})

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

  const user = await ensureUser(env.DB, {
    id:    SINGLE_USER_ID,
    email: `${username}@mindbase.local`,
    name:  username,
  })

  const token = await signJwt(env, {
    sub:   user.id,
    email: user.email,
    name:  user.name,
  })

  return ok({ user: sanitize(user) }, 200, issueCookie(token, url))
}

export const logoutAction = (_request, _env, url) =>
  ok({}, 200, clearAuthCookie({ secure: url.protocol === 'https:' }))

export const meAction = async (request, env) => {
  const jwtUser = await getUserFromRequest(request, env)
  if (!jwtUser) return fail('unauthorized', 401)
  const user = await findUserById(env.DB, jwtUser.id)
  if (!user) return fail('unauthorized', 401)
  return ok({ user: sanitize(user) })
}
