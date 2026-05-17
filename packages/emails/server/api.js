import {
  listEmailsAction,
  createEmailAction,
  updateEmailAction,
  deleteEmailAction,
} from './service.js'

const handle = async (request, env, sub, method, url) => {
  if (sub === '' && method === 'GET')  return listEmailsAction(request, env, url)
  if (sub === '' && method === 'POST') return createEmailAction(request, env)

  const m = sub.match(/^\/([0-9A-Za-z-]+)$/)
  if (m) {
    const id = m[1]
    if (method === 'PATCH')  return updateEmailAction(request, env, id)
    if (method === 'DELETE') return deleteEmailAction(request, env, id)
  }
  return null
}

export default handle
