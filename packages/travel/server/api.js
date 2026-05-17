import {
  listTripsAction,
  createTripAction,
  updateTripAction,
  deleteTripAction,
} from './service.js'

const handle = async (request, env, sub, method, url) => {
  if (sub === '' && method === 'GET')  return listTripsAction(request, env, url)
  if (sub === '' && method === 'POST') return createTripAction(request, env)

  const m = sub.match(/^\/([0-9A-Za-z-]+)$/)
  if (m) {
    const id = m[1]
    if (method === 'PATCH')  return updateTripAction(request, env, id)
    if (method === 'DELETE') return deleteTripAction(request, env, id)
  }
  return null
}

export default handle
