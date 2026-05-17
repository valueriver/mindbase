import { ok, fail } from '../../system/utils/json.js'
import { readJsonBody } from '../../system/utils/body.js'
import { isAuthenticated } from '../../system/auth/index.js'
import { listLlms, findLlmById, insertLlm, updateLlm, deleteLlm } from './repository.js'

const serialize = (row) => row && ({
  id:            row.id,
  provider:      row.provider || '',
  name:          row.name,
  api_key:       row.api_key || '',
  base_url:      row.base_url || '',
  default_model: row.default_model || '',
  quota_note:    row.quota_note || '',
  note:          row.note || '',
  created_at:    row.created_at,
  updated_at:    row.updated_at,
})

const cleanStr = (v) => (v === undefined || v === null) ? '' : String(v).trim()

export const listLlmsAction = async (request, env) => {
  if (!(await isAuthenticated(request, env))) return fail('unauthorized', 401)
  const r = await listLlms(env.DB)
  return ok({ items: (r?.results || []).map(serialize) })
}

export const createLlmAction = async (request, env) => {
  if (!(await isAuthenticated(request, env))) return fail('unauthorized', 401)
  const body = await readJsonBody(request)
  const name = cleanStr(body?.name)
  if (!name) return fail('name_required', 400)
  const row = await insertLlm(env.DB, {
    id:            crypto.randomUUID(),
    provider:      cleanStr(body?.provider),
    name,
    api_key:       cleanStr(body?.api_key),
    base_url:      cleanStr(body?.base_url),
    default_model: cleanStr(body?.default_model),
    quota_note:    cleanStr(body?.quota_note),
    note:          cleanStr(body?.note),
  })
  return ok({ item: serialize(row) })
}

export const updateLlmAction = async (request, env, id) => {
  if (!(await isAuthenticated(request, env))) return fail('unauthorized', 401)
  const existing = await findLlmById(env.DB, id)
  if (!existing) return fail('not_found', 404)
  const body = await readJsonBody(request)
  const patch = {}
  if (body?.name !== undefined) {
    const n = cleanStr(body.name)
    if (!n) return fail('name_required', 400)
    patch.name = n
  }
  for (const col of ['provider','api_key','base_url','default_model','quota_note','note']) {
    if (body?.[col] !== undefined) patch[col] = cleanStr(body[col])
  }
  const row = await updateLlm(env.DB, id, patch)
  return ok({ item: serialize(row) })
}

export const deleteLlmAction = async (request, env, id) => {
  if (!(await isAuthenticated(request, env))) return fail('unauthorized', 401)
  const existing = await findLlmById(env.DB, id)
  if (!existing) return fail('not_found', 404)
  await deleteLlm(env.DB, id)
  return ok({})
}
