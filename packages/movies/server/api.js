import {
  listMoviesAction,
  createMovieAction,
  updateMovieAction,
  deleteMovieAction,
} from './service.js'

const handle = async (request, env, sub, method, url) => {
  if (sub === '' && method === 'GET')  return listMoviesAction(request, env, url)
  if (sub === '' && method === 'POST') return createMovieAction(request, env)

  const m = sub.match(/^\/([0-9A-Za-z-]+)$/)
  if (m) {
    const id = m[1]
    if (method === 'PATCH')  return updateMovieAction(request, env, id)
    if (method === 'DELETE') return deleteMovieAction(request, env, id)
  }
  return null
}

export default handle
