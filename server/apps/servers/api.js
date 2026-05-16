import {
  listServersAction,
  createServerAction,
  updateServerAction,
  deleteServerAction,
} from './service.js'

const handle = async (request, env, sub, method, url) => {
  if (sub === '' && method === 'GET')  return listServersAction(request, env, url)
  if (sub === '' && method === 'POST') return createServerAction(request, env)

  const m = sub.match(/^\/([0-9A-Za-z-]+)$/)
  if (m) {
    const id = m[1]
    if (method === 'PATCH')  return updateServerAction(request, env, id)
    if (method === 'DELETE') return deleteServerAction(request, env, id)
  }
  return null
}

export default handle
