import { ok, fail } from '../../system/utils/json.js'
import { readJsonBody } from '../../system/utils/body.js'
import { isAuthenticated } from '../../system/auth/index.js'
import { listServers, findServerById, insertServer, updateServer, deleteServer } from './repository.js'

const STATUSES = new Set(['active', 'expired', 'retired'])
const CYCLES   = new Set(['monthly', 'yearly', 'one-time'])

const serialize = (row) => row && ({
  id:           row.id,
  name:         row.name,
  provider:     row.provider || '',
  host:         row.host || '',
  ssh_port:     row.ssh_port ?? 22,
  ssh_user:     row.ssh_user || '',
  ssh_key_note: row.ssh_key_note || '',
  cost:         row.cost ?? 0,
  cost_cycle:   row.cost_cycle || 'monthly',
  expire_at:    row.expire_at ?? null,
  status:       row.status || 'active',
  note:         row.note || '',
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
const cleanPort = (v) => {
  if (v === undefined) return undefined
  const n = Math.round(Number(v))
  return Number.isFinite(n) && n > 0 && n < 65536 ? n : 22
}

export const listServersAction = async (request, env, url) => {
  if (!(await isAuthenticated(request, env))) return fail('unauthorized', 401)
  const status = url.searchParams.get('status')
  const r = await listServers(env.DB, { status: STATUSES.has(status) ? status : null })
  return ok({ items: (r?.results || []).map(serialize) })
}

export const createServerAction = async (request, env) => {
  if (!(await isAuthenticated(request, env))) return fail('unauthorized', 401)
  const body = await readJsonBody(request)
  const name = cleanStr(body?.name)
  if (!name) return fail('name_required', 400)
  const row = await insertServer(env.DB, {
    id:           crypto.randomUUID(),
    name,
    provider:     cleanStr(body?.provider),
    host:         cleanStr(body?.host),
    ssh_port:     cleanPort(body?.ssh_port) ?? 22,
    ssh_user:     cleanStr(body?.ssh_user),
    ssh_key_note: cleanStr(body?.ssh_key_note),
    cost:         cleanInt(body?.cost) ?? 0,
    cost_cycle:   CYCLES.has(body?.cost_cycle) ? body.cost_cycle : 'monthly',
    expire_at:    cleanDate(body?.expire_at) ?? null,
    status:       STATUSES.has(body?.status) ? body.status : 'active',
    note:         cleanStr(body?.note),
  })
  return ok({ item: serialize(row) })
}

export const updateServerAction = async (request, env, id) => {
  if (!(await isAuthenticated(request, env))) return fail('unauthorized', 401)
  const existing = await findServerById(env.DB, id)
  if (!existing) return fail('not_found', 404)
  const body = await readJsonBody(request)
  const patch = {}
  if (body?.name !== undefined) {
    const n = cleanStr(body.name)
    if (!n) return fail('name_required', 400)
    patch.name = n
  }
  if (body?.provider     !== undefined) patch.provider     = cleanStr(body.provider)
  if (body?.host         !== undefined) patch.host         = cleanStr(body.host)
  if (body?.ssh_port     !== undefined) patch.ssh_port     = cleanPort(body.ssh_port)
  if (body?.ssh_user     !== undefined) patch.ssh_user     = cleanStr(body.ssh_user)
  if (body?.ssh_key_note !== undefined) patch.ssh_key_note = cleanStr(body.ssh_key_note)
  if (body?.cost         !== undefined) patch.cost         = cleanInt(body.cost)
  if (body?.cost_cycle   !== undefined) {
    if (!CYCLES.has(body.cost_cycle)) return fail('cost_cycle_invalid', 400)
    patch.cost_cycle = body.cost_cycle
  }
  if (body?.expire_at    !== undefined) patch.expire_at    = cleanDate(body.expire_at)
  if (body?.status       !== undefined) {
    if (!STATUSES.has(body.status)) return fail('status_invalid', 400)
    patch.status = body.status
  }
  if (body?.note         !== undefined) patch.note         = cleanStr(body.note)
  const row = await updateServer(env.DB, id, patch)
  return ok({ item: serialize(row) })
}

export const deleteServerAction = async (request, env, id) => {
  if (!(await isAuthenticated(request, env))) return fail('unauthorized', 401)
  const existing = await findServerById(env.DB, id)
  if (!existing) return fail('not_found', 404)
  await deleteServer(env.DB, id)
  return ok({})
}
