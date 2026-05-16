import {
  listPhotosAction,
  createPhotoAction,
  updatePhotoAction,
  deletePhotoAction,
} from './service.js'

const handle = async (request, env, sub, method, url) => {
  if (sub === '' && method === 'GET')  return listPhotosAction(request, env, url)
  if (sub === '' && method === 'POST') return createPhotoAction(request, env)

  const m = sub.match(/^\/([0-9A-Za-z-]+)$/)
  if (m) {
    const id = m[1]
    if (method === 'PATCH')  return updatePhotoAction(request, env, id)
    if (method === 'DELETE') return deletePhotoAction(request, env, id)
  }
  return null
}

export default handle
