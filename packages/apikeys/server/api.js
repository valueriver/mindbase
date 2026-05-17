import {
  listApikeysAction,
  createApikeyAction,
  updateApikeyAction,
  deleteApikeyAction,
} from './service.js'

const handle = async (request, env, sub, method, url) => {
  if (sub === '' && method === 'GET')  return listApikeysAction(request, env, url)
  if (sub === '' && method === 'POST') return createApikeyAction(request, env)

  const m = sub.match(/^\/([0-9A-Za-z-]+)$/)
  if (m) {
    const id = m[1]
    if (method === 'PATCH')  return updateApikeyAction(request, env, id)
    if (method === 'DELETE') return deleteApikeyAction(request, env, id)
  }
  return null
}

export default handle
