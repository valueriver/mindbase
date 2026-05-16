import { ok, fail } from '../../lib/utils/json.js'
import { readJsonBody } from '../../lib/utils/body.js'
import { isAuthenticated } from '../../lib/auth/index.js'
import {
  listApps,
  findAppById,
  insertApp,
  updateApp,
  deleteApp,
} from './repository.js'

const STATUSES = new Set(['using', 'replaced', 'dropped'])

const serialize = (row) => row && ({
  id:         row.id,
  name:       row.name,
  platform:   row.platform || '',
  category:   row.category || '',
  url:        row.url || '',
  status:     row.status || 'using',
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
const cleanStatus = (v) => {
  const s = cleanStr(v)
  return s && STATUSES.has(s) ? s : null
}

export const listAppsAction = async (request, env, url) => {
  if (!(await isAuthenticated(request, env))) return fail('unauthorized', 401)
  const limit  = Math.min(Number(url.searchParams.get('limit'))  || 200, 500)
  const offset = Math.max(Number(url.searchParams.get('offset')) || 0, 0)
  const status = cleanStatus(url.searchParams.get('status'))
  const result = await listApps(env.DB, { status, limit, offset })
  return ok({ items: (result?.results || []).map(serialize) })
}

export const createAppAction = async (request, env) => {
  if (!(await isAuthenticated(request, env))) return fail('unauthorized', 401)
  const body = await readJsonBody(request)
  const name = cleanStr(body?.name)
  if (!name) return fail('name_required', 400)
  const row = await insertApp(env.DB, {
    id:       crypto.randomUUID(),
    name,
    platform: cleanStr(body?.platform),
    category: cleanStr(body?.category),
    url:      cleanStr(body?.url),
    status:   cleanStatus(body?.status) || 'using',
    note:     cleanStr(body?.note),
    cover:    cleanOpt(body?.cover) ?? null,
  })
  return ok({ item: serialize(row) })
}

export const updateAppAction = async (request, env, id) => {
  if (!(await isAuthenticated(request, env))) return fail('unauthorized', 401)
  const existing = await findAppById(env.DB, id)
  if (!existing) return fail('not_found', 404)
  const body = await readJsonBody(request)
  const patch = {}
  if (body?.name !== undefined) {
    const n = cleanStr(body.name)
    if (!n) return fail('name_required', 400)
    patch.name = n
  }
  if (body?.platform !== undefined) patch.platform = cleanStr(body.platform)
  if (body?.category !== undefined) patch.category = cleanStr(body.category)
  if (body?.url      !== undefined) patch.url      = cleanStr(body.url)
  if (body?.status   !== undefined) {
    const s = cleanStatus(body.status)
    if (!s) return fail('status_invalid', 400)
    patch.status = s
  }
  if (body?.note  !== undefined) patch.note  = cleanStr(body.note)
  if (body?.cover !== undefined) patch.cover = cleanOpt(body.cover)
  const row = await updateApp(env.DB, id, patch)
  return ok({ item: serialize(row) })
}

export const deleteAppAction = async (request, env, id) => {
  if (!(await isAuthenticated(request, env))) return fail('unauthorized', 401)
  const existing = await findAppById(env.DB, id)
  if (!existing) return fail('not_found', 404)
  await deleteApp(env.DB, id)
  return ok({})
}
