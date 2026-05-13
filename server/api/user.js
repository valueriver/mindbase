import {
  authStatusAction,
  setupAuthAction,
  passwordLoginAction,
  logoutAction,
  meAction,
  changePasswordAction,
} from '../service/user.js'

export const handleUserApi = async (request, env, path, method, url) => {
  if (path === '/api/user/auth/status' && method === 'GET')  return authStatusAction(request, env)
  if (path === '/api/user/auth/setup'  && method === 'POST') return setupAuthAction(request, env, url)
  if (path === '/api/user/login'       && method === 'POST') return passwordLoginAction(request, env, url)
  if (path === '/api/user/logout'      && method === 'POST') return logoutAction(request, env, url)
  if (path === '/api/user/me'          && method === 'GET')  return meAction(request, env)
  if (path === '/api/user/password'    && method === 'POST') return changePasswordAction(request, env)
  return null
}
