import { ok, fail } from "../../system/utils/json.js"
import { readJsonBody } from "../../system/utils/body.js"
import { createPostId } from "../../system/utils/id.js"
import { isAuthenticated } from "../../system/auth/index.js"
import { deleteR2Keys, diffRemovedKeys, extractR2Keys } from "../../system/image/refs.js"
import {
  listPosts,
  findPostById,
  insertPost,
  updatePost,
  deletePost,
  listEvents,
} from './repository.js'

const MAX_LEN = 20_000
const AUTHOR_RE = /^[a-z0-9][a-z0-9-]{0,31}$/

// 启动器布局默认值。首次访问 / 用户没存过 layout 时返回这套。
// 和 gui/lib/apps.js 里的 DEFAULT_LAYOUT 必须保持一致。
const DEFAULT_LAYOUT = {
  groups: [
    { name: '日常', apps: ['home', 'todos', 'ledger', 'calendar', 'health', 'profile'] },
    { name: '兴趣', apps: ['books', 'movies', 'music', 'games', 'exhibitions', 'concerts', 'bookmarks'] },
    { name: '生活', apps: ['footprints', 'photos', 'travel', 'memories', 'contacts', 'recipes'] },
    { name: '创作', apps: ['notes', 'articles', 'prompts', 'webs', 'projects', 'goals', 'wishlist'] },
    { name: '身份', apps: ['resume', 'cards', 'vault', 'docs', 'emails', 'accounts'] },
    { name: '技术', apps: ['servers', 'llms', 'apikeys', 'domains', 'devices', 'apps'] },
    { name: '其它', apps: ['assets', 'subs', 'medical', 'manuals', 'outline', 'mindmap'] },
  ],
  hidden: [],
}

// 把任意 author 字段规范化:小写、trim、限定 [a-z0-9-]、最长 32 位。无效就返 null(用默认 'user')。
const normAuthor = (v) => {
  if (v == null) return null
  const s = String(v).trim().toLowerCase()
  if (!s) return null
  return AUTHOR_RE.test(s) ? s : null
}

const serialize = (row) => row && ({
  id:         row.id,
  author:     row.author || 'user',
  content:    row.content,
  created_at: row.created_at,
  updated_at: row.updated_at,
})

export const listPostsAction = async (request, env, url) => {
  if (!(await isAuthenticated(request, env))) return fail('unauthorized', 401)
  const limit  = Math.min(Number(url.searchParams.get('limit'))  || 200, 500)
  const offset = Math.max(Number(url.searchParams.get('offset')) || 0, 0)
  const result = await listPosts(env.DB, { limit, offset })
  return ok({ items: (result?.results || []).map(serialize) })
}

export const createPostAction = async (request, env) => {
  if (!(await isAuthenticated(request, env))) return fail('unauthorized', 401)
  const body = await readJsonBody(request)
  const content = String(body?.content || '').trim()
  if (!content) return fail('content_required', 400)
  if (content.length > MAX_LEN) return fail('content_too_long', 400)
  const author = normAuthor(body?.author) || 'user'
  const row = await insertPost(env.DB, { id: createPostId(), content, author })
  return ok({ post: serialize(row) })
}

export const updatePostAction = async (request, env, id) => {
  if (!(await isAuthenticated(request, env))) return fail('unauthorized', 401)
  const body = await readJsonBody(request)
  const existing = await findPostById(env.DB, id)
  if (!existing) return fail('not_found', 404)
  if (body?.content === undefined) return fail('content_required', 400)

  const content = String(body.content).trim()
  if (!content) return fail('content_required', 400)
  if (content.length > MAX_LEN) return fail('content_too_long', 400)

  const removedKeys = diffRemovedKeys(existing.content, content)
  const author = body?.author === undefined ? undefined : (normAuthor(body.author) || 'user')
  const row = await updatePost(env.DB, id, { content, author })
  if (removedKeys.length > 0) await deleteR2Keys(env, removedKeys)
  return ok({ post: serialize(row) })
}

export const deletePostAction = async (request, env, id) => {
  if (!(await isAuthenticated(request, env))) return fail('unauthorized', 401)
  const existing = await findPostById(env.DB, id)
  if (!existing) return fail('not_found', 404)
  const keys = extractR2Keys(existing.content)
  await deletePost(env.DB, id)
  if (keys.length > 0) await deleteR2Keys(env, keys)
  return ok({})
}

export const getLayoutAction = async (request, env) => {
  if (!(await isAuthenticated(request, env))) return fail('unauthorized', 401)
  const row = await env.DB.prepare(`SELECT value FROM settings WHERE key = 'app_layout'`).first()
  let layout = null
  if (row?.value) {
    try { layout = JSON.parse(row.value) } catch {}
  }
  return ok({ layout: layout || DEFAULT_LAYOUT })
}

export const updateLayoutAction = async (request, env) => {
  if (!(await isAuthenticated(request, env))) return fail('unauthorized', 401)
  const body = await readJsonBody(request)
  if (!body?.groups || !Array.isArray(body.groups)) return fail('layout_invalid', 400)
  for (const g of body.groups) {
    if (typeof g?.name !== 'string' || !Array.isArray(g?.apps)) return fail('layout_invalid', 400)
  }
  const hidden = Array.isArray(body.hidden) ? body.hidden : []
  const payload = JSON.stringify({ groups: body.groups, hidden })
  await env.DB.prepare(
    `INSERT INTO settings (key, value, updated_at) VALUES ('app_layout', ?1, datetime('now'))
     ON CONFLICT(key) DO UPDATE SET value = ?1, updated_at = datetime('now')`
  ).bind(payload).run()
  return ok({ layout: JSON.parse(payload) })
}

export const listEventsAction = async (request, env, url) => {
  if (!(await isAuthenticated(request, env))) return fail('unauthorized', 401)
  const limit  = Math.min(Number(url.searchParams.get('limit'))  || 200, 500)
  const before = url.searchParams.get('before') || null
  const result = await listEvents(env.DB, { limit, before })
  return ok({ items: (result?.results || []) })
}
