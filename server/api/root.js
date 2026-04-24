import { getRootAction, updateHomeAction } from '../service/root.js'

export const handleRootApi = async (request, env, path, method) => {
  if (path === '/api/root' && method === 'GET')   return getRootAction(request, env)
  if (path === '/api/root' && method === 'PATCH') return updateHomeAction(request, env)
  return null
}
