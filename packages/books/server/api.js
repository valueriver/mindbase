import {
  listBooksAction,
  createBookAction,
  updateBookAction,
  deleteBookAction,
} from './service.js'

const handle = async (request, env, sub, method, url) => {
  if (sub === '' && method === 'GET')  return listBooksAction(request, env, url)
  if (sub === '' && method === 'POST') return createBookAction(request, env)

  const m = sub.match(/^\/([0-9A-Za-z-]+)$/)
  if (m) {
    const id = m[1]
    if (method === 'PATCH')  return updateBookAction(request, env, id)
    if (method === 'DELETE') return deleteBookAction(request, env, id)
  }
  return null
}

export default handle
