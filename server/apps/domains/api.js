import {
  listDomainsAction,
  createDomainAction,
  updateDomainAction,
  deleteDomainAction,
} from './service.js'

const handle = async (request, env, sub, method, url) => {
  if (sub === '' && method === 'GET')  return listDomainsAction(request, env, url)
  if (sub === '' && method === 'POST') return createDomainAction(request, env)

  const m = sub.match(/^\/([0-9A-Za-z-]+)$/)
  if (m) {
    const id = m[1]
    if (method === 'PATCH')  return updateDomainAction(request, env, id)
    if (method === 'DELETE') return deleteDomainAction(request, env, id)
  }
  return null
}

export default handle
