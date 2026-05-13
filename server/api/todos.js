import {
  listTodosAction,
  createTodoAction,
  updateTodoAction,
  deleteTodoAction,
} from '../service/todo.js'

export const handleTodoApi = async (request, env, path, method) => {
  if (path === '/api/todos' && method === 'GET')  return listTodosAction(request, env)
  if (path === '/api/todos' && method === 'POST') return createTodoAction(request, env)

  const m = path.match(/^\/api\/todos\/([0-9A-Za-z]+)$/)
  if (m) {
    const id = m[1]
    if (method === 'PATCH')  return updateTodoAction(request, env, id)
    if (method === 'DELETE') return deleteTodoAction(request, env, id)
  }
  return null
}
