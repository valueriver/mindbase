// Routes for notes app: notebooks, pages (renamed from notes), and item reorder.
// Mounted at /api/apps/notes; receives sub-paths like /notebooks, /notebooks/:id,
// /pages, /pages/:id, /items/reorder.
import {
  listNotebooksAction,
  createNotebookAction,
  getNotebookDetailAction,
  updateNotebookAction,
  deleteNotebookAction,
  createNoteAction,
  getNoteDetailAction,
  updateNoteAction,
  deleteNoteAction,
  reorderItemsAction,
  getRootAction,
  updateHomeAction,
} from './service.js'

const handle = async (request, env, sub, method, url) => {
  // Home root (notebook listing + home metadata)
  if (sub === '/root' && method === 'GET')   return getRootAction(request, env)
  if (sub === '/root' && method === 'PATCH') return updateHomeAction(request, env)

  // Notebooks
  if (sub === '/notebooks' && method === 'GET')  return listNotebooksAction(request, env, url)
  if (sub === '/notebooks' && method === 'POST') return createNotebookAction(request, env)

  let m = sub.match(/^\/notebooks\/([^/]+)$/)
  if (m) {
    const id = m[1]
    if (method === 'GET')    return getNotebookDetailAction(request, env, id)
    if (method === 'PATCH')  return updateNotebookAction(request, env, id)
    if (method === 'DELETE') return deleteNotebookAction(request, env, id)
  }

  // Pages (resource renamed from notes -> pages)
  if (sub === '/pages' && method === 'POST') return createNoteAction(request, env)

  m = sub.match(/^\/pages\/([^/]+)$/)
  if (m) {
    const id = m[1]
    if (method === 'GET')    return getNoteDetailAction(request, env, id)
    if (method === 'PATCH')  return updateNoteAction(request, env, id)
    if (method === 'DELETE') return deleteNoteAction(request, env, id)
  }

  // Items
  if (sub === '/items/reorder' && method === 'POST') return reorderItemsAction(request, env)

  return null
}

export default handle
