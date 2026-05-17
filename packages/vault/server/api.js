import {
  listVaultAction,
  createVaultAction,
  updateVaultAction,
  deleteVaultAction,
  importVaultAction,
} from './service.js'

const handle = async (request, env, sub, method, url) => {
  if (sub === '' && method === 'GET')  return listVaultAction(request, env, url)
  if (sub === '' && method === 'POST') return createVaultAction(request, env)

  if (sub === '/import' && method === 'POST') return importVaultAction(request, env)

  const m = sub.match(/^\/([0-9A-Za-z-]+)$/)
  if (m) {
    const id = m[1]
    if (method === 'PATCH')  return updateVaultAction(request, env, id)
    if (method === 'DELETE') return deleteVaultAction(request, env, id)
  }
  return null
}

export default handle
