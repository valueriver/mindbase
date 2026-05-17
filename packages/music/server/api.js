import {
  listTracksAction,
  createTrackAction,
  updateTrackAction,
  deleteTrackAction,
} from './service.js'

const handle = async (request, env, sub, method, url) => {
  if (sub === '' && method === 'GET')  return listTracksAction(request, env, url)
  if (sub === '' && method === 'POST') return createTrackAction(request, env)

  const m = sub.match(/^\/([0-9A-Za-z-]+)$/)
  if (m) {
    const id = m[1]
    if (method === 'PATCH')  return updateTrackAction(request, env, id)
    if (method === 'DELETE') return deleteTrackAction(request, env, id)
  }
  return null
}

export default handle
