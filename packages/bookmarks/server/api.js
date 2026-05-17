import {
  listBookmarksAction,
  createBookmarkAction,
  updateBookmarkAction,
  deleteBookmarkAction,
} from './service.js'

const handle = async (request, env, sub, method, url) => {
  if (sub === '' && method === 'GET')  return listBookmarksAction(request, env, url)
  if (sub === '' && method === 'POST') return createBookmarkAction(request, env)

  const m = sub.match(/^\/([0-9A-Za-z-]+)$/)
  if (m) {
    const id = m[1]
    if (method === 'PATCH')  return updateBookmarkAction(request, env, id)
    if (method === 'DELETE') return deleteBookmarkAction(request, env, id)
  }
  return null
}

export default handle
