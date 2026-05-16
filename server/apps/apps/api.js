import {
  listAppsAction,
  createAppAction,
  updateAppAction,
  deleteAppAction,
} from './service.js'

const handle = async (request, env, sub, method, url) => {
  if (sub === '' && method === 'GET')  return listAppsAction(request, env, url)
  if (sub === '' && method === 'POST') return createAppAction(request, env)

  const m = sub.match(/^\/([0-9A-Za-z-]+)$/)
  if (m) {
    const id = m[1]
    if (method === 'PATCH')  return updateAppAction(request, env, id)
    if (method === 'DELETE') return deleteAppAction(request, env, id)
  }
  return null
}

export default handle
