import {
  listMemosAction,
  createMemoAction,
  updateMemoAction,
  deleteMemoAction,
} from './service.js'

const handle = async (request, env, sub, method, url) => {
  if (sub === '' && method === 'GET')  return listMemosAction(request, env, url)
  if (sub === '' && method === 'POST') return createMemoAction(request, env)

  const m = sub.match(/^\/([0-9A-Za-z]+)$/)
  if (m) {
    const id = m[1]
    if (method === 'PATCH')  return updateMemoAction(request, env, id)
    if (method === 'DELETE') return deleteMemoAction(request, env, id)
  }
  return null
}

export default handle
