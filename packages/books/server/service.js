import { ok, fail } from '../../system/utils/json.js'
import { readJsonBody } from '../../system/utils/body.js'
import { isAuthenticated } from '../../system/auth/index.js'
import { insertEvent } from '../home/repository.js'
import {
  listBooks,
  findBookById,
  insertBook,
  updateBook,
  deleteBook,
} from './repository.js'

// 主页事件流的本地 wrapper:写入失败不影响主操作。
const emitHomeEvent = async (db, ev) => {
  try {
    await insertEvent(db, {
      id:      crypto.randomUUID(),
      app:     ev.app,
      action:  ev.action,
      ref_id:  ev.ref_id || null,
      summary: ev.summary,
      icon:    ev.icon || null,
    })
  } catch (err) {
    console.error('[emitHomeEvent] failed:', err?.message)
  }
}

const STATUS_LABEL = { want: '想读', reading: '在读', read: '读过' }
const STATUS_VERB  = { reading: '开始读', read: '读完了' }

const STATUSES = new Set(['want', 'reading', 'read'])

const serialize = (row) => row && ({
  id:         row.id,
  title:      row.title,
  author:     row.author || '',
  status:     row.status || 'want',
  rating:     Number(row.rating || 0),
  note:       row.note || '',
  cover:      row.cover || null,
  created_at: row.created_at,
  updated_at: row.updated_at,
})

const cleanStr = (v) => (v === undefined || v === null) ? null : String(v).trim()
const clampRating = (v) => {
  const n = Number(v)
  if (!Number.isFinite(n)) return null
  return Math.max(0, Math.min(5, Math.round(n)))
}
const cleanStatus = (v) => {
  const s = cleanStr(v)
  return s && STATUSES.has(s) ? s : null
}

export const listBooksAction = async (request, env, url) => {
  if (!(await isAuthenticated(request, env))) return fail('unauthorized', 401)
  const limit  = Math.min(Number(url.searchParams.get('limit'))  || 200, 500)
  const offset = Math.max(Number(url.searchParams.get('offset')) || 0, 0)
  const status = cleanStatus(url.searchParams.get('status'))
  const result = await listBooks(env.DB, { status, limit, offset })
  return ok({ items: (result?.results || []).map(serialize) })
}

export const createBookAction = async (request, env) => {
  if (!(await isAuthenticated(request, env))) return fail('unauthorized', 401)
  const body = await readJsonBody(request)
  const title = cleanStr(body?.title)
  if (!title) return fail('title_required', 400)
  const row = await insertBook(env.DB, {
    id:     crypto.randomUUID(),
    title,
    author: cleanStr(body?.author) || '',
    status: cleanStatus(body?.status) || 'want',
    rating: clampRating(body?.rating) ?? 0,
    note:   cleanStr(body?.note) || '',
    cover:  cleanStr(body?.cover),
  })
  await emitHomeEvent(env.DB, {
    app: 'books',
    action: 'created',
    ref_id: row.id,
    summary: `${STATUS_LABEL[row.status] || '加入'}《${row.title}》`,
    icon: '📖',
  })
  return ok({ item: serialize(row) })
}

export const updateBookAction = async (request, env, id) => {
  if (!(await isAuthenticated(request, env))) return fail('unauthorized', 401)
  const existing = await findBookById(env.DB, id)
  if (!existing) return fail('not_found', 404)
  const body = await readJsonBody(request)
  const nextStatus = body?.status !== undefined ? cleanStatus(body.status) : undefined
  const row = await updateBook(env.DB, id, {
    title:  body?.title  !== undefined ? cleanStr(body.title) : undefined,
    author: body?.author !== undefined ? (cleanStr(body.author) ?? '') : undefined,
    status: nextStatus,
    rating: body?.rating !== undefined ? clampRating(body.rating) : undefined,
    note:   body?.note   !== undefined ? (cleanStr(body.note) ?? '') : undefined,
    cover:  body?.cover  !== undefined ? cleanStr(body.cover) : undefined,
  })
  if (nextStatus && existing.status !== nextStatus && STATUS_VERB[nextStatus]) {
    await emitHomeEvent(env.DB, {
      app: 'books',
      action: 'status_changed',
      ref_id: id,
      summary: `${STATUS_VERB[nextStatus]}《${existing.title}》`,
      icon: '📖',
    })
  }
  return ok({ item: serialize(row) })
}

export const deleteBookAction = async (request, env, id) => {
  if (!(await isAuthenticated(request, env))) return fail('unauthorized', 401)
  const existing = await findBookById(env.DB, id)
  if (!existing) return fail('not_found', 404)
  await deleteBook(env.DB, id)
  return ok({})
}
