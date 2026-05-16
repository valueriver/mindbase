import {
  listDocsAction,
  createDocAction,
  updateDocAction,
  deleteDocAction,
} from './service.js'

const handle = async (request, env, sub, method, url) => {
  if (sub === '' && method === 'GET')  return listDocsAction(request, env, url)
  if (sub === '' && method === 'POST') return createDocAction(request, env)

  const m = sub.match(/^\/([0-9A-Za-z-]+)$/)
  if (m) {
    const id = m[1]
    if (method === 'PATCH')  return updateDocAction(request, env, id)
    if (method === 'DELETE') return deleteDocAction(request, env, id)
  }
  return null
}

export default handle
