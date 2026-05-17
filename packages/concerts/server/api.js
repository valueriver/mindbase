import {
  listConcertsAction,
  createConcertAction,
  updateConcertAction,
  deleteConcertAction,
} from './service.js'

const handle = async (request, env, sub, method, url) => {
  if (sub === '' && method === 'GET')  return listConcertsAction(request, env, url)
  if (sub === '' && method === 'POST') return createConcertAction(request, env)

  const m = sub.match(/^\/([0-9A-Za-z-]+)$/)
  if (m) {
    const id = m[1]
    if (method === 'PATCH')  return updateConcertAction(request, env, id)
    if (method === 'DELETE') return deleteConcertAction(request, env, id)
  }
  return null
}

export default handle
