import { ok, fail } from '../../lib/utils/json.js'
import { readJsonBody } from '../../lib/utils/body.js'
import { isAuthenticated } from '../../lib/auth/index.js'
import {
  listDocs,
  findDocById,
  insertDoc,
  updateDoc,
  deleteDoc,
} from './repository.js'

const serialize = (row) => row && ({
  id:          row.id,
  name:        row.name,
  number:      row.number || '',
  issuer:      row.issuer || '',
  issued_at:   row.issued_at ?? null,
  expire_at:   row.expire_at ?? null,
  image_front: row.image_front || null,
  image_back:  row.image_back || null,
  note:        row.note || '',
  created_at:  row.created_at,
  updated_at:  row.updated_at,
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

export const listDocsAction = async (request, env, url) => {
  if (!(await isAuthenticated(request, env))) return fail('unauthorized', 401)
  const limit  = Math.min(Number(url.searchParams.get('limit'))  || 200, 500)
  const offset = Math.max(Number(url.searchParams.get('offset')) || 0, 0)
  const result = await listDocs(env.DB, { limit, offset })
  return ok({ items: (result?.results || []).map(serialize) })
}

export const createDocAction = async (request, env) => {
  if (!(await isAuthenticated(request, env))) return fail('unauthorized', 401)
  const body = await readJsonBody(request)
  const name = cleanStr(body?.name)
  if (!name) return fail('name_required', 400)
  const row = await insertDoc(env.DB, {
    id:          crypto.randomUUID(),
    name,
    number:      cleanStr(body?.number),
    issuer:      cleanStr(body?.issuer),
    issued_at:   cleanDate(body?.issued_at) ?? null,
    expire_at:   cleanDate(body?.expire_at) ?? null,
    image_front: cleanOpt(body?.image_front) ?? null,
    image_back:  cleanOpt(body?.image_back) ?? null,
    note:        cleanStr(body?.note),
  })
  return ok({ item: serialize(row) })
}

export const updateDocAction = async (request, env, id) => {
  if (!(await isAuthenticated(request, env))) return fail('unauthorized', 401)
  const existing = await findDocById(env.DB, id)
  if (!existing) return fail('not_found', 404)
  const body = await readJsonBody(request)
  const patch = {}
  if (body?.name !== undefined) {
    const n = cleanStr(body.name)
    if (!n) return fail('name_required', 400)
    patch.name = n
  }
  if (body?.number      !== undefined) patch.number      = cleanStr(body.number)
  if (body?.issuer      !== undefined) patch.issuer      = cleanStr(body.issuer)
  if (body?.issued_at   !== undefined) patch.issued_at   = cleanDate(body.issued_at)
  if (body?.expire_at   !== undefined) patch.expire_at   = cleanDate(body.expire_at)
  if (body?.image_front !== undefined) patch.image_front = cleanOpt(body.image_front)
  if (body?.image_back  !== undefined) patch.image_back  = cleanOpt(body.image_back)
  if (body?.note        !== undefined) patch.note        = cleanStr(body.note)
  const row = await updateDoc(env.DB, id, patch)
  return ok({ item: serialize(row) })
}

export const deleteDocAction = async (request, env, id) => {
  if (!(await isAuthenticated(request, env))) return fail('unauthorized', 401)
  const existing = await findDocById(env.DB, id)
  if (!existing) return fail('not_found', 404)
  await deleteDoc(env.DB, id)
  return ok({})
}
