import {
  createNoteAction,
  deleteNoteAction,
  getNoteDetailAction,
  updateNoteAction,
} from '../service/note.js'

// /api/notes            POST -> create
// /api/notes/:id        GET    PATCH    DELETE
export const handleNoteApi = async (request, env, path, method) => {
  if (path === '/api/notes' && method === 'POST') return createNoteAction(request, env)

  const m = path.match(/^\/api\/notes\/([^/]+)$/)
  if (m) {
    const id = m[1]
    if (method === 'GET')    return getNoteDetailAction(request, env, id)
    if (method === 'PATCH')  return updateNoteAction(request, env, id)
    if (method === 'DELETE') return deleteNoteAction(request, env, id)
  }

  return null
}
