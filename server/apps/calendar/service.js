import { ok, fail } from '../../lib/utils/json.js'
import { readJsonBody } from '../../lib/utils/body.js'
import { isAuthenticated } from '../../lib/auth/index.js'
import {
  listEvents,
  findEventById,
  insertEvent,
  updateEvent,
  deleteEvent,
} from './repository.js'

const DATE_RE  = /^\d{4}-\d{2}-\d{2}$/
const TIME_RE  = /^\d{2}:\d{2}$/
const MONTH_RE = /^\d{4}-\d{2}$/
const MAX_TITLE = 200
const MAX_NOTE  = 2_000

const serialize = (row) => row && ({
  id:         row.id,
  title:      row.title,
  date:       row.date,
  time:       row.time || null,
  note:       row.note || '',
  created_at: row.created_at,
  updated_at: row.updated_at,
})

const cleanTime = (v) => {
  if (v === null || v === undefined || v === '') return null
  const s = String(v).trim()
  if (!TIME_RE.test(s)) return undefined  // invalid
  return s
}

export const listEventsAction = async (request, env, url) => {
  if (!(await isAuthenticated(request, env))) return fail('unauthorized', 401)
  const monthRaw = url.searchParams.get('month')
  const month = monthRaw && MONTH_RE.test(monthRaw) ? monthRaw : undefined
  const result = await listEvents(env.DB, { month })
  return ok({ events: (result?.results || []).map(serialize) })
}

export const createEventAction = async (request, env) => {
  if (!(await isAuthenticated(request, env))) return fail('unauthorized', 401)
  const body  = await readJsonBody(request)
  const title = String(body?.title || '').trim().slice(0, MAX_TITLE)
  const date  = String(body?.date || '').trim()
  const note  = String(body?.note || '').trim().slice(0, MAX_NOTE)
  if (!title) return fail('title_required', 400)
  if (!DATE_RE.test(date)) return fail('date_invalid', 400)
  const time = cleanTime(body?.time)
  if (time === undefined) return fail('time_invalid', 400)
  const row = await insertEvent(env.DB, { id: crypto.randomUUID(), title, date, time, note })
  return ok({ event: serialize(row) })
}

export const updateEventAction = async (request, env, id) => {
  if (!(await isAuthenticated(request, env))) return fail('unauthorized', 401)
  const body = await readJsonBody(request)
  const existing = await findEventById(env.DB, id)
  if (!existing) return fail('not_found', 404)
  const patch = {}
  if (body?.title !== undefined) {
    const t = String(body.title).trim().slice(0, MAX_TITLE)
    if (!t) return fail('title_required', 400)
    patch.title = t
  }
  if (body?.date !== undefined) {
    const d = String(body.date).trim()
    if (!DATE_RE.test(d)) return fail('date_invalid', 400)
    patch.date = d
  }
  if (body?.time !== undefined) {
    const t = cleanTime(body.time)
    if (t === undefined) return fail('time_invalid', 400)
    patch.time = t
  }
  if (body?.note !== undefined) {
    patch.note = String(body.note).trim().slice(0, MAX_NOTE)
  }
  const row = await updateEvent(env.DB, id, patch)
  return ok({ event: serialize(row) })
}

export const deleteEventAction = async (request, env, id) => {
  if (!(await isAuthenticated(request, env))) return fail('unauthorized', 401)
  const existing = await findEventById(env.DB, id)
  if (!existing) return fail('not_found', 404)
  await deleteEvent(env.DB, id)
  return ok({})
}
