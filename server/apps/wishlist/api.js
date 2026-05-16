import {
  listWishlistAction,
  createWishlistAction,
  updateWishlistAction,
  deleteWishlistAction,
} from './service.js'

const handle = async (request, env, sub, method, url) => {
  if (sub === '' && method === 'GET')  return listWishlistAction(request, env, url)
  if (sub === '' && method === 'POST') return createWishlistAction(request, env)

  const m = sub.match(/^\/([0-9A-Za-z-]+)$/)
  if (m) {
    const id = m[1]
    if (method === 'PATCH')  return updateWishlistAction(request, env, id)
    if (method === 'DELETE') return deleteWishlistAction(request, env, id)
  }
  return null
}

export default handle
