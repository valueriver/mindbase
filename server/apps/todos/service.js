import { ok, fail } from '../../lib/utils/json.js'
import { readJsonBody } from '../../lib/utils/body.js'
import { createTodoId } from '../../lib/utils/id.js'
import { isAuthenticated } from '../../lib/auth/index.js'
import {
  listTodos,
  findTodoById,
  insertTodo,
  updateTodo,
  deleteTodo,
} from './repository.js'

const MAX_TITLE = 500

const serialize = (row) => row && ({
  id:         row.id,
  title:      row.title || '',
  done:       !!row.done,
  sort_order: row.sort_order ?? 0,
  created_at: row.created_at,
  updated_at: row.updated_at,
})

export const listTodosAction = async (request, env) => {
  if (!(await isAuthenticated(request, env))) return fail('unauthorized', 401)
  const r = await listTodos(env.DB)
  return ok({ todos: (r?.results || []).map(serialize) })
}

export const createTodoAction = async (request, env) => {
  if (!(await isAuthenticated(request, env))) return fail('unauthorized', 401)
  const body = await readJsonBody(request)
  const title = String(body?.title || '').trim().slice(0, MAX_TITLE)
  if (!title) return fail('title_required', 400)
  const row = await insertTodo(env.DB, { id: createTodoId(), title })
  return ok({ todo: serialize(row) })
}

export const updateTodoAction = async (request, env, id) => {
  if (!(await isAuthenticated(request, env))) return fail('unauthorized', 401)
  const existing = await findTodoById(env.DB, id)
  if (!existing) return fail('not_found', 404)

  const body = await readJsonBody(request)
  const patch = {}
  if (typeof body?.title === 'string') {
    const t = body.title.trim().slice(0, MAX_TITLE)
    if (!t) return fail('title_required', 400)
    patch.title = t
  }
  if (body?.done !== undefined) patch.done = !!body.done
  if (Number.isFinite(body?.sort_order)) patch.sortOrder = Number(body.sort_order)

  const row = await updateTodo(env.DB, id, patch)
  return ok({ todo: serialize(row) })
}

export const deleteTodoAction = async (request, env, id) => {
  if (!(await isAuthenticated(request, env))) return fail('unauthorized', 401)
  const existing = await findTodoById(env.DB, id)
  if (!existing) return fail('not_found', 404)
  await deleteTodo(env.DB, id)
  return ok({})
}
