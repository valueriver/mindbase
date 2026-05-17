import { ok, fail } from '../../system/utils/json.js'
import { readJsonBody } from '../../system/utils/body.js'
import { isAuthenticated } from '../../system/auth/index.js'
import { listDevices, findDeviceById, insertDevice, updateDevice, deleteDevice } from './repository.js'

const serialize = (row) => row && ({
  id:           row.id,
  name:         row.name,
  category:     row.category || '',
  brand:        row.brand || '',
  model:        row.model || '',
  serial:       row.serial || '',
  purchased_at: row.purchased_at ?? null,
  price:        row.price ?? 0,
  note:         row.note || '',
  cover:        row.cover || null,
  created_at:   row.created_at,
  updated_at:   row.updated_at,
})

const cleanStr = (v) => (v === undefined || v === null) ? '' : String(v).trim()
const cleanDate = (v) => {
  if (v === undefined) return undefined
  if (v === null) return null
  const s = String(v).trim()
  return /^\d{4}-\d{2}-\d{2}$/.test(s) ? s : null
}
const cleanInt = (v) => {
  if (v === undefined) return undefined
  const n = Math.round(Number(v))
  return Number.isFinite(n) ? n : 0
}
const cleanOpt = (v) => {
  if (v === undefined) return undefined
  if (v === null) return null
  const s = String(v).trim()
  return s ? s : null
}

export const listDevicesAction = async (request, env) => {
  if (!(await isAuthenticated(request, env))) return fail('unauthorized', 401)
  const r = await listDevices(env.DB)
  return ok({ items: (r?.results || []).map(serialize) })
}

export const createDeviceAction = async (request, env) => {
  if (!(await isAuthenticated(request, env))) return fail('unauthorized', 401)
  const body = await readJsonBody(request)
  const name = cleanStr(body?.name)
  if (!name) return fail('name_required', 400)
  const row = await insertDevice(env.DB, {
    id:           crypto.randomUUID(),
    name,
    category:     cleanStr(body?.category),
    brand:        cleanStr(body?.brand),
    model:        cleanStr(body?.model),
    serial:       cleanStr(body?.serial),
    purchased_at: cleanDate(body?.purchased_at) ?? null,
    price:        cleanInt(body?.price) ?? 0,
    note:         cleanStr(body?.note),
    cover:        cleanOpt(body?.cover) ?? null,
  })
  return ok({ item: serialize(row) })
}

export const updateDeviceAction = async (request, env, id) => {
  if (!(await isAuthenticated(request, env))) return fail('unauthorized', 401)
  const existing = await findDeviceById(env.DB, id)
  if (!existing) return fail('not_found', 404)
  const body = await readJsonBody(request)
  const patch = {}
  if (body?.name !== undefined) {
    const n = cleanStr(body.name)
    if (!n) return fail('name_required', 400)
    patch.name = n
  }
  if (body?.category     !== undefined) patch.category     = cleanStr(body.category)
  if (body?.brand        !== undefined) patch.brand        = cleanStr(body.brand)
  if (body?.model        !== undefined) patch.model        = cleanStr(body.model)
  if (body?.serial       !== undefined) patch.serial       = cleanStr(body.serial)
  if (body?.purchased_at !== undefined) patch.purchased_at = cleanDate(body.purchased_at)
  if (body?.price        !== undefined) patch.price        = cleanInt(body.price)
  if (body?.note         !== undefined) patch.note         = cleanStr(body.note)
  if (body?.cover        !== undefined) patch.cover        = cleanOpt(body.cover)
  const row = await updateDevice(env.DB, id, patch)
  return ok({ item: serialize(row) })
}

export const deleteDeviceAction = async (request, env, id) => {
  if (!(await isAuthenticated(request, env))) return fail('unauthorized', 401)
  const existing = await findDeviceById(env.DB, id)
  if (!existing) return fail('not_found', 404)
  await deleteDevice(env.DB, id)
  return ok({})
}
