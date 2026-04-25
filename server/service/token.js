import { readJsonBody } from '../api/utils/body.js'
import { ok, fail } from '../api/utils/json.js'
import { createNotebookId } from '../api/utils/id.js' // 复用 12 位 id 生成器
import { generateApiToken, getUserFromRequest } from '../domain/auth/index.js'
import {
  createToken,
  deleteAllTokensForUser,
  deleteToken,
  listTokens,
} from '../repository/token.js'

const authed = async (request, env) => {
  const user = await getUserFromRequest(request, env)
  if (!user) return { error: fail('unauthorized', 401) }
  if (user.isApiToken) return { error: fail('token_cannot_manage_tokens', 403) }
  return { user }
}

export const listTokensAction = async (request, env) => {
  const { user, error } = await authed(request, env)
  if (error) return error
  const tokens = await listTokens(env.DB, user.id)
  return ok({ tokens })
}

export const createTokenAction = async (request, env) => {
  const { user, error } = await authed(request, env)
  if (error) return error

  const body = await readJsonBody(request)
  const name = String(body?.name || '').trim().slice(0, 60) || 'AI'

  // 一个用户只保留一把:创建前先清,对应 UI 就是"每次关闭再开都是一把新令牌"
  await deleteAllTokensForUser(env.DB, user.id)

  const token = await createToken(env.DB, {
    id:     createNotebookId(),
    userId: user.id,
    name,
    token:  generateApiToken(),
    scope:  'read_write',
  })
  return ok({ token }, 201)
}

export const deleteTokenAction = async (request, env, id) => {
  const { user, error } = await authed(request, env)
  if (error) return error

  await deleteToken(env.DB, id, user.id)
  return ok({ deleted: true })
}
