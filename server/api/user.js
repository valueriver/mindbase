import { passwordLoginAction, logoutAction, meAction } from '../service/user.js'

export const handleUserApi = async (request, env, path, method, url) => {
  if (path === '/api/user/login'  && method === 'POST') return passwordLoginAction(request, env, url)
  if (path === '/api/user/logout' && method === 'POST') return logoutAction(request, env, url)
  if (path === '/api/user/me'     && method === 'GET')  return meAction(request, env)
  return null
}
