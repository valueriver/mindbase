import {
  listCardsAction,
  createCardAction,
  updateCardAction,
  deleteCardAction,
} from './service.js'

const handle = async (request, env, sub, method, url) => {
  if (sub === '' && method === 'GET')  return listCardsAction(request, env, url)
  if (sub === '' && method === 'POST') return createCardAction(request, env)

  const m = sub.match(/^\/([0-9A-Za-z-]+)$/)
  if (m) {
    const id = m[1]
    if (method === 'PATCH')  return updateCardAction(request, env, id)
    if (method === 'DELETE') return deleteCardAction(request, env, id)
  }
  return null
}

export default handle
