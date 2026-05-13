import { readJsonBody } from '../api/utils/body.js'
import { ok, fail } from '../api/utils/json.js'
import { createNotebookId } from '../api/utils/id.js'
import { isAuthenticated } from '../domain/auth/index.js'
import { deleteR2Keys, extractR2Keys } from '../domain/image/refs.js'
import {
  createNotebook,
  deleteNotebook,
  findNotebookById,
  getNotebookAncestors,
  isSelfOrDescendant,
  listNotebooksUnder,
  updateNotebook,
} from '../repository/notebook.js'
import { listNotesIn } from '../repository/note.js'

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
