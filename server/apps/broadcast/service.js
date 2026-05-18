import { ok, fail }          from '../../system/utils/json.js'
import { readJsonBody }       from '../../system/utils/body.js'
import { isAuthenticated }    from '../../system/auth/index.js'
import { createBroadcastId }  from '../../system/utils/id.js'
import {
  listPosts, findPostById, insertPost, updatePost, deletePost,
  listPlatforms, findPlatformById, insertPlatform, updatePlatform, deletePlatform,
  listStatusesByPost, upsertStatus,
} from './repository.js'

const STATUSES = new Set(['published', 'pending'])

const serializePost = (row) => row && ({
  id:         row.id,
  title:      row.title || '',
  note:       row.note  || '',
  created_at: row.created_at,
  updated_at: row.updated_at,
})

const serializePlatform = (row) => row && ({
  id:         row.id,
  name:       row.name       || '',
  url:        row.url        || '',
  sort_order: row.sort_order ?? 0,
  created_at: row.created_at,
  updated_at: row.updated_at,
})

const serializeStatus = (row) => row && ({
  id:          row.id,
  post_id:     row.post_id,
  platform_id: row.platform_id,
  status:      row.status  || 'pending',
  pub_url:     row.pub_url || '',
  created_at:  row.created_at,
  updated_at:  row.updated_at,
})

const str  = (v) => (v == null ? '' : String(v).trim())
const rand = () => createBroadcastId()

// ---------- posts ----------

export const listPostsAction = async (request, env) => {
  if (!(await isAuthenticated(request, env))) return fail('unauthorized', 401)
  const r = await listPosts(env.DB)
  return ok({ posts: (r?.results || []).map(serializePost) })
}

export const createPostAction = async (request, env) => {
  if (!(await isAuthenticated(request, env))) return fail('unauthorized', 401)
  const body  = await readJsonBody(request)
  const title = str(body?.title)
  if (!title) return fail('title_required', 400)
  const row = await insertPost(env.DB, { id: rand(), title, note: str(body?.note) })
  return ok({ post: serializePost(row) })
}

export const updatePostAction = async (request, env, id) => {
  if (!(await isAuthenticated(request, env))) return fail('unauthorized', 401)
  if (!(await findPostById(env.DB, id))) return fail('not_found', 404)
  const body  = await readJsonBody(request)
  const patch = {}
  if (body?.title !== undefined) {
    const t = str(body.title)
    if (!t) return fail('title_required', 400)
    patch.title = t
  }
  if (body?.note !== undefined) patch.note = str(body.note)
  const row = await updatePost(env.DB, id, patch)
  return ok({ post: serializePost(row) })
}

export const deletePostAction = async (request, env, id) => {
  if (!(await isAuthenticated(request, env))) return fail('unauthorized', 401)
  if (!(await findPostById(env.DB, id))) return fail('not_found', 404)
  await deletePost(env.DB, id)
  return ok({})
}

// ---------- platforms ----------

export const listPlatformsAction = async (request, env) => {
  if (!(await isAuthenticated(request, env))) return fail('unauthorized', 401)
  const r = await listPlatforms(env.DB)
  return ok({ platforms: (r?.results || []).map(serializePlatform) })
}

export const createPlatformAction = async (request, env) => {
  if (!(await isAuthenticated(request, env))) return fail('unauthorized', 401)
  const body = await readJsonBody(request)
  const name = str(body?.name)
  if (!name) return fail('name_required', 400)
  const all = await listPlatforms(env.DB)
  const sortOrder = (all?.results?.length ?? 0) * 10
  const row = await insertPlatform(env.DB, { id: rand(), name, url: str(body?.url), sortOrder })
  return ok({ platform: serializePlatform(row) })
}

export const updatePlatformAction = async (request, env, id) => {
  if (!(await isAuthenticated(request, env))) return fail('unauthorized', 401)
  if (!(await findPlatformById(env.DB, id))) return fail('not_found', 404)
  const body  = await readJsonBody(request)
  const patch = {}
  if (body?.name !== undefined) {
    const n = str(body.name)
    if (!n) return fail('name_required', 400)
    patch.name = n
  }
  if (body?.url       !== undefined) patch.url       = str(body.url)
  if (body?.sort_order !== undefined) patch.sortOrder = Number(body.sort_order) || 0
  const row = await updatePlatform(env.DB, id, patch)
  return ok({ platform: serializePlatform(row) })
}

export const deletePlatformAction = async (request, env, id) => {
  if (!(await isAuthenticated(request, env))) return fail('unauthorized', 401)
  if (!(await findPlatformById(env.DB, id))) return fail('not_found', 404)
  await deletePlatform(env.DB, id)
  return ok({})
}

// ---------- statuses ----------

export const listStatusesAction = async (request, env, postId) => {
  if (!(await isAuthenticated(request, env))) return fail('unauthorized', 401)
  if (!(await findPostById(env.DB, postId))) return fail('not_found', 404)
  const r = await listStatusesByPost(env.DB, postId)
  return ok({ statuses: (r?.results || []).map(serializeStatus) })
}

export const upsertStatusAction = async (request, env, postId, platformId) => {
  if (!(await isAuthenticated(request, env))) return fail('unauthorized', 401)
  if (!(await findPostById(env.DB, postId)))         return fail('not_found', 404)
  if (!(await findPlatformById(env.DB, platformId))) return fail('not_found', 404)
  const body   = await readJsonBody(request)
  const status = str(body?.status)
  if (!STATUSES.has(status)) return fail('status_invalid', 400)
  const row = await upsertStatus(env.DB, {
    id: rand(), postId, platformId, status, pubUrl: str(body?.pub_url),
  })
  return ok({ status: serializeStatus(row) })
}
