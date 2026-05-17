import {
  listFootprintsAction,
  createFootprintAction,
  updateFootprintAction,
  deleteFootprintAction,
} from './service.js'

const handle = async (request, env, sub, method, url) => {
  if (sub === '' && method === 'GET')  return listFootprintsAction(request, env, url)
  if (sub === '' && method === 'POST') return createFootprintAction(request, env)

  const m = sub.match(/^\/([0-9A-Za-z-]+)$/)
  if (m) {
    const id = m[1]
    if (method === 'PATCH')  return updateFootprintAction(request, env, id)
    if (method === 'DELETE') return deleteFootprintAction(request, env, id)
  }
  return null
}

export default handle
