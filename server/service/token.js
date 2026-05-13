import { readJsonBody } from '../api/utils/body.js'
import { ok, fail } from '../api/utils/json.js'
import { createNotebookId } from '../api/utils/id.js' // 复用 12 位 id 生成器
import { generateApiToken, getAuth } from '../domain/auth/index.js'
import {
  createToken,
  deleteAllTokens,
  deleteToken,
  listTokens,
} from '../repository/token.js'

// 管理 token 自己,只能用 cookie 鉴权(不能让 api_token 自己改自己)
const requireCookieAuth = async (request, env) => {
  const auth = await getAuth(request, env)
  if (!auth) return fail('unauthorized', 401)
  if (auth.source === 'api_token') return fail('token_cannot_manage_tokens', 403)
  return null
}

export const listTokensAction = async (request, env) => {
  const e = await requireCookieAuth(request, env); if (e) return e
  const tokens = await listTokens(env.DB)
  return ok({ tokens })
}

export const createTokenAction = async (request, env) => {
  const e = await requireCookieAuth(request, env); if (e) return e

  const body = await readJsonBody(request)
  const name = String(body?.name || '').trim().slice(0, 60) || 'AI'

  // 同时只保留一把
  await deleteAllTokens(env.DB)

  const token = await createToken(env.DB, {
    id:    createNotebookId(),
    name,
    token: generateApiToken(),
    scope: 'read_write',
  })
  return ok({ token }, 201)
}

export const deleteTokenAction = async (request, env, id) => {
  const e = await requireCookieAuth(request, env); if (e) return e
  await deleteToken(env.DB, id)
  return ok({ deleted: true })
}
