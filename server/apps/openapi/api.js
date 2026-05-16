import { aiIndexAction, aiAppsAction } from './service.js'
import { openapiAction } from './spec.js'

export const handleAiApi = async (request, env, path, method) => {
  if (path === '/api/ai/apps'         && method === 'GET') return aiAppsAction()
  if (path === '/api/ai/index'        && method === 'GET') return aiIndexAction(request, env)
  if (path === '/api/ai/openapi.json' && method === 'GET') return openapiAction(request)
  return null
}
