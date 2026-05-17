import { ok, fail } from '../../system/utils/json.js'
import { readJsonBody } from '../../system/utils/body.js'
import { isAuthenticated } from '../../system/auth/index.js'
import {
  listGames,
  findGameById,
  insertGame,
  updateGame,
  deleteGame,
} from './repository.js'

const STATUSES = new Set(['want', 'playing', 'finished', 'dropped'])

const serialize = (row) => row && ({
  id:           row.id,
  title:        row.title,
  platform:     row.platform || '',
  status:       row.status || 'want',
  hours_played: Number(row.hours_played || 0),
  rating:       Number(row.rating || 0),
  note:         row.note || '',
  cover:        row.cover || null,
  created_at:   row.created_at,
  updated_at:   row.updated_at,
})

const cleanStr = (v) => (v === undefined || v === null) ? '' : String(v).trim()
const cleanOpt = (v) => {
  if (v === undefined) return undefined
  if (v === null) return null
  const s = String(v).trim()
  return s ? s : null
}
const cleanInt = (v) => {
  const n = Number(v)
  return Number.isFinite(n) ? Math.max(0, Math.trunc(n)) : 0
}
const clampRating = (v) => {
  const n = Number(v)
  if (!Number.isFinite(n)) return 0
  return Math.max(0, Math.min(5, Math.round(n)))
}
const cleanStatus = (v) => {
  const s = cleanStr(v)
  return s && STATUSES.has(s) ? s : null
}

export const listGamesAction = async (request, env, url) => {
  if (!(await isAuthenticated(request, env))) return fail('unauthorized', 401)
  const limit  = Math.min(Number(url.searchParams.get('limit'))  || 200, 500)
  const offset = Math.max(Number(url.searchParams.get('offset')) || 0, 0)
  const status = cleanStatus(url.searchParams.get('status'))
  const result = await listGames(env.DB, { status, limit, offset })
  return ok({ items: (result?.results || []).map(serialize) })
}

export const createGameAction = async (request, env) => {
  if (!(await isAuthenticated(request, env))) return fail('unauthorized', 401)
  const body = await readJsonBody(request)
  const title = cleanStr(body?.title)
  if (!title) return fail('title_required', 400)
  const row = await insertGame(env.DB, {
    id:           crypto.randomUUID(),
    title,
    platform:     cleanStr(body?.platform),
    status:       cleanStatus(body?.status) || 'want',
    hours_played: cleanInt(body?.hours_played),
    rating:       clampRating(body?.rating),
    note:         cleanStr(body?.note),
    cover:        cleanOpt(body?.cover) ?? null,
  })
  return ok({ item: serialize(row) })
}

export const updateGameAction = async (request, env, id) => {
  if (!(await isAuthenticated(request, env))) return fail('unauthorized', 401)
  const existing = await findGameById(env.DB, id)
  if (!existing) return fail('not_found', 404)
  const body = await readJsonBody(request)
  const patch = {}
  if (body?.title    !== undefined) {
    const t = cleanStr(body.title)
    if (!t) return fail('title_required', 400)
    patch.title = t
  }
  if (body?.platform     !== undefined) patch.platform     = cleanStr(body.platform)
  if (body?.status       !== undefined) {
    const s = cleanStatus(body.status)
    if (!s) return fail('status_invalid', 400)
    patch.status = s
  }
  if (body?.hours_played !== undefined) patch.hours_played = cleanInt(body.hours_played)
  if (body?.rating       !== undefined) patch.rating       = clampRating(body.rating)
  if (body?.note         !== undefined) patch.note         = cleanStr(body.note)
  if (body?.cover        !== undefined) patch.cover        = cleanOpt(body.cover)
  const row = await updateGame(env.DB, id, patch)
  return ok({ item: serialize(row) })
}

export const deleteGameAction = async (request, env, id) => {
  if (!(await isAuthenticated(request, env))) return fail('unauthorized', 401)
  const existing = await findGameById(env.DB, id)
  if (!existing) return fail('not_found', 404)
  await deleteGame(env.DB, id)
  return ok({})
}
