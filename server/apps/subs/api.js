import {
  listSubsAction,
  createSubAction,
  updateSubAction,
  deleteSubAction,
} from './service.js'

const handle = async (request, env, sub, method, url) => {
  if (sub === '' && method === 'GET')  return listSubsAction(request, env, url)
  if (sub === '' && method === 'POST') return createSubAction(request, env)

  const m = sub.match(/^\/([0-9A-Za-z-]+)$/)
  if (m) {
    const id = m[1]
    if (method === 'PATCH')  return updateSubAction(request, env, id)
    if (method === 'DELETE') return deleteSubAction(request, env, id)
  }
  return null
}

export default handle
