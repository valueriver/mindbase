import {
  listLlmsAction,
  createLlmAction,
  updateLlmAction,
  deleteLlmAction,
} from './service.js'

const handle = async (request, env, sub, method, url) => {
  if (sub === '' && method === 'GET')  return listLlmsAction(request, env, url)
  if (sub === '' && method === 'POST') return createLlmAction(request, env)

  const m = sub.match(/^\/([\w-]+)$/)
  if (m) {
    const id = m[1]
    if (method === 'PATCH')  return updateLlmAction(request, env, id)
    if (method === 'DELETE') return deleteLlmAction(request, env, id)
  }
  return null
}

export default handle
