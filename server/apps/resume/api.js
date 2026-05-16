import {
  listResumeAction,
  createResumeAction,
  updateResumeAction,
  deleteResumeAction,
} from './service.js'

const handle = async (request, env, sub, method, url) => {
  if (sub === '' && method === 'GET')  return listResumeAction(request, env, url)
  if (sub === '' && method === 'POST') return createResumeAction(request, env)

  const m = sub.match(/^\/([0-9A-Za-z-]+)$/)
  if (m) {
    const id = m[1]
    if (method === 'PATCH')  return updateResumeAction(request, env, id)
    if (method === 'DELETE') return deleteResumeAction(request, env, id)
  }
  return null
}

export default handle
