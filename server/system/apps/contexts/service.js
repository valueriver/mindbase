import { ok, fail }       from '../../utils/json.js'
import { readJsonBody }    from '../../utils/body.js'
import { isAuthenticated } from '../../auth/index.js'
import { createPostId as randomId } from '../../utils/id.js'
import {
  listContexts, findContextById,
  insertContext, upsertContext, updateContext,
  deleteContext, deleteContextBySource,
} from './repository.js'

const serialize = (row) => row && ({
  id:         row.id,
  content:    row.content    || '',
  source_app: row.source_app || '',
  source_id:  row.source_id  || null,
  sort_order: row.sort_order ?? 0,
  created_at: row.created_at,
  updated_at: row.updated_at,
})

const str = (v) => (v == null ? '' : String(v).trim())

export const listContextsAction = async (request, env) => {
  if (!(await isAuthenticated(request, env))) return fail('unauthorized', 401)
  const r = await listContexts(env.DB)
  return ok({ contexts: (r?.results || []).map(serialize) })
}

export const createContextAction = async (request, env) => {
  if (!(await isAuthenticated(request, env))) return fail('unauthorized', 401)
  const body    = await readJsonBody(request)
  const content = str(body?.content)
  if (!content) return fail('content_required', 400)
  const all      = await listContexts(env.DB)
  const maxOrder = (all?.results || []).reduce((m, r) => Math.max(m, r.sort_order ?? 0), 0)
  const row = await insertContext(env.DB, {
    id:        randomId(),
    content,
    sourceApp: '',
    sourceId:  null,
    sortOrder: maxOrder + 10,
  })
  return ok({ context: serialize(row) })
}

export const updateContextAction = async (request, env, id) => {
  if (!(await isAuthenticated(request, env))) return fail('unauthorized', 401)
  if (!(await findContextById(env.DB, id))) return fail('not_found', 404)
  const body  = await readJsonBody(request)
  const patch = {}
  if (body?.content    !== undefined) patch.content   = str(body.content)
  if (body?.sort_order !== undefined) patch.sortOrder = Number(body.sort_order) || 0
  const row = await updateContext(env.DB, id, patch)
  return ok({ context: serialize(row) })
}

export const deleteContextAction = async (request, env, id) => {
  if (!(await isAuthenticated(request, env))) return fail('unauthorized', 401)
  if (!(await findContextById(env.DB, id))) return fail('not_found', 404)
  await deleteContext(env.DB, id)
  return ok({})
}

// 供各应用调用:pin 一条内容进来(upsert)
export const pinContextAction = async (request, env) => {
  if (!(await isAuthenticated(request, env))) return fail('unauthorized', 401)
  const body      = await readJsonBody(request)
  const content   = str(body?.content)
  const sourceApp = str(body?.source_app)
  const sourceId  = str(body?.source_id) || null
  if (!content)   return fail('content_required', 400)
  if (!sourceApp) return fail('source_app_required', 400)
  if (!sourceId)  return fail('source_id_required', 400)
  const all      = await listContexts(env.DB)
  const maxOrder = (all?.results || []).reduce((m, r) => Math.max(m, r.sort_order ?? 0), 0)
  const row = await upsertContext(env.DB, {
    id: randomId(), content, sourceApp, sourceId, sortOrder: maxOrder + 10,
  })
  return ok({ context: serialize(row) })
}

// 供各应用调用:取消 pin
export const unpinContextAction = async (request, env) => {
  if (!(await isAuthenticated(request, env))) return fail('unauthorized', 401)
  const body      = await readJsonBody(request)
  const sourceApp = str(body?.source_app)
  const sourceId  = str(body?.source_id) || null
  if (!sourceApp || !sourceId) return fail('source_app_and_source_id_required', 400)
  await deleteContextBySource(env.DB, sourceApp, sourceId)
  return ok({})
}
