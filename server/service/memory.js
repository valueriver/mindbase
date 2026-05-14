import { ok, fail } from '../api/utils/json.js'
import { readJsonBody } from '../api/utils/body.js'
import { isAuthenticated } from '../domain/auth/index.js'
import {
  listMemories, getMemory, insertMemory, updateMemory, deleteMemory,
} from '../repository/memory.js'

const serialize = (row) => row && ({
  id:          row.id,
  title:       row.title || '',
  description: row.description || '',
  content:     row.content || '',
  visibility:  row.visibility || 'full',
  created_at:  row.created_at || null,
})

export const listMemoriesAction = async (request, env) => {
  if (!(await isAuthenticated(request, env))) return fail('unauthorized', 401)
  const rows = await listMemories(env.DB)
  return ok({ items: rows.map(serialize) })
}

export const getMemoryAction = async (request, env, id) => {
  if (!(await isAuthenticated(request, env))) return fail('unauthorized', 401)
  const row = await getMemory(env.DB, id)
  if (!row) return fail('not_found', 404)
  return ok({ item: serialize(row) })
}

export const createMemoryAction = async (request, env) => {
  if (!(await isAuthenticated(request, env))) return fail('unauthorized', 401)
  const body = await readJsonBody(request)
  const title   = String(body?.title || '').trim()
  const content = String(body?.content || '').trim()
  if (!title)   return fail('title_required', 400)
  if (!content) return fail('content_required', 400)
  const row = await insertMemory(env.DB, {
    title,
    description: body?.description || '',
    content,
    visibility:  body?.visibility || 'full',
  })
  return ok({ item: serialize(row) })
}

export const updateMemoryAction = async (request, env, id) => {
  if (!(await isAuthenticated(request, env))) return fail('unauthorized', 401)
  const body = await readJsonBody(request)
  const row = await updateMemory(env.DB, id, {
    title:       body?.title,
    description: body?.description,
    content:     body?.content,
    visibility:  body?.visibility,
  })
  if (!row) return fail('not_found', 404)
  return ok({ item: serialize(row) })
}

export const deleteMemoryAction = async (request, env, id) => {
  if (!(await isAuthenticated(request, env))) return fail('unauthorized', 401)
  await deleteMemory(env.DB, id)
  return ok({})
}
