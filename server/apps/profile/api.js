import {
  listBlocksAction,
  createBlockAction,
  updateBlockAction,
  deleteBlockAction,
  reorderBlocksAction,
} from './service.js'

const handle = async (request, env, sub, method) => {
  if (sub === '' && method === 'GET')  return listBlocksAction(request, env)
  if (sub === '' && method === 'POST') return createBlockAction(request, env)
  if (sub === '/reorder' && method === 'POST') return reorderBlocksAction(request, env)

  const m = sub.match(/^\/([0-9A-Za-z-]+)$/)
  if (m) {
    const id = m[1]
    if (method === 'PATCH')  return updateBlockAction(request, env, id)
    if (method === 'DELETE') return deleteBlockAction(request, env, id)
  }
  return null
}

export default handle
