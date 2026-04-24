import { readJsonBody } from '../api/utils/body.js'
import { ok, fail } from '../api/utils/json.js'
import { createUserId } from '../api/utils/id.js'
import {
  getUserFromRequest,
  verifyGoogleIdToken,
  signJwt,
  buildAuthCookie,
  clearAuthCookie,
} from '../domain/auth/index.js'
import {
  createUser,
  findUserByGoogleId,
  findUserByEmail,
  findUserById,
  updateUserProfile,
} from '../repository/user.js'

const sanitize = (u) => u && ({
  id:         u.id,
  email:      u.email,
  name:       u.name,
  avatar_url: u.avatar_url,
})

const issueCookie = (token, url) =>
  buildAuthCookie(token, { secure: url.protocol === 'https:' })

export const googleLoginAction = async (request, env, url) => {
  const body = await readJsonBody(request)
  const idToken = body?.token
  if (!idToken) return fail('token_required', 400)

  const clientId = env.GOOGLE_CLIENT_ID
  if (!clientId) return fail('google_client_id_missing', 500)

  let payload
  try {
    payload = await verifyGoogleIdToken(idToken, clientId)
  } catch (err) {
    return fail(`google_verify_failed: ${err?.message || 'unknown'}`, 401)
  }

  const googleId = String(payload.sub)
  const email    = String(payload.email || '')
  const name     = String(payload.name || email.split('@')[0] || 'user')
  const avatar   = String(payload.picture || '')

  let user = await findUserByGoogleId(env.DB, googleId)
  if (!user && email) user = await findUserByEmail(env.DB, email)

  if (user) {
    user = await updateUserProfile(env.DB, user.id, { name, avatarUrl: avatar })
  } else {
    user = await createUser(env.DB, {
      id:        createUserId(),
      googleId,
      email,
      name,
      avatarUrl: avatar,
    })
  }

  const token = await signJwt(env, {
    sub:    user.id,
    email:  user.email,
    name:   user.name,
    avatar: user.avatar_url,
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
