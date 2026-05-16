import { ok, fail } from '../../lib/utils/json.js'
import { readJsonBody } from '../../lib/utils/body.js'
import { isAuthenticated } from '../../lib/auth/index.js'
import {
  listWishlist,
  findWishlistById,
  insertWishlist,
  updateWishlist,
  deleteWishlist,
} from './repository.js'

const PRIORITIES = new Set(['high', 'normal', 'low'])
const STATUSES   = new Set(['want', 'bought', 'gave_up'])

const serialize = (row) => row && ({
  id:         row.id,
  name:       row.name,
  url:        row.url || '',
  price:      Number(row.price || 0),
  priority:   row.priority || 'normal',
  status:     row.status || 'want',
  note:       row.note || '',
  cover:      row.cover || null,
  created_at: row.created_at,
  updated_at: row.updated_at,
})

const cleanStr = (v) => (v === undefined || v === null) ? null : String(v).trim()
const cleanPriority = (v) => {
  const s = cleanStr(v)
  return s && PRIORITIES.has(s) ? s : null
}
const cleanStatus = (v) => {
  const s = cleanStr(v)
  return s && STATUSES.has(s) ? s : null
}
// 前端传"元"(数字),转"分"(整数);非法返回 null
const priceToCents = (v) => {
  if (v === undefined || v === null || v === '') return null
  const n = Number(v)
  if (!Number.isFinite(n) || n < 0) return null
  return Math.round(n * 100)
}

export const listWishlistAction = async (request, env, url) => {
  if (!(await isAuthenticated(request, env))) return fail('unauthorized', 401)
  const status = cleanStatus(url.searchParams.get('status'))
  const r = await listWishlist(env.DB, { status })
  return ok({ items: (r?.results || []).map(serialize) })
}

export const createWishlistAction = async (request, env) => {
  if (!(await isAuthenticated(request, env))) return fail('unauthorized', 401)
  const body = await readJsonBody(request)
  const name = cleanStr(body?.name)
  if (!name) return fail('name_required', 400)
  const row = await insertWishlist(env.DB, {
    id:       crypto.randomUUID(),
    name,
    url:      cleanStr(body?.url) || '',
    price:    priceToCents(body?.price) ?? 0,
    priority: cleanPriority(body?.priority) || 'normal',
    status:   cleanStatus(body?.status) || 'want',
    note:     cleanStr(body?.note) || '',
    cover:    cleanStr(body?.cover),
  })
  return ok({ item: serialize(row) })
}

export const updateWishlistAction = async (request, env, id) => {
  if (!(await isAuthenticated(request, env))) return fail('unauthorized', 401)
  const existing = await findWishlistById(env.DB, id)
  if (!existing) return fail('not_found', 404)
  const body = await readJsonBody(request)

  let name
  if (body?.name !== undefined) {
    name = cleanStr(body.name)
    if (!name) return fail('name_required', 400)
  }

  const row = await updateWishlist(env.DB, id, {
    name,
    url:      body?.url      !== undefined ? (cleanStr(body.url) ?? '') : undefined,
    price:    body?.price    !== undefined ? (priceToCents(body.price) ?? 0) : undefined,
    priority: body?.priority !== undefined ? cleanPriority(body.priority) : undefined,
    status:   body?.status   !== undefined ? cleanStatus(body.status) : undefined,
    note:     body?.note     !== undefined ? (cleanStr(body.note) ?? '') : undefined,
    cover:    body?.cover    !== undefined ? cleanStr(body.cover) : undefined,
  })
  return ok({ item: serialize(row) })
}

export const deleteWishlistAction = async (request, env, id) => {
  if (!(await isAuthenticated(request, env))) return fail('unauthorized', 401)
  const existing = await findWishlistById(env.DB, id)
  if (!existing) return fail('not_found', 404)
  await deleteWishlist(env.DB, id)
  return ok({})
}
