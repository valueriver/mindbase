import {
  listTodosAction,
  createTodoAction,
  updateTodoAction,
  deleteTodoAction,
} from './service.js'

const handle = async (request, env, sub, method) => {
  if (sub === '' && method === 'GET')  return listTodosAction(request, env)
  if (sub === '' && method === 'POST') return createTodoAction(request, env)

  const m = sub.match(/^\/([\w-]+)$/)
  if (m) {
    const id = m[1]
    if (method === 'PATCH')  return updateTodoAction(request, env, id)
    if (method === 'DELETE') return deleteTodoAction(request, env, id)
  }
  return null
}

export default handle
