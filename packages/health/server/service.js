import { ok, fail } from '../../system/utils/json.js'
import { readJsonBody } from '../../system/utils/body.js'
import { isAuthenticated } from '../../system/auth/index.js'
import {
  listHealthEntries, findHealthEntryById, findHealthEntryByDate,
  insertHealthEntry, updateHealthEntry, deleteHealthEntry,
} from './repository.js'

const serialize = (row) => row && ({
  id:         row.id,
  date:       row.date,
  weight_g:   row.weight_g ?? null,
  sleep_min:  row.sleep_min ?? null,
  mood:       row.mood || '',
  exercise:   row.exercise || '',
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
const cleanIntOrNull = (v) => {
  if (v === undefined) return undefined
  if (v === null || v === '') return null
  const n = Math.round(Number(v))
  return Number.isFinite(n) ? n : null
}

export const listHealthAction = async (request, env, url) => {
  if (!(await isAuthenticated(request, env))) return fail('unauthorized', 401)
  const limit  = Math.min(Number(url.searchParams.get('limit'))  || 200, 500)
  const offset = Math.max(Number(url.searchParams.get('offset')) || 0, 0)
  const r = await listHealthEntries(env.DB, { limit, offset })
  return ok({ items: (r?.results || []).map(serialize) })
}

export const createHealthAction = async (request, env) => {
  if (!(await isAuthenticated(request, env))) return fail('unauthorized', 401)
  const body = await readJsonBody(request)
  const date = cleanDate(body?.date)
  if (!date) return fail('date_required', 400)
  const exists = await findHealthEntryByDate(env.DB, date)
  if (exists) return fail('date_exists', 400)
  const row = await insertHealthEntry(env.DB, {
    id:        crypto.randomUUID(),
    date,
    weight_g:  cleanIntOrNull(body?.weight_g) ?? null,
    sleep_min: cleanIntOrNull(body?.sleep_min) ?? null,
    mood:      cleanStr(body?.mood),
    exercise:  cleanStr(body?.exercise),
    note:      cleanStr(body?.note),
  })
  return ok({ item: serialize(row) })
}

export const updateHealthAction = async (request, env, id) => {
  if (!(await isAuthenticated(request, env))) return fail('unauthorized', 401)
  const existing = await findHealthEntryById(env.DB, id)
  if (!existing) return fail('not_found', 404)
  const body = await readJsonBody(request)
  const patch = {}
  if (body?.date !== undefined) {
    const d = cleanDate(body.date)
    if (!d) return fail('date_invalid', 400)
    if (d !== existing.date) {
      const other = await findHealthEntryByDate(env.DB, d)
      if (other) return fail('date_exists', 400)
    }
    patch.date = d
  }
  if (body?.weight_g  !== undefined) patch.weight_g  = cleanIntOrNull(body.weight_g)
  if (body?.sleep_min !== undefined) patch.sleep_min = cleanIntOrNull(body.sleep_min)
  if (body?.mood      !== undefined) patch.mood      = cleanStr(body.mood)
  if (body?.exercise  !== undefined) patch.exercise  = cleanStr(body.exercise)
  if (body?.note      !== undefined) patch.note      = cleanStr(body.note)
  const row = await updateHealthEntry(env.DB, id, patch)
  return ok({ item: serialize(row) })
}

export const deleteHealthAction = async (request, env, id) => {
  if (!(await isAuthenticated(request, env))) return fail('unauthorized', 401)
  const existing = await findHealthEntryById(env.DB, id)
  if (!existing) return fail('not_found', 404)
  await deleteHealthEntry(env.DB, id)
  return ok({})
}
