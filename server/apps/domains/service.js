import { ok, fail } from '../../lib/utils/json.js'
import { readJsonBody } from '../../lib/utils/body.js'
import { isAuthenticated } from '../../lib/auth/index.js'
import { listDomains, findDomainById, insertDomain, updateDomain, deleteDomain } from './repository.js'

const STATUSES = new Set(['active', 'expiring', 'expired', 'parked'])

const normDate = (v) => {
  if (v === null || v === '') return null
  if (typeof v !== 'string') return undefined
  return /^\d{4}-\d{2}-\d{2}$/.test(v) ? v : undefined
}

const serialize = (row) => row && ({
  id:          row.id,
  domain:      row.domain,
  registrar:   row.registrar || '',
  expire_date: row.expire_date,
  status:      row.status,
  note:        row.note || '',
  created_at:  row.created_at,
  updated_at:  row.updated_at,
})

export const listDomainsAction = async (request, env) => {
  if (!(await isAuthenticated(request, env))) return fail('unauthorized', 401)
  const r = await listDomains(env.DB)
  return ok({ items: (r?.results || []).map(serialize) })
}

export const createDomainAction = async (request, env) => {
  if (!(await isAuthenticated(request, env))) return fail('unauthorized', 401)
  const body = await readJsonBody(request)
  const domain = String(body?.domain || '').trim()
  if (!domain) return fail('domain_required', 400)
  const status = STATUSES.has(body?.status) ? body.status : 'active'
  const expire = normDate(body?.expire_date)
  if (expire === undefined) return fail('expire_date_invalid', 400)
  const row = await insertDomain(env.DB, {
    id: crypto.randomUUID(),
    domain,
    registrar:   String(body?.registrar || '').trim(),
    expire_date: expire,
    status,
    note:        String(body?.note || '').trim(),
  })
  return ok({ item: serialize(row) })
}

export const updateDomainAction = async (request, env, id) => {
  if (!(await isAuthenticated(request, env))) return fail('unauthorized', 401)
  const body = await readJsonBody(request)
  const existing = await findDomainById(env.DB, id)
  if (!existing) return fail('not_found', 404)

  const patch = {}
  if (body?.domain !== undefined) {
    const d = String(body.domain).trim()
    if (!d) return fail('domain_required', 400)
    patch.domain = d
  }
  if (body?.registrar !== undefined) patch.registrar = String(body.registrar).trim()
  if (body?.expire_date !== undefined) {
    const e = normDate(body.expire_date)
    if (e === undefined) return fail('expire_date_invalid', 400)
    patch.expire_date = e
  }
  if (body?.status !== undefined) {
    if (!STATUSES.has(body.status)) return fail('status_invalid', 400)
    patch.status = body.status
  }
  if (body?.note !== undefined) patch.note = String(body.note).trim()

  const row = await updateDomain(env.DB, id, patch)
  return ok({ item: serialize(row) })
}

export const deleteDomainAction = async (request, env, id) => {
  if (!(await isAuthenticated(request, env))) return fail('unauthorized', 401)
  const existing = await findDomainById(env.DB, id)
  if (!existing) return fail('not_found', 404)
  await deleteDomain(env.DB, id)
  return ok({})
}
