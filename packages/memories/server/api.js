import {
  listMemoriesAction,
  createMemoryAction,
  updateMemoryAction,
  deleteMemoryAction,
} from './service.js'

const handle = async (request, env, sub, method, url) => {
  if (sub === '' && method === 'GET')  return listMemoriesAction(request, env, url)
  if (sub === '' && method === 'POST') return createMemoryAction(request, env)

  const m = sub.match(/^\/([0-9A-Za-z-]+)$/)
  if (m) {
    const id = m[1]
    if (method === 'PATCH')  return updateMemoryAction(request, env, id)
    if (method === 'DELETE') return deleteMemoryAction(request, env, id)
  }
  return null
}

export default handle
