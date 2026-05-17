import { ok, fail } from '../../system/utils/json.js'
import { readJsonBody } from '../../system/utils/body.js'
import { isAuthenticated } from '../../system/auth/index.js'
import {
  listPages,
  findPageById,
  insertPage,
  updatePage,
  deletePage,
} from './repository.js'

const MAX_HTML  = 1_000_000
const MAX_TITLE = 200
const MAX_DESC  = 500

const serialize = (row) => row && ({
  id:          row.id,
  title:       row.title || '',
  description: row.description || '',
  html:        row.html || '',
  created_at:  row.created_at,
  updated_at:  row.updated_at,
})

export const listPagesAction = async (request, env) => {
  if (!(await isAuthenticated(request, env))) return fail('unauthorized', 401)
  const result = await listPages(env.DB)
  return ok({ pages: (result?.results || []).map(serialize) })
}

export const createPageAction = async (request, env) => {
  if (!(await isAuthenticated(request, env))) return fail('unauthorized', 401)
  const body = await readJsonBody(request)
  const title       = String(body?.title || '').trim().slice(0, MAX_TITLE)
  const description = String(body?.description || '').trim().slice(0, MAX_DESC)
  const html        = String(body?.html || '')
  if (!html.trim()) return fail('html_required', 400)
  if (html.length > MAX_HTML) return fail('html_too_long', 400)
  const row = await insertPage(env.DB, { id: crypto.randomUUID(), title, description, html })
  return ok({ page: serialize(row) })
}

export const updatePageAction = async (request, env, id) => {
  if (!(await isAuthenticated(request, env))) return fail('unauthorized', 401)
  const body = await readJsonBody(request)
  const existing = await findPageById(env.DB, id)
  if (!existing) return fail('not_found', 404)
  const patch = {}
  if (body?.title !== undefined)       patch.title       = String(body.title).trim().slice(0, MAX_TITLE)
  if (body?.description !== undefined) patch.description = String(body.description).trim().slice(0, MAX_DESC)
  if (body?.html !== undefined) {
    const html = String(body.html)
    if (!html.trim()) return fail('html_required', 400)
    if (html.length > MAX_HTML) return fail('html_too_long', 400)
    patch.html = html
  }
  const row = await updatePage(env.DB, id, patch)
  return ok({ page: serialize(row) })
}

export const deletePageAction = async (request, env, id) => {
  if (!(await isAuthenticated(request, env))) return fail('unauthorized', 401)
  const existing = await findPageById(env.DB, id)
  if (!existing) return fail('not_found', 404)
  await deletePage(env.DB, id)
  return ok({})
}
