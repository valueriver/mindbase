import {
  createNotebookAction,
  deleteNotebookAction,
  getNotebookDetailAction,
  listNotebooksAction,
  updateNotebookAction,
} from '../service/notebook.js'

// /api/notebooks              GET  -> list children of (parent_id | root)
// /api/notebooks              POST -> create
// /api/notebooks/:id          GET    PATCH    DELETE
export const handleNotebookApi = async (request, env, path, method, url) => {
  if (path === '/api/notebooks' && method === 'GET')  return listNotebooksAction(request, env, url)
  if (path === '/api/notebooks' && method === 'POST') return createNotebookAction(request, env)

  const m = path.match(/^\/api\/notebooks\/([^/]+)$/)
  if (m) {
    const id = m[1]
    if (method === 'GET')    return getNotebookDetailAction(request, env, id)
    if (method === 'PATCH')  return updateNotebookAction(request, env, id)
    if (method === 'DELETE') return deleteNotebookAction(request, env, id)
  }

  return null
}
