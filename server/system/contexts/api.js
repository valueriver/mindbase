import {
  listContextsAction, createContextAction, updateContextAction, deleteContextAction,
  pinContextAction, unpinContextAction,
} from './service.js'

export const handleContextsApi = async (request, env, sub, method) => {
  if (sub === ''       && method === 'GET')  return listContextsAction(request, env)
  if (sub === ''       && method === 'POST') return createContextAction(request, env)
  if (sub === '/pin'   && method === 'POST') return pinContextAction(request, env)
  if (sub === '/unpin' && method === 'POST') return unpinContextAction(request, env)

  const m = sub.match(/^\/([\w-]+)$/)
  if (m) {
    const id = m[1]
    if (method === 'PATCH')  return updateContextAction(request, env, id)
    if (method === 'DELETE') return deleteContextAction(request, env, id)
  }
  return null
}
