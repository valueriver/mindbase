import { ok, fail } from '../api/utils/json.js'
import { getUserFromRequest } from '../domain/auth/index.js'

const MAX_LIMIT   = 50
const SNIPPET_LEN = 120

// 去掉 HTML 标签、压空白,便于搜索/展示 snippet
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

// GET /api/search?q=term&limit=20
// 搜本人的笔记本名字 + 笔记标题 + 笔记正文(HTML,去标签后用 LIKE)
export const searchAction = async (request, env, url) => {
  const user = await getUserFromRequest(request, env)
  if (!user) return fail('unauthorized', 401)

  const q = String(url.searchParams.get('q') || '').trim().slice(0, 120)
  if (!q) return ok({ query: '', notebooks: [], notes: [] })

  const limit = Math.max(
    1,
    Math.min(MAX_LIMIT, Number.parseInt(url.searchParams.get('limit') || '20', 10) || 20),
  )
  const like = `%${q.replace(/[%_]/g, m => `\\${m}`)}%`

  const [nbResult, noteResult] = await Promise.all([
    env.DB.prepare(
      `SELECT id, parent_id, name, icon, cover, updated_at
         FROM notebooks
        WHERE user_id = ?1 AND name LIKE ?2 ESCAPE '\\'
        ORDER BY updated_at DESC
        LIMIT ?3`
    ).bind(user.id, like, limit).all(),

    env.DB.prepare(
      `SELECT id, notebook_id, title, icon, content, updated_at
         FROM notes
        WHERE user_id = ?1
          AND (title LIKE ?2 ESCAPE '\\' OR content LIKE ?2 ESCAPE '\\')
        ORDER BY updated_at DESC
        LIMIT ?3`
    ).bind(user.id, like, limit).all(),
  ])

  const notes = (noteResult?.results || []).map(n => ({
    id:          n.id,
    notebook_id: n.notebook_id,
    title:       n.title,
    icon:        n.icon,
    updated_at:  n.updated_at,
    snippet:     makeSnippet(stripHtml(n.content), q),
  }))

  return ok({
    query:     q,
    notebooks: nbResult?.results || [],
    notes,
  })
}
