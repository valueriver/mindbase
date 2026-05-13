import {
  listMemosAction,
  createMemoAction,
  updateMemoAction,
  deleteMemoAction,
} from '../service/memo.js'

export const handleMemoApi = async (request, env, path, method, url) => {
  if (path === '/api/memos' && method === 'GET')  return listMemosAction(request, env, url)
  if (path === '/api/memos' && method === 'POST') return createMemoAction(request, env)

  const m = path.match(/^\/api\/memos\/([0-9A-Za-z]+)$/)
  if (m) {
    const id = m[1]
    if (method === 'PATCH')  return updateMemoAction(request, env, id)
    if (method === 'DELETE') return deleteMemoAction(request, env, id)
  }
  return null
}
