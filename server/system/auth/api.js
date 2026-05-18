import {
  authStatusAction,
  setupAuthAction,
  passwordLoginAction,
  logoutAction,
  meAction,
  changePasswordAction,
} from './service.js'

export const handleAuthApi = async (request, env, path, method, url) => {
  if (path === '/api/auth/status'   && method === 'GET')  return authStatusAction(request, env)
  if (path === '/api/auth/setup'    && method === 'POST') return setupAuthAction(request, env, url)
  if (path === '/api/auth/login'    && method === 'POST') return passwordLoginAction(request, env, url)
  if (path === '/api/auth/logout'   && method === 'POST') return logoutAction(request, env, url)
  if (path === '/api/auth/me'       && method === 'GET')  return meAction(request, env)
  if (path === '/api/auth/password' && method === 'POST') return changePasswordAction(request, env)
  return null
}
