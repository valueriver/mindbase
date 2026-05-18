// Combined service for notes: notebooks, pages, reorder, and home root.
import { readJsonBody } from '../../system/utils/body.js'
import { ok, fail } from '../../system/utils/json.js'
import { createNotebookId, createNoteId } from '../../system/utils/id.js'
import { isAuthenticated } from '../../system/auth/index.js'
import { deleteR2Keys, diffRemovedKeys, extractR2Keys } from '../../system/image/refs.js'
import { getAllSettings, setSetting } from '../settings/repository.js'
import {
  createNotebook,
  deleteNotebook,
  findNotebookById,
  getNotebookAncestors,
  isSelfOrDescendant,
  listNotebooksUnder,
  updateNotebook,
  createNote,
  deleteNote,
  findNoteById,
  listNotesIn,
  updateNote,
} from './repository.js'

const requireAuth = async (request, env) => {
  if (await isAuthenticated(request, env)) return null
  return fail('unauthorized', 401)
}

const readNullableString = (body, key, maxLen) => {
  if (!body || !(key in body)) return undefined
  const v = body[key]
  if (v === null || v === '') return null
  return String(v).slice(0, maxLen)
}

// ---------- Notebooks ----------
const collectDescendantImageKeys = async (db, rootNotebookId) => {
  const queue = [rootNotebookId]
  const keys  = []
  while (queue.length) {
    const nbId = queue.shift()
    const [childNbs, notes] = await Promise.all([
      listNotebooksUnder(db, nbId),
      listNotesIn(db, nbId),
    ])
    for (const child of childNbs) queue.push(child.id)
    for (const note of notes) keys.push(...extractR2Keys(note.content))
  }
  return keys
}

export const listNotebooksAction = async (request, env, url) => {
  const e = await requireAuth(request, env); if (e) return e
  const parentId = url.searchParams.get('parent_id') || null
  const notebooks = await listNotebooksUnder(env.DB, parentId)
  return ok({ notebooks })
}

export const createNotebookAction = async (request, env) => {
  const e = await requireAuth(request, env); if (e) return e

  const body = await readJsonBody(request)
  const name     = String(body?.name || '').trim().slice(0, 120)
  const icon     = body?.icon  ? String(body.icon).slice(0, 32)    : null
  const cover    = body?.cover ? String(body.cover).slice(0, 2048) : null
  const parentId = body?.parent_id ? String(body.parent_id) : null
  if (!name) return fail('name_required', 400)

  if (parentId) {
    const parent = await findNotebookById(env.DB, parentId)
    if (!parent) return fail('parent_not_found', 404)
  }

  const notebook = await createNotebook(env.DB, {
    id: createNotebookId(),
    parentId,
    name,
    icon,
    cover,
  })
  return ok({ notebook }, 201)
}

export const getNotebookDetailAction = async (request, env, id) => {
  const e = await requireAuth(request, env); if (e) return e

  const notebook = await findNotebookById(env.DB, id)
  if (!notebook) return fail('not_found', 404)

  const [ancestors, children, notes] = await Promise.all([
    getNotebookAncestors(env.DB, id),
    listNotebooksUnder(env.DB, id),
    listNotesIn(env.DB, id),
  ])

  return ok({ notebook, breadcrumb: ancestors, children, notes })
}

export const updateNotebookAction = async (request, env, id) => {
  const e = await requireAuth(request, env); if (e) return e

  const existing = await findNotebookById(env.DB, id)
  if (!existing) return fail('not_found', 404)

  const body = await readJsonBody(request)
  const patch = {}
  if (typeof body?.name === 'string') patch.name = body.name.trim().slice(0, 120)
  if (Number.isFinite(body?.sort_order)) patch.sortOrder = Number(body.sort_order)

  const icon  = readNullableString(body, 'icon',  32)
  const cover = readNullableString(body, 'cover', 2048)
  if (icon  !== undefined) patch.icon  = icon
  if (cover !== undefined) patch.cover = cover

  if ('parent_id' in (body || {})) {
    const nextParent = body.parent_id ? String(body.parent_id) : null
    if (nextParent) {
      if (nextParent === id) return fail('cannot_nest_in_self', 400)
      const parent = await findNotebookById(env.DB, nextParent)
      if (!parent) return fail('parent_not_found', 404)
      if (await isSelfOrDescendant(env.DB, id, nextParent)) {
        return fail('cannot_nest_in_descendant', 400)
      }
    }
    patch.parentId = nextParent
  }

  const notebook = await updateNotebook(env.DB, id, patch)
  return ok({ notebook })
}

export const deleteNotebookAction = async (request, env, id) => {
  const e = await requireAuth(request, env); if (e) return e

  const existing = await findNotebookById(env.DB, id)
  if (!existing) return fail('not_found', 404)

  const imageKeys = await collectDescendantImageKeys(env.DB, id)

  await deleteNotebook(env.DB, id)
  if (imageKeys.length > 0) await deleteR2Keys(env, imageKeys)

  return ok({ deleted: true })
}

// ---------- Notes (pages) ----------
export const createNoteAction = async (request, env) => {
  const e = await requireAuth(request, env); if (e) return e

  const body = await readJsonBody(request)
  const notebookId = body?.notebook_id ? String(body.notebook_id) : null
  if (notebookId) {
    const notebook = await findNotebookById(env.DB, notebookId)
    if (!notebook) return fail('notebook_not_found', 404)
  }

  const title   = String(body?.title   || '').slice(0, 200)
  const content = String(body?.content || '').slice(0, 200_000)
  const icon    = body?.icon  ? String(body.icon).slice(0, 32)    : null
  const cover   = body?.cover ? String(body.cover).slice(0, 2048) : null

  const note = await createNote(env.DB, {
    id: createNoteId(),
    notebookId,
    title,
    content,
    icon,
    cover,
  })
  return ok({ note }, 201)
}

export const getNoteDetailAction = async (request, env, id) => {
  const e = await requireAuth(request, env); if (e) return e

  const note = await findNoteById(env.DB, id)
  if (!note) return fail('not_found', 404)

  const breadcrumb = note.notebook_id
    ? await getNotebookAncestors(env.DB, note.notebook_id)
    : []
  return ok({ note, breadcrumb })
}

export const updateNoteAction = async (request, env, id) => {
  const e = await requireAuth(request, env); if (e) return e

  const existing = await findNoteById(env.DB, id)
  if (!existing) return fail('not_found', 404)

  const body = await readJsonBody(request)
  const patch = {}
  if (typeof body?.title === 'string') patch.title = body.title.slice(0, 200)

  let removedImageKeys = []
  if (typeof body?.content === 'string') {
    patch.content = body.content.slice(0, 200_000)
    removedImageKeys = diffRemovedKeys(existing.content, patch.content)
  }

  if (Number.isFinite(body?.sort_order)) patch.sortOrder = Number(body.sort_order)

  const icon  = readNullableString(body, 'icon',  32)
  const cover = readNullableString(body, 'cover', 2048)
  if (icon  !== undefined) patch.icon  = icon
  if (cover !== undefined) patch.cover = cover

  if ('notebook_id' in (body || {})) {
    if (body.notebook_id === null) {
      patch.notebookId = null
    } else if (typeof body.notebook_id === 'string' && body.notebook_id) {
      const target = await findNotebookById(env.DB, body.notebook_id)
      if (!target) return fail('notebook_not_found', 404)
      patch.notebookId = body.notebook_id
    }
  }

  const note = await updateNote(env.DB, id, patch)

  if (removedImageKeys.length > 0) {
    await deleteR2Keys(env, removedImageKeys)
  }

  return ok({ note })
}

export const deleteNoteAction = async (request, env, id) => {
  const e = await requireAuth(request, env); if (e) return e

  const existing = await findNoteById(env.DB, id)
  if (!existing) return fail('not_found', 404)

  const keys = extractR2Keys(existing.content)

  await deleteNote(env.DB, id)
  if (keys.length > 0) await deleteR2Keys(env, keys)

  return ok({ deleted: true })
}

// ---------- Reorder (items) ----------
export const reorderItemsAction = async (request, env) => {
  if (!(await isAuthenticated(request, env))) return fail('unauthorized', 401)

  const body = await readJsonBody(request)
  if (!body || !Array.isArray(body.items)) return fail('items_required', 400)
  if (body.items.length > 1000) return fail('too_many_items', 400)

  const parentId = body.parent_id ? String(body.parent_id) : null

  const stmts = []
  for (let i = 0; i < body.items.length; i++) {
    const it = body.items[i]
    const id = String(it?.id || '')
    const kind = String(it?.kind || '')
    if (!id || (kind !== 'notebook' && kind !== 'note')) continue

    if (kind === 'notebook') {
      stmts.push(env.DB.prepare(
        `UPDATE notes_notebooks
            SET sort_order = ?1, updated_at = datetime('now')
          WHERE id = ?2
            AND (parent_id IS ?3 OR parent_id = ?3)`
      ).bind(i, id, parentId))
    } else {
      stmts.push(env.DB.prepare(
        `UPDATE notes_pages
            SET sort_order = ?1, updated_at = datetime('now')
          WHERE id = ?2
            AND (notebook_id IS ?3 OR notebook_id = ?3)`
      ).bind(i, id, parentId))
    }
  }

  if (stmts.length === 0) return ok({ updated: 0 })

  await env.DB.batch(stmts)
  return ok({ updated: stmts.length })
}

// ---------- Home root (was server/system/root) ----------
// home_* 元数据存到 settings KV
const HOME_KEYS = { name: 'home_name', icon: 'home_icon', cover: 'home_cover' }

const toHome = (settings) => ({
  name:  settings.home_name  || '首页',
  icon:  settings.home_icon  || null,
  cover: settings.home_cover || null,
})

export const getRootAction = async (request, env) => {
  if (!(await isAuthenticated(request, env))) return fail('unauthorized', 401)

  const [settings, notebooks, notes] = await Promise.all([
    getAllSettings(env.DB),
    listNotebooksUnder(env.DB, null),
    listNotesIn(env.DB, null),
  ])

  return ok({ home: toHome(settings), notebooks, notes })
}

export const updateHomeAction = async (request, env) => {
  if (!(await isAuthenticated(request, env))) return fail('unauthorized', 401)

  const body = await readJsonBody(request)
  const writes = []

  if (typeof body?.name === 'string') {
    const next = body.name.trim().slice(0, 120) || '首页'
    writes.push(setSetting(env.DB, HOME_KEYS.name, next))
  }
  const icon  = readNullableString(body, 'icon',  32)
  const cover = readNullableString(body, 'cover', 2048)
  if (icon  !== undefined) writes.push(setSetting(env.DB, HOME_KEYS.icon,  icon))
  if (cover !== undefined) writes.push(setSetting(env.DB, HOME_KEYS.cover, cover))

  await Promise.all(writes)

  const settings = await getAllSettings(env.DB)
  return ok({ home: toHome(settings) })
}
