import { ok, fail } from '../../system/utils/json.js'
import { readJsonBody } from '../../system/utils/body.js'
import { isAuthenticated } from '../../system/auth/index.js'
import {
  listResumeEntries, findResumeEntryById, insertResumeEntry, updateResumeEntry, deleteResumeEntry,
} from './repository.js'

const KINDS = new Set(['work', 'edu', 'project', 'skill', 'other'])

const normMonth = (v) => {
  if (v === undefined || v === null) return null
  const s = String(v).trim()
  if (!s) return null
  return /^\d{4}-\d{2}$/.test(s) ? s : null
}

const serialize = (row) => row && ({
  id:          row.id,
  kind:        row.kind,
  title:       row.title,
  org:         row.org || '',
  start_date:  row.start_date || null,
  end_date:    row.end_date || null,
  description: row.description || '',
  sort_order:  row.sort_order ?? 0,
  created_at:  row.created_at,
  updated_at:  row.updated_at,
})

export const listResumeAction = async (request, env, url) => {
  if (!(await isAuthenticated(request, env))) return fail('unauthorized', 401)
  const kind = url.searchParams.get('kind')
  const r = await listResumeEntries(env.DB, { kind: KINDS.has(kind) ? kind : null })
  return ok({ items: (r?.results || []).map(serialize) })
}

export const createResumeAction = async (request, env) => {
  if (!(await isAuthenticated(request, env))) return fail('unauthorized', 401)
  const body = await readJsonBody(request)
  const title = String(body?.title || '').trim()
  if (!title) return fail('title_required', 400)
  const kind = KINDS.has(body?.kind) ? body.kind : 'work'
  const row = await insertResumeEntry(env.DB, {
    id: crypto.randomUUID(),
    kind,
    title,
    org:         String(body?.org || '').trim(),
    start_date:  normMonth(body?.start_date),
    end_date:    normMonth(body?.end_date),
    description: String(body?.description || '').trim(),
    sort_order:  Number.isFinite(body?.sort_order) ? body.sort_order : 0,
  })
  return ok({ item: serialize(row) })
}

export const updateResumeAction = async (request, env, id) => {
  if (!(await isAuthenticated(request, env))) return fail('unauthorized', 401)
  const body = await readJsonBody(request)
  const existing = await findResumeEntryById(env.DB, id)
  if (!existing) return fail('not_found', 404)

  const patch = {}
  if (body?.title !== undefined) {
    const t = String(body.title).trim()
    if (!t) return fail('title_required', 400)
    patch.title = t
  }
  if (body?.kind !== undefined) {
    if (!KINDS.has(body.kind)) return fail('kind_invalid', 400)
    patch.kind = body.kind
  }
  if (body?.org !== undefined)         patch.org = String(body.org).trim()
  if (body?.start_date !== undefined)  patch.start_date = normMonth(body.start_date)
  if (body?.end_date !== undefined)    patch.end_date = normMonth(body.end_date)
  if (body?.description !== undefined) patch.description = String(body.description).trim()
  if (body?.sort_order !== undefined && Number.isFinite(body.sort_order)) patch.sort_order = body.sort_order

  // start_date/end_date 都需要传到 update(null 也要传),把 existing 兜底
  if (patch.start_date === undefined) patch.start_date = existing.start_date
  if (patch.end_date === undefined)   patch.end_date = existing.end_date

  const row = await updateResumeEntry(env.DB, id, patch)
  return ok({ item: serialize(row) })
}

export const deleteResumeAction = async (request, env, id) => {
  if (!(await isAuthenticated(request, env))) return fail('unauthorized', 401)
  const existing = await findResumeEntryById(env.DB, id)
  if (!existing) return fail('not_found', 404)
  await deleteResumeEntry(env.DB, id)
  return ok({})
}
