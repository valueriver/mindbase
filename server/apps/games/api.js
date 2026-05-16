import {
  listGamesAction,
  createGameAction,
  updateGameAction,
  deleteGameAction,
} from './service.js'

const handle = async (request, env, sub, method, url) => {
  if (sub === '' && method === 'GET')  return listGamesAction(request, env, url)
  if (sub === '' && method === 'POST') return createGameAction(request, env)

  const m = sub.match(/^\/([0-9A-Za-z-]+)$/)
  if (m) {
    const id = m[1]
    if (method === 'PATCH')  return updateGameAction(request, env, id)
    if (method === 'DELETE') return deleteGameAction(request, env, id)
  }
  return null
}

export default handle
