import {
  listContactsAction,
  createContactAction,
  updateContactAction,
  deleteContactAction,
  importContactsAction,
} from './service.js'

const handle = async (request, env, sub, method, url) => {
  if (sub === '' && method === 'GET')  return listContactsAction(request, env, url)
  if (sub === '' && method === 'POST') return createContactAction(request, env)

  if (sub === '/import' && method === 'POST') return importContactsAction(request, env)

  const m = sub.match(/^\/([0-9A-Za-z-]+)$/)
  if (m) {
    const id = m[1]
    if (method === 'PATCH')  return updateContactAction(request, env, id)
    if (method === 'DELETE') return deleteContactAction(request, env, id)
  }
  return null
}

export default handle
