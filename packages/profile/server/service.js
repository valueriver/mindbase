import { ok, fail } from '../../system/utils/json.js'
import { readJsonBody } from '../../system/utils/body.js'
import { isAuthenticated } from '../../system/auth/index.js'
import {
  listBlocks,
  getBlock,
  insertBlock,
  updateBlock,
  deleteBlock,
  reorderBlocks,
} from './repository.js'

const serialize = (row) => row && ({
  id:         row.id,
  title:      row.title || '',
  content:    row.content || '',
  sort_order: row.sort_order ?? 0,
  created_at: row.created_at,
  updated_at: row.updated_at,
})

export const listBlocksAction = async (request, env) => {
  if (!(await isAuthenticated(request, env))) return fail('unauthorized', 401)
  const rows = await listBlocks(env.DB)
  return ok({ blocks: rows.map(serialize) })
}

export const createBlockAction = async (request, env) => {
  if (!(await isAuthenticated(request, env))) return fail('unauthorized', 401)
  const body = await readJsonBody(request)
  const title   = typeof body?.title === 'string'   ? body.title   : ''
  const content = typeof body?.content === 'string' ? body.content : ''
  const existing = await listBlocks(env.DB)
  const maxOrder = existing.reduce((m, b) => Math.max(m, Number(b.sort_order) || 0), -1)
  const id = crypto.randomUUID()
  const row = await insertBlock(env.DB, { id, title, content, sort_order: maxOrder + 1 })
  return ok({ block: serialize(row) })
}

export const updateBlockAction = async (request, env, id) => {
  if (!(await isAuthenticated(request, env))) return fail('unauthorized', 401)
  const existing = await getBlock(env.DB, id)
  if (!existing) return fail('not_found', 404)
  const body = await readJsonBody(request)
  const patch = {}
  if (typeof body?.title === 'string')      patch.title = body.title
  if (typeof body?.content === 'string')    patch.content = body.content
  if (typeof body?.sort_order === 'number') patch.sort_order = body.sort_order
  const row = await updateBlock(env.DB, id, patch)
  return ok({ block: serialize(row) })
}

export const deleteBlockAction = async (request, env, id) => {
  if (!(await isAuthenticated(request, env))) return fail('unauthorized', 401)
  const existing = await getBlock(env.DB, id)
  if (!existing) return fail('not_found', 404)
  await deleteBlock(env.DB, id)
  return ok({})
}

export const reorderBlocksAction = async (request, env) => {
  if (!(await isAuthenticated(request, env))) return fail('unauthorized', 401)
  const body = await readJsonBody(request)
  const ids = Array.isArray(body?.ids) ? body.ids.filter((x) => typeof x === 'string') : null
  if (!ids) return fail('ids_required', 400)
  await reorderBlocks(env.DB, ids)
  const rows = await listBlocks(env.DB)
  return ok({ blocks: rows.map(serialize) })
}
