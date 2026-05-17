import { ok, fail } from '../../system/utils/json.js'
import { readJsonBody } from '../../system/utils/body.js'
import { isAuthenticated } from '../../system/auth/index.js'
import { listExhibitions, findExhibitionById, insertExhibition, updateExhibition, deleteExhibition } from './repository.js'

const serialize = (row) => row && ({
  id:         row.id,
  title:      row.title,
  venue:      row.venue || '',
  city:       row.city || '',
  visited_at: row.visited_at ?? null,
  rating:     row.rating ?? 0,
  note:       row.note || '',
  cover:      row.cover || null,
  created_at: row.created_at,
  updated_at: row.updated_at,
})

const cleanStr = (v) => (v === undefined || v === null) ? '' : String(v).trim()
const cleanDate = (v) => {
  if (v === undefined) return undefined
  if (v === null) return null
  const s = String(v).trim()
  return /^\d{4}-\d{2}-\d{2}$/.test(s) ? s : null
}
const cleanRating = (v) => {
  if (v === undefined) return undefined
  const n = Math.round(Number(v))
  if (!Number.isFinite(n)) return 0
  return Math.max(0, Math.min(5, n))
}
const cleanOpt = (v) => {
  if (v === undefined) return undefined
  if (v === null) return null
  const s = String(v).trim()
  return s ? s : null
}

export const listExhibitionsAction = async (request, env) => {
  if (!(await isAuthenticated(request, env))) return fail('unauthorized', 401)
  const r = await listExhibitions(env.DB)
  return ok({ items: (r?.results || []).map(serialize) })
}

export const createExhibitionAction = async (request, env) => {
  if (!(await isAuthenticated(request, env))) return fail('unauthorized', 401)
  const body = await readJsonBody(request)
  const title = cleanStr(body?.title)
  if (!title) return fail('title_required', 400)
  const row = await insertExhibition(env.DB, {
    id:         crypto.randomUUID(),
    title,
    venue:      cleanStr(body?.venue),
    city:       cleanStr(body?.city),
    visited_at: cleanDate(body?.visited_at) ?? null,
    rating:     cleanRating(body?.rating) ?? 0,
    note:       cleanStr(body?.note),
    cover:      cleanOpt(body?.cover) ?? null,
  })
  return ok({ item: serialize(row) })
}

export const updateExhibitionAction = async (request, env, id) => {
  if (!(await isAuthenticated(request, env))) return fail('unauthorized', 401)
  const existing = await findExhibitionById(env.DB, id)
  if (!existing) return fail('not_found', 404)
  const body = await readJsonBody(request)
  const patch = {}
  if (body?.title !== undefined) {
    const t = cleanStr(body.title)
    if (!t) return fail('title_required', 400)
    patch.title = t
  }
  if (body?.venue      !== undefined) patch.venue      = cleanStr(body.venue)
  if (body?.city       !== undefined) patch.city       = cleanStr(body.city)
  if (body?.visited_at !== undefined) patch.visited_at = cleanDate(body.visited_at)
  if (body?.rating     !== undefined) patch.rating     = cleanRating(body.rating)
  if (body?.note       !== undefined) patch.note       = cleanStr(body.note)
  if (body?.cover      !== undefined) patch.cover      = cleanOpt(body.cover)
  const row = await updateExhibition(env.DB, id, patch)
  return ok({ item: serialize(row) })
}

export const deleteExhibitionAction = async (request, env, id) => {
  if (!(await isAuthenticated(request, env))) return fail('unauthorized', 401)
  const existing = await findExhibitionById(env.DB, id)
  if (!existing) return fail('not_found', 404)
  await deleteExhibition(env.DB, id)
  return ok({})
}
