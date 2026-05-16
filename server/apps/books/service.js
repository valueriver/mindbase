import { ok, fail } from '../../lib/utils/json.js'
import { readJsonBody } from '../../lib/utils/body.js'
import { isAuthenticated } from '../../lib/auth/index.js'
import {
  listBooks,
  findBookById,
  insertBook,
  updateBook,
  deleteBook,
} from './repository.js'

const STATUSES = new Set(['want', 'reading', 'read'])

const serialize = (row) => row && ({
  id:         row.id,
  title:      row.title,
  author:     row.author || '',
  status:     row.status || 'want',
  rating:     Number(row.rating || 0),
  note:       row.note || '',
  cover:      row.cover || null,
  created_at: row.created_at,
  updated_at: row.updated_at,
})

const cleanStr = (v) => (v === undefined || v === null) ? null : String(v).trim()
const clampRating = (v) => {
  const n = Number(v)
  if (!Number.isFinite(n)) return null
  return Math.max(0, Math.min(5, Math.round(n)))
}
const cleanStatus = (v) => {
  const s = cleanStr(v)
  return s && STATUSES.has(s) ? s : null
}

export const listBooksAction = async (request, env, url) => {
  if (!(await isAuthenticated(request, env))) return fail('unauthorized', 401)
  const limit  = Math.min(Number(url.searchParams.get('limit'))  || 200, 500)
  const offset = Math.max(Number(url.searchParams.get('offset')) || 0, 0)
  const status = cleanStatus(url.searchParams.get('status'))
  const result = await listBooks(env.DB, { status, limit, offset })
  return ok({ items: (result?.results || []).map(serialize) })
}

export const createBookAction = async (request, env) => {
  if (!(await isAuthenticated(request, env))) return fail('unauthorized', 401)
  const body = await readJsonBody(request)
  const title = cleanStr(body?.title)
  if (!title) return fail('title_required', 400)
  const row = await insertBook(env.DB, {
    id:     crypto.randomUUID(),
    title,
    author: cleanStr(body?.author) || '',
    status: cleanStatus(body?.status) || 'want',
    rating: clampRating(body?.rating) ?? 0,
    note:   cleanStr(body?.note) || '',
    cover:  cleanStr(body?.cover),
  })
  return ok({ item: serialize(row) })
}

export const updateBookAction = async (request, env, id) => {
  if (!(await isAuthenticated(request, env))) return fail('unauthorized', 401)
  const existing = await findBookById(env.DB, id)
  if (!existing) return fail('not_found', 404)
  const body = await readJsonBody(request)
  const row = await updateBook(env.DB, id, {
    title:  body?.title  !== undefined ? cleanStr(body.title) : undefined,
    author: body?.author !== undefined ? (cleanStr(body.author) ?? '') : undefined,
    status: body?.status !== undefined ? cleanStatus(body.status) : undefined,
    rating: body?.rating !== undefined ? clampRating(body.rating) : undefined,
    note:   body?.note   !== undefined ? (cleanStr(body.note) ?? '') : undefined,
    cover:  body?.cover  !== undefined ? cleanStr(body.cover) : undefined,
  })
  return ok({ item: serialize(row) })
}

export const deleteBookAction = async (request, env, id) => {
  if (!(await isAuthenticated(request, env))) return fail('unauthorized', 401)
  const existing = await findBookById(env.DB, id)
  if (!existing) return fail('not_found', 404)
  await deleteBook(env.DB, id)
  return ok({})
}
