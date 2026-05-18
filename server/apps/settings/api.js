import { getSettingsAction, updateSettingsAction } from './service.js'

const handle = async (request, env, sub, method) => {
  if (sub === '' && method === 'GET')   return getSettingsAction(request, env)
  if (sub === '' && method === 'PATCH') return updateSettingsAction(request, env)
  return null
}

export default handle
