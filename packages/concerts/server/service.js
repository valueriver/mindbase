import { ok, fail } from '../../system/utils/json.js'
import { readJsonBody } from '../../system/utils/body.js'
import { isAuthenticated } from '../../system/auth/index.js'
import { listConcerts, findConcertById, insertConcert, updateConcert, deleteConcert } from './repository.js'

const serialize = (row) => row && ({
  id:           row.id,
  artist:       row.artist,
  tour:         row.tour || '',
  venue:        row.venue || '',
  city:         row.city || '',
  show_date:    row.show_date ?? null,
  ticket_price: row.ticket_price ?? 0,
  seat:         row.seat || '',
  rating:       row.rating ?? 0,
  note:         row.note || '',
  cover:        row.cover || null,
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
const cleanRating = (v) => {
  if (v === undefined) return undefined
  const n = Math.round(Number(v))
  if (!Number.isFinite(n)) return 0
  return Math.max(0, Math.min(5, n))
}
const cleanOpt = (v) => {
  if (v === undefined) return undefined
  if (v === null) return null
  const s = String(v).trim()
  return s ? s : null
}

export const listConcertsAction = async (request, env) => {
  if (!(await isAuthenticated(request, env))) return fail('unauthorized', 401)
  const r = await listConcerts(env.DB)
  return ok({ items: (r?.results || []).map(serialize) })
}

export const createConcertAction = async (request, env) => {
  if (!(await isAuthenticated(request, env))) return fail('unauthorized', 401)
  const body = await readJsonBody(request)
  const artist = cleanStr(body?.artist)
  if (!artist) return fail('artist_required', 400)
  const row = await insertConcert(env.DB, {
    id:           crypto.randomUUID(),
    artist,
    tour:         cleanStr(body?.tour),
    venue:        cleanStr(body?.venue),
    city:         cleanStr(body?.city),
    show_date:    cleanDate(body?.show_date) ?? null,
    ticket_price: cleanInt(body?.ticket_price) ?? 0,
    seat:         cleanStr(body?.seat),
    rating:       cleanRating(body?.rating) ?? 0,
    note:         cleanStr(body?.note),
    cover:        cleanOpt(body?.cover) ?? null,
  })
  return ok({ item: serialize(row) })
}

export const updateConcertAction = async (request, env, id) => {
  if (!(await isAuthenticated(request, env))) return fail('unauthorized', 401)
  const existing = await findConcertById(env.DB, id)
  if (!existing) return fail('not_found', 404)
  const body = await readJsonBody(request)
  const patch = {}
  if (body?.artist !== undefined) {
    const a = cleanStr(body.artist)
    if (!a) return fail('artist_required', 400)
    patch.artist = a
  }
  if (body?.tour         !== undefined) patch.tour         = cleanStr(body.tour)
  if (body?.venue        !== undefined) patch.venue        = cleanStr(body.venue)
  if (body?.city         !== undefined) patch.city         = cleanStr(body.city)
  if (body?.show_date    !== undefined) patch.show_date    = cleanDate(body.show_date)
  if (body?.ticket_price !== undefined) patch.ticket_price = cleanInt(body.ticket_price)
  if (body?.seat         !== undefined) patch.seat         = cleanStr(body.seat)
  if (body?.rating       !== undefined) patch.rating       = cleanRating(body.rating)
  if (body?.note         !== undefined) patch.note         = cleanStr(body.note)
  if (body?.cover        !== undefined) patch.cover        = cleanOpt(body.cover)
  const row = await updateConcert(env.DB, id, patch)
  return ok({ item: serialize(row) })
}

export const deleteConcertAction = async (request, env, id) => {
  if (!(await isAuthenticated(request, env))) return fail('unauthorized', 401)
  const existing = await findConcertById(env.DB, id)
  if (!existing) return fail('not_found', 404)
  await deleteConcert(env.DB, id)
  return ok({})
}
