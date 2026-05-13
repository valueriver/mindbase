import { readJsonBody } from '../api/utils/body.js'
import { ok, fail } from '../api/utils/json.js'
import { createNoteId } from '../api/utils/id.js'
import { isAuthenticated } from '../domain/auth/index.js'
import { deleteR2Keys, diffRemovedKeys, extractR2Keys } from '../domain/image/refs.js'
import { findNotebookById, getNotebookAncestors } from '../repository/notebook.js'
import { createNote, deleteNote, findNoteById, updateNote } from '../repository/note.js'

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
