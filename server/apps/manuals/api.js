import {
  listManualsAction,
  createManualAction,
  updateManualAction,
  deleteManualAction,
} from './service.js'

const handle = async (request, env, sub, method, url) => {
  if (sub === '' && method === 'GET')  return listManualsAction(request, env, url)
  if (sub === '' && method === 'POST') return createManualAction(request, env)

  const m = sub.match(/^\/([0-9A-Za-z-]+)$/)
  if (m) {
    const id = m[1]
    if (method === 'PATCH')  return updateManualAction(request, env, id)
    if (method === 'DELETE') return deleteManualAction(request, env, id)
  }
  return null
}

export default handle
