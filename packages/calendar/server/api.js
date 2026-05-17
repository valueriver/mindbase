import {
  listEventsAction,
  createEventAction,
  updateEventAction,
  deleteEventAction,
} from './service.js'

const handle = async (request, env, sub, method, url) => {
  if (sub === '' && method === 'GET')  return listEventsAction(request, env, url)
  if (sub === '' && method === 'POST') return createEventAction(request, env)

  const m = sub.match(/^\/([^/]+)$/)
  if (m) {
    const id = m[1]
    if (method === 'PATCH')  return updateEventAction(request, env, id)
    if (method === 'DELETE') return deleteEventAction(request, env, id)
  }
  return null
}

export default handle
