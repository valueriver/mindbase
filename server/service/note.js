import { readJsonBody } from '../api/utils/body.js'
import { ok, fail } from '../api/utils/json.js'
import { createNoteId } from '../api/utils/id.js'
import { getUserFromRequest } from '../domain/auth/index.js'
import {
  deleteR2Keys,
  diffRemovedKeys,
  extractOwnedR2Keys,
} from '../domain/image/refs.js'
import { findNotebookForUser, getNotebookAncestors } from '../repository/notebook.js'
import {
  createNote,
  deleteNote,
  findNoteForUser,
  updateNote,
} from '../repository/note.js'

const authed = async (request, env) => {
  const user = await getUserFromRequest(request, env)
  if (!user) return { error: fail('unauthorized', 401) }
  return { user }
}

const readNullableString = (body, key, maxLen) => {
  if (!body || !(key in body)) return undefined
  const v = body[key]
  if (v === null || v === '') return null
  return String(v).slice(0, maxLen)
}

export const createNoteAction = async (request, env) => {
  const { user, error } = await authed(request, env)
  if (error) return error

  const body = await readJsonBody(request)
  // notebook_id 可空 → 放在根层级
  const notebookId = body?.notebook_id ? String(body.notebook_id) : null
  if (notebookId) {
    const notebook = await findNotebookForUser(env.DB, notebookId, user.id)
    if (!notebook) return fail('notebook_not_found', 404)
  }

  const title   = String(body?.title   || '').slice(0, 200)
  const content = String(body?.content || '').slice(0, 200_000)
  const icon    = body?.icon  ? String(body.icon).slice(0, 32)    : null
  const cover   = body?.cover ? String(body.cover).slice(0, 2048) : null

  const note = await createNote(env.DB, {
    id: createNoteId(),
    userId: user.id,
    notebookId,
    title,
    content,
    icon,
    cover,
  })
  return ok({ note }, 201)
}

export const getNoteDetailAction = async (request, env, id) => {
  const { user, error } = await authed(request, env)
  if (error) return error

  const note = await findNoteForUser(env.DB, id, user.id)
  if (!note) return fail('not_found', 404)

  const breadcrumb = await getNotebookAncestors(env.DB, note.notebook_id, user.id)
  return ok({ note, breadcrumb })
}

export const updateNoteAction = async (request, env, id) => {
  const { user, error } = await authed(request, env)
  if (error) return error

  const existing = await findNoteForUser(env.DB, id, user.id)
  if (!existing) return fail('not_found', 404)

  const body = await readJsonBody(request)
  const patch = {}
  if (typeof body?.title === 'string') patch.title = body.title.slice(0, 200)

  let removedImageKeys = []
  if (typeof body?.content === 'string') {
    patch.content = body.content.slice(0, 200_000)
    removedImageKeys = diffRemovedKeys(existing.content, patch.content, user.id)
  }

  if (Number.isFinite(body?.sort_order)) patch.sortOrder = Number(body.sort_order)

  const icon  = readNullableString(body, 'icon',  32)
  const cover = readNullableString(body, 'cover', 2048)
  if (icon  !== undefined) patch.icon  = icon
  if (cover !== undefined) patch.cover = cover

  // notebook_id:支持移到指定 notebook(字符串 id)或根层级(null)
  if ('notebook_id' in (body || {})) {
    if (body.notebook_id === null) {
      patch.notebookId = null
    } else if (typeof body.notebook_id === 'string' && body.notebook_id) {
      const target = await findNotebookForUser(env.DB, body.notebook_id, user.id)
      if (!target) return fail('notebook_not_found', 404)
      patch.notebookId = body.notebook_id
    }
  }

  const note = await updateNote(env.DB, id, patch)

  // DB 更新成功后再清 R2,避免清了结果 DB 没保存的空档
  if (removedImageKeys.length > 0) {
    await deleteR2Keys(env, removedImageKeys)
  }

  return ok({ note })
}

export const deleteNoteAction = async (request, env, id) => {
  const { user, error } = await authed(request, env)
  if (error) return error

  const existing = await findNoteForUser(env.DB, id, user.id)
  if (!existing) return fail('not_found', 404)

  const keys = extractOwnedR2Keys(existing.content, user.id)

  await deleteNote(env.DB, id)
  if (keys.length > 0) await deleteR2Keys(env, keys)

  return ok({ deleted: true })
}
