import { ok, fail } from '../api/utils/json.js'
import { readJsonBody } from '../api/utils/body.js'
import { createMemoId } from '../api/utils/id.js'
import { isAuthenticated } from '../domain/auth/index.js'
import { deleteR2Keys, diffRemovedKeys, extractR2Keys } from '../domain/image/refs.js'
import {
  listMemos,
  findMemoById,
  insertMemo,
  updateMemo,
  deleteMemo,
} from '../repository/memo.js'

const MAX_LEN = 20_000

const serialize = (row) => row && ({
  id:         row.id,
  content:    row.content,
  created_at: row.created_at,
  updated_at: row.updated_at,
})

export const listMemosAction = async (request, env, url) => {
  if (!(await isAuthenticated(request, env))) return fail('unauthorized', 401)
  const limit  = Math.min(Number(url.searchParams.get('limit'))  || 200, 500)
  const offset = Math.max(Number(url.searchParams.get('offset')) || 0, 0)
  const result = await listMemos(env.DB, { limit, offset })
  return ok({ memos: (result?.results || []).map(serialize) })
}

export const createMemoAction = async (request, env) => {
  if (!(await isAuthenticated(request, env))) return fail('unauthorized', 401)
  const body = await readJsonBody(request)
  const content = String(body?.content || '').trim()
  if (!content) return fail('content_required', 400)
  if (content.length > MAX_LEN) return fail('content_too_long', 400)
  const row = await insertMemo(env.DB, { id: createMemoId(), content })
  return ok({ memo: serialize(row) })
}

export const updateMemoAction = async (request, env, id) => {
  if (!(await isAuthenticated(request, env))) return fail('unauthorized', 401)
  const body = await readJsonBody(request)
  const existing = await findMemoById(env.DB, id)
  if (!existing) return fail('not_found', 404)
  if (body?.content === undefined) return fail('content_required', 400)

  const content = String(body.content).trim()
  if (!content) return fail('content_required', 400)
  if (content.length > MAX_LEN) return fail('content_too_long', 400)

  const removedKeys = diffRemovedKeys(existing.content, content)
  const row = await updateMemo(env.DB, id, { content })
  if (removedKeys.length > 0) await deleteR2Keys(env, removedKeys)
  return ok({ memo: serialize(row) })
}

export const deleteMemoAction = async (request, env, id) => {
  if (!(await isAuthenticated(request, env))) return fail('unauthorized', 401)
  const existing = await findMemoById(env.DB, id)
  if (!existing) return fail('not_found', 404)
  const keys = extractR2Keys(existing.content)
  await deleteMemo(env.DB, id)
  if (keys.length > 0) await deleteR2Keys(env, keys)
  return ok({})
}
