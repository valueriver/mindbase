import {
  listMemoriesAction,
  getMemoryAction,
  createMemoryAction,
  updateMemoryAction,
  deleteMemoryAction,
} from '../service/memory.js'

export const handleMemoryApi = async (request, env, path, method) => {
  if (path === '/api/memories' && method === 'GET')  return listMemoriesAction(request, env)
  if (path === '/api/memories' && method === 'POST') return createMemoryAction(request, env)

  const m = path.match(/^\/api\/memories\/(\d+)$/)
  if (m) {
    const id = m[1]
    if (method === 'GET')    return getMemoryAction(request, env, id)
    if (method === 'PATCH')  return updateMemoryAction(request, env, id)
    if (method === 'DELETE') return deleteMemoryAction(request, env, id)
  }
  return null
}
