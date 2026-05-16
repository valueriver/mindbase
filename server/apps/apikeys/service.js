import { ok, fail } from '../../lib/utils/json.js'
import { readJsonBody } from '../../lib/utils/body.js'
import { isAuthenticated } from '../../lib/auth/index.js'
import { listApikeys, findApikeyById, insertApikey, updateApikey, deleteApikey } from './repository.js'

const serialize = (row) => row && ({
  id:         row.id,
  service:    row.service,
  name:       row.name || '',
  api_key:    row.api_key || '',
  scope:      row.scope || '',
  expire_at:  row.expire_at ?? null,
  note:       row.note || '',
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

export const listApikeysAction = async (request, env) => {
  if (!(await isAuthenticated(request, env))) return fail('unauthorized', 401)
  const r = await listApikeys(env.DB)
  return ok({ items: (r?.results || []).map(serialize) })
}

export const createApikeyAction = async (request, env) => {
  if (!(await isAuthenticated(request, env))) return fail('unauthorized', 401)
  const body = await readJsonBody(request)
  const service = cleanStr(body?.service)
  if (!service) return fail('service_required', 400)
  const row = await insertApikey(env.DB, {
    id:        crypto.randomUUID(),
    service,
    name:      cleanStr(body?.name),
    api_key:   cleanStr(body?.api_key),
    scope:     cleanStr(body?.scope),
    expire_at: cleanDate(body?.expire_at) ?? null,
    note:      cleanStr(body?.note),
  })
  return ok({ item: serialize(row) })
}

export const updateApikeyAction = async (request, env, id) => {
  if (!(await isAuthenticated(request, env))) return fail('unauthorized', 401)
  const existing = await findApikeyById(env.DB, id)
  if (!existing) return fail('not_found', 404)
  const body = await readJsonBody(request)
  const patch = {}
  if (body?.service !== undefined) {
    const s = cleanStr(body.service)
    if (!s) return fail('service_required', 400)
    patch.service = s
  }
  if (body?.name      !== undefined) patch.name      = cleanStr(body.name)
  if (body?.api_key   !== undefined) patch.api_key   = cleanStr(body.api_key)
  if (body?.scope     !== undefined) patch.scope     = cleanStr(body.scope)
  if (body?.expire_at !== undefined) patch.expire_at = cleanDate(body.expire_at)
  if (body?.note      !== undefined) patch.note      = cleanStr(body.note)
  const row = await updateApikey(env.DB, id, patch)
  return ok({ item: serialize(row) })
}

export const deleteApikeyAction = async (request, env, id) => {
  if (!(await isAuthenticated(request, env))) return fail('unauthorized', 401)
  const existing = await findApikeyById(env.DB, id)
  if (!existing) return fail('not_found', 404)
  await deleteApikey(env.DB, id)
  return ok({})
}
