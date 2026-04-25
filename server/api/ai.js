import { aiIndexAction } from '../service/ai.js'
import { openapiAction } from '../service/openapi.js'

export const handleAiApi = async (request, env, path, method) => {
  if (path === '/api/ai/index'        && method === 'GET') return aiIndexAction(request, env)
  if (path === '/api/ai/openapi.json' && method === 'GET') return openapiAction(request)
  return null
}
