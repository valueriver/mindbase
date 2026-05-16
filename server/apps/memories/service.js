import { ok, fail } from '../../lib/utils/json.js'
import { readJsonBody } from '../../lib/utils/body.js'
import { isAuthenticated } from '../../lib/auth/index.js'
import { listMemories, findMemoryById, insertMemory, updateMemory, deleteMemory } from './repository.js'

const isDate = (s) => typeof s === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(s)

const serialize = (row) => row && ({
  id:         row.id,
  date:       row.date,
  location:   row.location || '',
  weather:    row.weather || '',
  mood:       row.mood || '',
  note:       row.note || '',
  created_at: row.created_at,
  updated_at: row.updated_at,
})

export const listMemoriesAction = async (request, env) => {
  if (!(await isAuthenticated(request, env))) return fail('unauthorized', 401)
  const r = await listMemories(env.DB)
  return ok({ items: (r?.results || []).map(serialize) })
}

export const createMemoryAction = async (request, env) => {
  if (!(await isAuthenticated(request, env))) return fail('unauthorized', 401)
  const body = await readJsonBody(request)
  const date = String(body?.date || '').trim()
  if (!isDate(date)) return fail('date_invalid', 400)
  const row = await insertMemory(env.DB, {
    id:       crypto.randomUUID(),
    date,
    location: String(body?.location || '').trim(),
    weather:  String(body?.weather  || '').trim(),
    mood:     String(body?.mood     || '').trim(),
    note:     String(body?.note     || ''),
  })
  return ok({ item: serialize(row) })
}

export const updateMemoryAction = async (request, env, id) => {
  if (!(await isAuthenticated(request, env))) return fail('unauthorized', 401)
  const body = await readJsonBody(request)
  const existing = await findMemoryById(env.DB, id)
  if (!existing) return fail('not_found', 404)

  const patch = {}
  if (body?.date !== undefined) {
    const d = String(body.date).trim()
    if (!isDate(d)) return fail('date_invalid', 400)
    patch.date = d
  }
  if (body?.location !== undefined) patch.location = String(body.location).trim()
  if (body?.weather  !== undefined) patch.weather  = String(body.weather).trim()
  if (body?.mood     !== undefined) patch.mood     = String(body.mood).trim()
  if (body?.note     !== undefined) patch.note     = String(body.note)

  const row = await updateMemory(env.DB, id, patch)
  return ok({ item: serialize(row) })
}

export const deleteMemoryAction = async (request, env, id) => {
  if (!(await isAuthenticated(request, env))) return fail('unauthorized', 401)
  const existing = await findMemoryById(env.DB, id)
  if (!existing) return fail('not_found', 404)
  await deleteMemory(env.DB, id)
  return ok({})
}
