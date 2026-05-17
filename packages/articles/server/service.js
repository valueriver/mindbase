import { ok, fail } from '../../system/utils/json.js'
import { readJsonBody } from '../../system/utils/body.js'
import { isAuthenticated } from '../../system/auth/index.js'
import { listArticles, findArticleById, insertArticle, updateArticle, deleteArticle } from './repository.js'

const normDate = (v) => {
  if (v === null || v === '') return null
  if (typeof v !== 'string') return undefined
  return /^\d{4}-\d{2}-\d{2}$/.test(v) ? v : undefined
}

const normNullableString = (v) => {
  if (v === null || v === '') return null
  if (typeof v !== 'string') return undefined
  return v.trim() || null
}

const serialize = (row) => row && ({
  id:           row.id,
  title:        row.title,
  url:          row.url || '',
  source:       row.source || '',
  summary:      row.summary || '',
  published_at: row.published_at,
  cover:        row.cover,
  created_at:   row.created_at,
  updated_at:   row.updated_at,
})

export const listArticlesAction = async (request, env, url) => {
  if (!(await isAuthenticated(request, env))) return fail('unauthorized', 401)
  const source = url.searchParams.get('source')
  const r = await listArticles(env.DB, { source: source || null })
  return ok({ items: (r?.results || []).map(serialize) })
}

export const createArticleAction = async (request, env) => {
  if (!(await isAuthenticated(request, env))) return fail('unauthorized', 401)
  const body = await readJsonBody(request)
  const title = String(body?.title || '').trim()
  if (!title) return fail('title_required', 400)
  const published_at = normDate(body?.published_at)
  if (published_at === undefined) return fail('published_at_invalid', 400)
  const cover = normNullableString(body?.cover)
  if (cover === undefined) return fail('cover_invalid', 400)
  const row = await insertArticle(env.DB, {
    id:      crypto.randomUUID(),
    title,
    url:     String(body?.url || '').trim(),
    source:  String(body?.source || '').trim(),
    summary: String(body?.summary || ''),
    published_at,
    cover,
  })
  return ok({ item: serialize(row) })
}

export const updateArticleAction = async (request, env, id) => {
  if (!(await isAuthenticated(request, env))) return fail('unauthorized', 401)
  const body = await readJsonBody(request)
  const existing = await findArticleById(env.DB, id)
  if (!existing) return fail('not_found', 404)

  const patch = {}
  if (body?.title !== undefined) {
    const t = String(body.title).trim()
    if (!t) return fail('title_required', 400)
    patch.title = t
  }
  if (body?.url     !== undefined) patch.url     = String(body.url).trim()
  if (body?.source  !== undefined) patch.source  = String(body.source).trim()
  if (body?.summary !== undefined) patch.summary = String(body.summary)
  if (body?.published_at !== undefined) {
    const d = normDate(body.published_at)
    if (d === undefined) return fail('published_at_invalid', 400)
    patch.published_at = d
  }
  if (body?.cover !== undefined) {
    const c = normNullableString(body.cover)
    if (c === undefined) return fail('cover_invalid', 400)
    patch.cover = c
  }

  const row = await updateArticle(env.DB, id, patch)
  return ok({ item: serialize(row) })
}

export const deleteArticleAction = async (request, env, id) => {
  if (!(await isAuthenticated(request, env))) return fail('unauthorized', 401)
  const existing = await findArticleById(env.DB, id)
  if (!existing) return fail('not_found', 404)
  await deleteArticle(env.DB, id)
  return ok({})
}
