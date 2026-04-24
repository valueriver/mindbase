import { readJsonBody } from '../api/utils/body.js'
import { ok, fail } from '../api/utils/json.js'
import { createNotebookId } from '../api/utils/id.js'
import { getUserFromRequest } from '../domain/auth/index.js'
import { deleteR2Keys, extractOwnedR2Keys } from '../domain/image/refs.js'
import {
  createNotebook,
  deleteNotebook,
  findNotebookForUser,
  getNotebookAncestors,
  isSelfOrDescendant,
  listNotebooksUnder,
  updateNotebook,
} from '../repository/notebook.js'
import { listNotesIn } from '../repository/note.js'

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

// 递归收集子孙里所有笔记的 R2 key
const collectDescendantImageKeys = async (db, userId, rootNotebookId) => {
  const queue = [rootNotebookId]
  const keys  = []
  while (queue.length) {
    const nbId = queue.shift()
    const [childNbs, notes] = await Promise.all([
      listNotebooksUnder(db, userId, nbId),
      listNotesIn(db, userId, nbId),
    ])
    for (const child of childNbs) queue.push(child.id)
    for (const note of notes) keys.push(...extractOwnedR2Keys(note.content, userId))
  }
  return keys
}

export const listNotebooksAction = async (request, env, url) => {
  const { user, error } = await authed(request, env)
  if (error) return error
  const parentId = url.searchParams.get('parent_id') || null
  const notebooks = await listNotebooksUnder(env.DB, user.id, parentId)
  return ok({ notebooks })
}

export const createNotebookAction = async (request, env) => {
  const { user, error } = await authed(request, env)
  if (error) return error

  const body = await readJsonBody(request)
  const name     = String(body?.name || '').trim().slice(0, 120)
  const icon     = body?.icon  ? String(body.icon).slice(0, 32)    : null
  const cover    = body?.cover ? String(body.cover).slice(0, 2048) : null
  const parentId = body?.parent_id ? String(body.parent_id) : null
  if (!name) return fail('name_required', 400)

  if (parentId) {
    const parent = await findNotebookForUser(env.DB, parentId, user.id)
    if (!parent) return fail('parent_not_found', 404)
  }

  const notebook = await createNotebook(env.DB, {
    id: createNotebookId(),
    userId: user.id,
    parentId,
    name,
    icon,
    cover,
  })
  return ok({ notebook }, 201)
}

export const getNotebookDetailAction = async (request, env, id) => {
  const { user, error } = await authed(request, env)
  if (error) return error

  const notebook = await findNotebookForUser(env.DB, id, user.id)
  if (!notebook) return fail('not_found', 404)

  const [ancestors, children, notes] = await Promise.all([
    getNotebookAncestors(env.DB, id, user.id),
    listNotebooksUnder(env.DB, user.id, id),
    listNotesIn(env.DB, user.id, id),
  ])

  return ok({ notebook, breadcrumb: ancestors, children, notes })
}

export const updateNotebookAction = async (request, env, id) => {
  const { user, error } = await authed(request, env)
  if (error) return error

  const existing = await findNotebookForUser(env.DB, id, user.id)
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
      const parent = await findNotebookForUser(env.DB, nextParent, user.id)
      if (!parent) return fail('parent_not_found', 404)
      if (await isSelfOrDescendant(env.DB, user.id, id, nextParent)) {
        return fail('cannot_nest_in_descendant', 400)
      }
    }
    patch.parentId = nextParent
  }

  const notebook = await updateNotebook(env.DB, id, patch)
  return ok({ notebook })
}

export const deleteNotebookAction = async (request, env, id) => {
  const { user, error } = await authed(request, env)
  if (error) return error

  const existing = await findNotebookForUser(env.DB, id, user.id)
  if (!existing) return fail('not_found', 404)

  // 先收集所有子孙笔记用到的 R2 key,DB 级联删之后就查不到了
  const imageKeys = await collectDescendantImageKeys(env.DB, user.id, id)

  await deleteNotebook(env.DB, id)
  if (imageKeys.length > 0) await deleteR2Keys(env, imageKeys)

  return ok({ deleted: true })
}
