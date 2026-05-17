import {
  listAssetsAction,
  createAssetAction,
  updateAssetAction,
  deleteAssetAction,
} from './service.js'

const handle = async (request, env, sub, method, url) => {
  if (sub === '' && method === 'GET')  return listAssetsAction(request, env, url)
  if (sub === '' && method === 'POST') return createAssetAction(request, env)

  const m = sub.match(/^\/([0-9A-Za-z-]+)$/)
  if (m) {
    const id = m[1]
    if (method === 'PATCH')  return updateAssetAction(request, env, id)
    if (method === 'DELETE') return deleteAssetAction(request, env, id)
  }
  return null
}

export default handle
