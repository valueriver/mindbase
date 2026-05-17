import { ok, fail } from '../../system/utils/json.js'
import { readJsonBody } from '../../system/utils/body.js'
import { isAuthenticated } from '../../system/auth/index.js'
import {
  listFootprints,
  findFootprintById,
  insertFootprint,
  updateFootprint,
  deleteFootprint,
} from './repository.js'

const serialize = (row) => row && ({
  id:         row.id,
  name:       row.name,
  country:    row.country || '',
  city:       row.city || '',
  visited_at: row.visited_at ?? null,
  note:       row.note || '',
  cover:      row.cover || null,
  created_at: row.created_at,
  updated_at: row.updated_at,
})

const cleanStr = (v) => (v === undefined || v === null) ? '' : String(v).trim()
const cleanOpt = (v) => {
  if (v === undefined) return undefined
  if (v === null) return null
  const s = String(v).trim()
  return s ? s : null
}
// 支持 YYYY-MM 或 YYYY-MM-DD
const cleanVisited = (v) => {
  if (v === undefined) return undefined
  if (v === null) return null
  const s = String(v).trim()
  return /^\d{4}-\d{2}(-\d{2})?$/.test(s) ? s : null
}

export const listFootprintsAction = async (request, env, url) => {
  if (!(await isAuthenticated(request, env))) return fail('unauthorized', 401)
  const limit  = Math.min(Number(url.searchParams.get('limit'))  || 200, 500)
  const offset = Math.max(Number(url.searchParams.get('offset')) || 0, 0)
  const result = await listFootprints(env.DB, { limit, offset })
  return ok({ items: (result?.results || []).map(serialize) })
}

export const createFootprintAction = async (request, env) => {
  if (!(await isAuthenticated(request, env))) return fail('unauthorized', 401)
  const body = await readJsonBody(request)
  const name = cleanStr(body?.name)
  if (!name) return fail('name_required', 400)
  const row = await insertFootprint(env.DB, {
    id:         crypto.randomUUID(),
    name,
    country:    cleanStr(body?.country),
    city:       cleanStr(body?.city),
    visited_at: cleanVisited(body?.visited_at) ?? null,
    note:       cleanStr(body?.note),
    cover:      cleanOpt(body?.cover) ?? null,
  })
  return ok({ item: serialize(row) })
}

export const updateFootprintAction = async (request, env, id) => {
  if (!(await isAuthenticated(request, env))) return fail('unauthorized', 401)
  const existing = await findFootprintById(env.DB, id)
  if (!existing) return fail('not_found', 404)
  const body = await readJsonBody(request)
  const patch = {}
  if (body?.name !== undefined) {
    const n = cleanStr(body.name)
    if (!n) return fail('name_required', 400)
    patch.name = n
  }
  if (body?.country    !== undefined) patch.country    = cleanStr(body.country)
  if (body?.city       !== undefined) patch.city       = cleanStr(body.city)
  if (body?.visited_at !== undefined) patch.visited_at = cleanVisited(body.visited_at)
  if (body?.note       !== undefined) patch.note       = cleanStr(body.note)
  if (body?.cover      !== undefined) patch.cover      = cleanOpt(body.cover)
  const row = await updateFootprint(env.DB, id, patch)
  return ok({ item: serialize(row) })
}

export const deleteFootprintAction = async (request, env, id) => {
  if (!(await isAuthenticated(request, env))) return fail('unauthorized', 401)
  const existing = await findFootprintById(env.DB, id)
  if (!existing) return fail('not_found', 404)
  await deleteFootprint(env.DB, id)
  return ok({})
}
