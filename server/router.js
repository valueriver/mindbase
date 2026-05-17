import { fail } from './system/utils/json.js'
import { buildCorsHeaders } from './system/utils/http.js'

// 应用层 —— 从 registry 派生,不用手写每条
import { APP_ROUTES as USER_APP_ROUTES }   from './apps/registry.js'
import { APP_ROUTES as SYSTEM_APP_ROUTES } from './system/apps/registry.js'

const APP_ROUTES = [...USER_APP_ROUTES, ...SYSTEM_APP_ROUTES]

// 协作层(对外 AI 接入)
import { handleAiApi }  from './collab/openapi/api.js'
import { handleMcpApi } from './collab/mcp/api.js'

// 基础设施(有 URL 但不算 app)
import { handleImageApi } from './system/image/api.js'

export async function handleApiRoutes(request, env, url) {
  const path   = url.pathname
  const method = request.method

  try {
    if (method === 'OPTIONS') {
      return new Response(null, {
        status: 204,
        headers: buildCorsHeaders('Content-Type,Authorization'),
      })
    }

    if (path === '/api' || path === '/api/') {
      return Response.json({ name: 'MindBase', status: 'ok' })
    }

    // sub-path:剥掉 prefix,把 sub 交给 handler
    const stripDispatch = async (prefix, handler) => {
      if (!path.startsWith(prefix)) return undefined
      const sub = path.slice(prefix.length)
      if (sub !== '' && !sub.startsWith('/')) return undefined
      const r = await handler(request, env, sub, method, url)
      return r || fail('not_found', 404)
    }

    // full-path:整条 path 都交给 handler,自己匹配
    const fullDispatch = async (prefix, handler) => {
      if (!path.startsWith(prefix)) return undefined
      const r = await handler(request, env, path, method, url)
      return r || fail('not_found', 404)
    }

    let r

    // 应用层(单循环,新加一行 entry 自动 work)
    for (const route of APP_ROUTES) {
      const dispatch = route.style === 'sub' ? stripDispatch : fullDispatch
      r = await dispatch(route.prefix, route.handler)
      if (r !== undefined) return r
    }

    // 基础设施
    if ((r = await fullDispatch('/api/images', handleImageApi)) !== undefined) return r

    // 协作层(对外 AI)
    if ((r = await fullDispatch('/api/ai',  handleAiApi))  !== undefined) return r
    if ((r = await fullDispatch('/api/mcp', handleMcpApi)) !== undefined) return r

    return fail('not_found', 404)
  } catch (err) {
    console.error('api error:', err?.message, err?.stack)
    return fail(err?.message || 'internal_server_error', 500)
  }
}

export default handleApiRoutes
