import { ok, fail } from '../../system/utils/json.js'
import { readJsonBody } from '../../system/utils/body.js'
import { isAuthenticated } from '../../system/auth/index.js'
import {
  listManuals,
  findManualById,
  insertManual,
  updateManual,
  deleteManual,
} from './repository.js'

const serialize = (row) => row && ({
  id:             row.id,
  product_name:   row.product_name,
  brand:          row.brand || '',
  manual_url:     row.manual_url || '',
  purchased_at:   row.purchased_at ?? null,
  warranty_until: row.warranty_until ?? null,
  note:           row.note || '',
  cover:          row.cover || null,
  created_at:     row.created_at,
  updated_at:     row.updated_at,
})

const cleanStr = (v) => (v === undefined || v === null) ? '' : String(v).trim()
const cleanOpt = (v) => {
  if (v === undefined) return undefined
  if (v === null) return null
  const s = String(v).trim()
  return s ? s : null
}
const cleanDate = (v) => {
  if (v === undefined) return undefined
  if (v === null) return null
  const s = String(v).trim()
  return /^\d{4}-\d{2}-\d{2}$/.test(s) ? s : null
}

export const listManualsAction = async (request, env, url) => {
  if (!(await isAuthenticated(request, env))) return fail('unauthorized', 401)
  const limit  = Math.min(Number(url.searchParams.get('limit'))  || 200, 500)
  const offset = Math.max(Number(url.searchParams.get('offset')) || 0, 0)
  const result = await listManuals(env.DB, { limit, offset })
  return ok({ items: (result?.results || []).map(serialize) })
}

export const createManualAction = async (request, env) => {
  if (!(await isAuthenticated(request, env))) return fail('unauthorized', 401)
  const body = await readJsonBody(request)
  const product_name = cleanStr(body?.product_name)
  if (!product_name) return fail('product_name_required', 400)
  const row = await insertManual(env.DB, {
    id:             crypto.randomUUID(),
    product_name,
    brand:          cleanStr(body?.brand),
    manual_url:     cleanStr(body?.manual_url),
    purchased_at:   cleanDate(body?.purchased_at) ?? null,
    warranty_until: cleanDate(body?.warranty_until) ?? null,
    note:           cleanStr(body?.note),
    cover:          cleanOpt(body?.cover) ?? null,
  })
  return ok({ item: serialize(row) })
}

export const updateManualAction = async (request, env, id) => {
  if (!(await isAuthenticated(request, env))) return fail('unauthorized', 401)
  const existing = await findManualById(env.DB, id)
  if (!existing) return fail('not_found', 404)
  const body = await readJsonBody(request)
  const patch = {}
  if (body?.product_name !== undefined) {
    const n = cleanStr(body.product_name)
    if (!n) return fail('product_name_required', 400)
    patch.product_name = n
  }
  if (body?.brand          !== undefined) patch.brand          = cleanStr(body.brand)
  if (body?.manual_url     !== undefined) patch.manual_url     = cleanStr(body.manual_url)
  if (body?.purchased_at   !== undefined) patch.purchased_at   = cleanDate(body.purchased_at)
  if (body?.warranty_until !== undefined) patch.warranty_until = cleanDate(body.warranty_until)
  if (body?.note           !== undefined) patch.note           = cleanStr(body.note)
  if (body?.cover          !== undefined) patch.cover          = cleanOpt(body.cover)
  const row = await updateManual(env.DB, id, patch)
  return ok({ item: serialize(row) })
}

export const deleteManualAction = async (request, env, id) => {
  if (!(await isAuthenticated(request, env))) return fail('unauthorized', 401)
  const existing = await findManualById(env.DB, id)
  if (!existing) return fail('not_found', 404)
  await deleteManual(env.DB, id)
  return ok({})
}
