import { ok, fail } from '../api/utils/json.js'
import { readJsonBody } from '../api/utils/body.js'
import { createMemoId } from '../api/utils/id.js'
import { isAuthenticated } from '../domain/auth/index.js'
import {
  listMemos,
  findMemoById,
  insertMemo,
  updateMemo,
  deleteMemo,
} from '../repository/memo.js'

const parseTags = (raw) => {
  if (!raw) return []
  try { const v = JSON.parse(raw); return Array.isArray(v) ? v : [] }
  catch { return [] }
}

const serialize = (row) => row && ({
  id:         row.id,
  content:    row.content,
  tags:       parseTags(row.tags),
  created_at: row.created_at,
  updated_at: row.updated_at,
})

const sanitizeTags = (tags) => {
  if (tags === undefined) return undefined
  if (!Array.isArray(tags)) return null
  const clean = tags
    .map(t => String(t || '').trim())
    .filter(Boolean)
    .slice(0, 10)
  return clean.length ? JSON.stringify(clean) : null
}

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
  if (content.length > 5000) return fail('content_too_long', 400)
  const row = await insertMemo(env.DB, {
    id:      createMemoId(),
    content,
    tags:    sanitizeTags(body?.tags) ?? null,
  })
  return ok({ memo: serialize(row) })
}

export const updateMemoAction = async (request, env, id) => {
  if (!(await isAuthenticated(request, env))) return fail('unauthorized', 401)
  const body = await readJsonBody(request)
  const existing = await findMemoById(env.DB, id)
  if (!existing) return fail('not_found', 404)
  const content = body?.content !== undefined ? String(body.content).trim() : undefined
  if (content !== undefined && !content) return fail('content_required', 400)
  if (content && content.length > 5000) return fail('content_too_long', 400)
  const row = await updateMemo(env.DB, id, {
    content,
    tags: sanitizeTags(body?.tags),
  })
  return ok({ memo: serialize(row) })
}

export const deleteMemoAction = async (request, env, id) => {
  if (!(await isAuthenticated(request, env))) return fail('unauthorized', 401)
  const existing = await findMemoById(env.DB, id)
  if (!existing) return fail('not_found', 404)
  await deleteMemo(env.DB, id)
  return ok({})
}
