import {
  listAccountsAction,
  createAccountAction,
  updateAccountAction,
  deleteAccountAction,
} from './service.js'

const handle = async (request, env, sub, method, url) => {
  if (sub === '' && method === 'GET')  return listAccountsAction(request, env, url)
  if (sub === '' && method === 'POST') return createAccountAction(request, env)

  const m = sub.match(/^\/([0-9A-Za-z-]+)$/)
  if (m) {
    const id = m[1]
    if (method === 'PATCH')  return updateAccountAction(request, env, id)
    if (method === 'DELETE') return deleteAccountAction(request, env, id)
  }
  return null
}

export default handle
