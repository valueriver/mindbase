import {
  listPagesAction,
  createPageAction,
  updatePageAction,
  deletePageAction,
} from './service.js'

const handle = async (request, env, sub, method, url) => {
  if (sub === '' && method === 'GET')  return listPagesAction(request, env, url)
  if (sub === '' && method === 'POST') return createPageAction(request, env)

  const m = sub.match(/^\/([^/]+)$/)
  if (m) {
    const id = m[1]
    if (method === 'PATCH')  return updatePageAction(request, env, id)
    if (method === 'DELETE') return deletePageAction(request, env, id)
  }
  return null
}

export default handle
