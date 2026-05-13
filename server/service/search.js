import { ok, fail } from '../api/utils/json.js'
import { isAuthenticated } from '../domain/auth/index.js'

const MAX_LIMIT   = 50
const SNIPPET_LEN = 120

const stripHtml = (html) => String(html || '')
  .replace(/<[^>]*>/g, ' ')
  .replace(/\s+/g, ' ')
  .trim()

const makeSnippet = (text, q) => {
  if (!text) return ''
  const lower = text.toLowerCase()
  const i = lower.indexOf(q.toLowerCase())
  if (i < 0) return text.slice(0, SNIPPET_LEN)
  const start = Math.max(0, i - 30)
  const end   = Math.min(text.length, i + q.length + SNIPPET_LEN - 30)
  const prefix = start > 0 ? '…' : ''
  const suffix = end < text.length ? '…' : ''
  return `${prefix}${text.slice(start, end)}${suffix}`
}

export const searchAction = async (request, env, url) => {
  if (!(await isAuthenticated(request, env))) return fail('unauthorized', 401)

  const q = String(url.searchParams.get('q') || '').trim().slice(0, 120)
  if (!q) return ok({ query: '', notebooks: [], notes: [], memos: [] })

  const limit = Math.max(
    1,
    Math.min(MAX_LIMIT, Number.parseInt(url.searchParams.get('limit') || '20', 10) || 20),
  )
  const like = `%${q.replace(/[%_]/g, m => `\\${m}`)}%`

  const [nbResult, noteResult, memoResult] = await Promise.all([
    env.DB.prepare(
      `SELECT id, parent_id, name, icon, cover, updated_at
         FROM notebooks
        WHERE name LIKE ?1 ESCAPE '\\'
        ORDER BY updated_at DESC
        LIMIT ?2`
    ).bind(like, limit).all(),

    env.DB.prepare(
      `SELECT id, notebook_id, title, icon, content, updated_at
         FROM notes
        WHERE title LIKE ?1 ESCAPE '\\' OR content LIKE ?1 ESCAPE '\\'
        ORDER BY updated_at DESC
        LIMIT ?2`
    ).bind(like, limit).all(),

    env.DB.prepare(
      `SELECT id, content, created_at, updated_at
         FROM memos
        WHERE content LIKE ?1 ESCAPE '\\'
        ORDER BY created_at DESC
        LIMIT ?2`
    ).bind(like, limit).all(),
  ])

  const notes = (noteResult?.results || []).map(n => ({
    id:          n.id,
    notebook_id: n.notebook_id,
    title:       n.title,
    icon:        n.icon,
    updated_at:  n.updated_at,
    snippet:     makeSnippet(stripHtml(n.content), q),
  }))

  const memos = (memoResult?.results || []).map(m => ({
    id:         m.id,
    created_at: m.created_at,
    updated_at: m.updated_at,
    snippet:    makeSnippet(String(m.content || ''), q),
  }))

  return ok({
    query:     q,
    notebooks: nbResult?.results || [],
    notes,
    memos,
  })
}
