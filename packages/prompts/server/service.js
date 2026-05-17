import { ok, fail } from '../../system/utils/json.js'
import { readJsonBody } from '../../system/utils/body.js'
import { isAuthenticated } from '../../system/auth/index.js'
import {
  listPrompts,
  findPromptById,
  insertPrompt,
  updatePrompt,
  deletePrompt,
} from './repository.js'

const serialize = (row) => row && ({
  id:         row.id,
  title:      row.title,
  content:    row.content || '',
  tags:       row.tags || '',
  model:      row.model || '',
  note:       row.note || '',
  created_at: row.created_at,
  updated_at: row.updated_at,
})

const cleanStr = (v) => (v === undefined || v === null) ? null : String(v).trim()

export const listPromptsAction = async (request, env) => {
  if (!(await isAuthenticated(request, env))) return fail('unauthorized', 401)
  const r = await listPrompts(env.DB)
  return ok({ items: (r?.results || []).map(serialize) })
}

export const createPromptAction = async (request, env) => {
  if (!(await isAuthenticated(request, env))) return fail('unauthorized', 401)
  const body = await readJsonBody(request)
  const title = cleanStr(body?.title)
  if (!title) return fail('title_required', 400)
  const row = await insertPrompt(env.DB, {
    id:      crypto.randomUUID(),
    title,
    // content 保留换行,不 trim
    content: body?.content === undefined || body?.content === null ? '' : String(body.content),
    tags:    cleanStr(body?.tags)  || '',
    model:   cleanStr(body?.model) || '',
    note:    cleanStr(body?.note)  || '',
  })
  return ok({ item: serialize(row) })
}

export const updatePromptAction = async (request, env, id) => {
  if (!(await isAuthenticated(request, env))) return fail('unauthorized', 401)
  const existing = await findPromptById(env.DB, id)
  if (!existing) return fail('not_found', 404)
  const body = await readJsonBody(request)

  let title
  if (body?.title !== undefined) {
    title = cleanStr(body.title)
    if (!title) return fail('title_required', 400)
  }
  const row = await updatePrompt(env.DB, id, {
    title,
    content: body?.content !== undefined ? String(body.content ?? '') : undefined,
    tags:    body?.tags    !== undefined ? (cleanStr(body.tags) ?? '')  : undefined,
    model:   body?.model   !== undefined ? (cleanStr(body.model) ?? '') : undefined,
    note:    body?.note    !== undefined ? (cleanStr(body.note) ?? '')  : undefined,
  })
  return ok({ item: serialize(row) })
}

export const deletePromptAction = async (request, env, id) => {
  if (!(await isAuthenticated(request, env))) return fail('unauthorized', 401)
  const existing = await findPromptById(env.DB, id)
  if (!existing) return fail('not_found', 404)
  await deletePrompt(env.DB, id)
  return ok({})
}
