import { ok, fail } from '../../lib/utils/json.js'
import { readJsonBody } from '../../lib/utils/body.js'
import { isAuthenticated } from '../../lib/auth/index.js'
import {
  listTracks,
  findTrackById,
  insertTrack,
  updateTrack,
  deleteTrack,
} from './repository.js'

const serialize = (row) => row && ({
  id:         row.id,
  title:      row.title,
  artist:     row.artist || '',
  url:        row.url || null,
  cover:      row.cover || null,
  note:       row.note || '',
  rating:     Number(row.rating || 0),
  created_at: row.created_at,
  updated_at: row.updated_at,
})

const cleanStr = (v) => (v === undefined || v === null) ? null : String(v).trim()
const clampRating = (v) => {
  const n = Number(v)
  if (!Number.isFinite(n)) return null
  return Math.max(0, Math.min(5, Math.round(n)))
}

export const listTracksAction = async (request, env, url) => {
  if (!(await isAuthenticated(request, env))) return fail('unauthorized', 401)
  const limit  = Math.min(Number(url.searchParams.get('limit'))  || 200, 500)
  const offset = Math.max(Number(url.searchParams.get('offset')) || 0, 0)
  const result = await listTracks(env.DB, { limit, offset })
  return ok({ items: (result?.results || []).map(serialize) })
}

export const createTrackAction = async (request, env) => {
  if (!(await isAuthenticated(request, env))) return fail('unauthorized', 401)
  const body = await readJsonBody(request)
  const title = cleanStr(body?.title)
  if (!title) return fail('title_required', 400)
  const row = await insertTrack(env.DB, {
    id:     crypto.randomUUID(),
    title,
    artist: cleanStr(body?.artist) || '',
    url:    cleanStr(body?.url),
    cover:  cleanStr(body?.cover),
    note:   cleanStr(body?.note) || '',
    rating: clampRating(body?.rating) ?? 0,
  })
  return ok({ item: serialize(row) })
}

export const updateTrackAction = async (request, env, id) => {
  if (!(await isAuthenticated(request, env))) return fail('unauthorized', 401)
  const existing = await findTrackById(env.DB, id)
  if (!existing) return fail('not_found', 404)
  const body = await readJsonBody(request)
  const row = await updateTrack(env.DB, id, {
    title:  body?.title  !== undefined ? cleanStr(body.title) : undefined,
    artist: body?.artist !== undefined ? (cleanStr(body.artist) ?? '') : undefined,
    url:    body?.url    !== undefined ? cleanStr(body.url) : undefined,
    cover:  body?.cover  !== undefined ? cleanStr(body.cover) : undefined,
    note:   body?.note   !== undefined ? (cleanStr(body.note) ?? '') : undefined,
    rating: body?.rating !== undefined ? clampRating(body.rating) : undefined,
  })
  return ok({ item: serialize(row) })
}

export const deleteTrackAction = async (request, env, id) => {
  if (!(await isAuthenticated(request, env))) return fail('unauthorized', 401)
  const existing = await findTrackById(env.DB, id)
  if (!existing) return fail('not_found', 404)
  await deleteTrack(env.DB, id)
  return ok({})
}
