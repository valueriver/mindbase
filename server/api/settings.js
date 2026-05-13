import { getSettingsAction, updateSettingsAction } from '../service/setting.js'

export const handleSettingsApi = async (request, env, path, method) => {
  if (path === '/api/settings' && method === 'GET')   return getSettingsAction(request, env)
  if (path === '/api/settings' && method === 'PATCH') return updateSettingsAction(request, env)
  return null
}
