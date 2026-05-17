import { ok, fail } from '../../system/utils/json.js'
import { readJsonBody } from '../../system/utils/body.js'
import { isAuthenticated } from '../../system/auth/index.js'
import {
  listPhotos,
  findPhotoById,
  insertPhoto,
  updatePhoto,
  deletePhoto,
} from './repository.js'

const serialize = (row) => row && ({
  id:         row.id,
  image_url:  row.image_url,
  caption:    row.caption || '',
  taken_at:   row.taken_at ?? null,
  location:   row.location || '',
  created_at: row.created_at,
  updated_at: row.updated_at,
})

const cleanStr = (v) => (v === undefined || v === null) ? '' : String(v).trim()
const cleanUrl = (v) => {
  if (v === undefined) return undefined
  if (v === null) return null
  const s = String(v).trim()
  return s ? s : null
}
const cleanDate = (v) => {
  if (v === undefined) return undefined
  if (v === null) return null
  const s = String(v).trim()
  return /^\d{4}-\d{2}-\d{2}$/.test(s) ? s : null
}

export const listPhotosAction = async (request, env, url) => {
  if (!(await isAuthenticated(request, env))) return fail('unauthorized', 401)
  const limit  = Math.min(Number(url.searchParams.get('limit'))  || 200, 500)
  const offset = Math.max(Number(url.searchParams.get('offset')) || 0, 0)
  const result = await listPhotos(env.DB, { limit, offset })
  return ok({ items: (result?.results || []).map(serialize) })
}

export const createPhotoAction = async (request, env) => {
  if (!(await isAuthenticated(request, env))) return fail('unauthorized', 401)
  const body = await readJsonBody(request)
  const image_url = cleanUrl(body?.image_url)
  if (!image_url) return fail('image_required', 400)
  const row = await insertPhoto(env.DB, {
    id:        crypto.randomUUID(),
    image_url,
    caption:   cleanStr(body?.caption),
    taken_at:  cleanDate(body?.taken_at) ?? null,
    location:  cleanStr(body?.location),
  })
  return ok({ item: serialize(row) })
}

export const updatePhotoAction = async (request, env, id) => {
  if (!(await isAuthenticated(request, env))) return fail('unauthorized', 401)
  const existing = await findPhotoById(env.DB, id)
  if (!existing) return fail('not_found', 404)
  const body = await readJsonBody(request)
  const patch = {}
  if (body?.image_url !== undefined) {
    const u = cleanUrl(body.image_url)
    if (!u) return fail('image_required', 400)
    patch.image_url = u
  }
  if (body?.caption  !== undefined) patch.caption  = cleanStr(body.caption)
  if (body?.taken_at !== undefined) patch.taken_at = cleanDate(body.taken_at)
  if (body?.location !== undefined) patch.location = cleanStr(body.location)
  const row = await updatePhoto(env.DB, id, patch)
  return ok({ item: serialize(row) })
}

export const deletePhotoAction = async (request, env, id) => {
  if (!(await isAuthenticated(request, env))) return fail('unauthorized', 401)
  const existing = await findPhotoById(env.DB, id)
  if (!existing) return fail('not_found', 404)
  await deletePhoto(env.DB, id)
  return ok({})
}
