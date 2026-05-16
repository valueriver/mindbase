import { ok, fail } from '../../lib/utils/json.js'
import { readJsonBody } from '../../lib/utils/body.js'
import { isAuthenticated } from '../../lib/auth/index.js'
import { listTrips, findTripById, insertTrip, updateTrip, deleteTrip } from './repository.js'

const STATUSES = new Set(['planning', 'booked', 'done'])

const normDate = (v) => {
  if (v === null || v === '') return null
  if (typeof v !== 'string') return undefined
  return /^\d{4}-\d{2}-\d{2}$/.test(v) ? v : undefined
}

const serialize = (row) => row && ({
  id:          row.id,
  destination: row.destination,
  start_date:  row.start_date,
  end_date:    row.end_date,
  status:      row.status,
  note:        row.note || '',
  cover:       row.cover,
  created_at:  row.created_at,
  updated_at:  row.updated_at,
})

export const listTripsAction = async (request, env, url) => {
  if (!(await isAuthenticated(request, env))) return fail('unauthorized', 401)
  const status = url.searchParams.get('status')
  const r = await listTrips(env.DB, { status: STATUSES.has(status) ? status : null })
  return ok({ items: (r?.results || []).map(serialize) })
}

export const createTripAction = async (request, env) => {
  if (!(await isAuthenticated(request, env))) return fail('unauthorized', 401)
  const body = await readJsonBody(request)
  const destination = String(body?.destination || '').trim()
  if (!destination) return fail('destination_required', 400)
  const startDate = normDate(body?.start_date)
  if (startDate === undefined) return fail('start_date_invalid', 400)
  const endDate = normDate(body?.end_date)
  if (endDate === undefined) return fail('end_date_invalid', 400)
  const status = STATUSES.has(body?.status) ? body.status : 'planning'
  const row = await insertTrip(env.DB, {
    id: crypto.randomUUID(),
    destination,
    startDate, endDate, status,
    note:  String(body?.note || '').trim(),
    cover: body?.cover ? String(body.cover) : null,
  })
  return ok({ item: serialize(row) })
}

export const updateTripAction = async (request, env, id) => {
  if (!(await isAuthenticated(request, env))) return fail('unauthorized', 401)
  const body = await readJsonBody(request)
  const existing = await findTripById(env.DB, id)
  if (!existing) return fail('not_found', 404)

  const patch = {}
  if (body?.destination !== undefined) {
    const d = String(body.destination).trim()
    if (!d) return fail('destination_required', 400)
    patch.destination = d
  }
  if (body?.start_date !== undefined) {
    const d = normDate(body.start_date)
    if (d === undefined) return fail('start_date_invalid', 400)
    patch.startDate = d
  }
  if (body?.end_date !== undefined) {
    const d = normDate(body.end_date)
    if (d === undefined) return fail('end_date_invalid', 400)
    patch.endDate = d
  }
  if (body?.status !== undefined) {
    if (!STATUSES.has(body.status)) return fail('status_invalid', 400)
    patch.status = body.status
  }
  if (body?.note !== undefined)  patch.note  = String(body.note).trim()
  if (body?.cover !== undefined) patch.cover = body.cover ? String(body.cover) : null

  const row = await updateTrip(env.DB, id, patch)
  return ok({ item: serialize(row) })
}

export const deleteTripAction = async (request, env, id) => {
  if (!(await isAuthenticated(request, env))) return fail('unauthorized', 401)
  const existing = await findTripById(env.DB, id)
  if (!existing) return fail('not_found', 404)
  await deleteTrip(env.DB, id)
  return ok({})
}
