import {
  listExhibitionsAction,
  createExhibitionAction,
  updateExhibitionAction,
  deleteExhibitionAction,
} from './service.js'

const handle = async (request, env, sub, method, url) => {
  if (sub === '' && method === 'GET')  return listExhibitionsAction(request, env, url)
  if (sub === '' && method === 'POST') return createExhibitionAction(request, env)

  const m = sub.match(/^\/([0-9A-Za-z-]+)$/)
  if (m) {
    const id = m[1]
    if (method === 'PATCH')  return updateExhibitionAction(request, env, id)
    if (method === 'DELETE') return deleteExhibitionAction(request, env, id)
  }
  return null
}

export default handle
