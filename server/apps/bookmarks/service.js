import { ok, fail } from '../../lib/utils/json.js'
import { readJsonBody } from '../../lib/utils/body.js'
import { isAuthenticated } from '../../lib/auth/index.js'
import {
  listBookmarks,
  findBookmarkById,
  insertBookmark,
  updateBookmark,
  deleteBookmark,
} from './repository.js'

const serialize = (row) => row && ({
  id:          row.id,
  url:         row.url,
  title:       row.title || '',
  description: row.description || '',
  cover:       row.cover || null,
  created_at:  row.created_at,
  updated_at:  row.updated_at,
})

const cleanStr = (v) => (v === undefined || v === null) ? null : String(v).trim()

export const listBookmarksAction = async (request, env, url) => {
  if (!(await isAuthenticated(request, env))) return fail('unauthorized', 401)
  const limit  = Math.min(Number(url.searchParams.get('limit'))  || 200, 500)
  const offset = Math.max(Number(url.searchParams.get('offset')) || 0, 0)
  const result = await listBookmarks(env.DB, { limit, offset })
  return ok({ items: (result?.results || []).map(serialize) })
}

export const createBookmarkAction = async (request, env) => {
  if (!(await isAuthenticated(request, env))) return fail('unauthorized', 401)
  const body = await readJsonBody(request)
  const url = cleanStr(body?.url)
  if (!url) return fail('url_required', 400)
  const row = await insertBookmark(env.DB, {
    id:          crypto.randomUUID(),
    url,
    title:       cleanStr(body?.title),
    description: cleanStr(body?.description),
    cover:       cleanStr(body?.cover),
  })
  return ok({ item: serialize(row) })
}

export const updateBookmarkAction = async (request, env, id) => {
  if (!(await isAuthenticated(request, env))) return fail('unauthorized', 401)
  const existing = await findBookmarkById(env.DB, id)
  if (!existing) return fail('not_found', 404)
  const body = await readJsonBody(request)
  const row = await updateBookmark(env.DB, id, {
    url:         body?.url         !== undefined ? cleanStr(body.url) : undefined,
    title:       body?.title       !== undefined ? cleanStr(body.title) : undefined,
    description: body?.description !== undefined ? cleanStr(body.description) : undefined,
    cover:       body?.cover       !== undefined ? cleanStr(body.cover) : undefined,
  })
  return ok({ item: serialize(row) })
}

export const deleteBookmarkAction = async (request, env, id) => {
  if (!(await isAuthenticated(request, env))) return fail('unauthorized', 401)
  const existing = await findBookmarkById(env.DB, id)
  if (!existing) return fail('not_found', 404)
  await deleteBookmark(env.DB, id)
  return ok({})
}
