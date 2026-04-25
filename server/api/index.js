import { fail } from './utils/json.js'
import { buildCorsHeaders } from './utils/http.js'
import { handleUserApi } from './user.js'
import { handleRootApi } from './root.js'
import { handleNotebookApi } from './notebooks.js'
import { handleNoteApi } from './notes.js'
import { handleImageApi } from './images.js'
import { handleTokenApi } from './tokens.js'
import { handleSearchApi } from './search.js'
import { handleAiApi } from './ai.js'
import { handleItemApi } from './items.js'

export async function handleApiRoutes(request, env, url) {
  const path = url.pathname
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

    if (path.startsWith('/api/user')) {
      const r = await handleUserApi(request, env, path, method, url)
      if (r) return r
      return fail('not_found', 404)
    }

    if (path.startsWith('/api/root')) {
      const r = await handleRootApi(request, env, path, method)
      if (r) return r
      return fail('not_found', 404)
    }

    if (path.startsWith('/api/notebooks')) {
      const r = await handleNotebookApi(request, env, path, method, url)
      if (r) return r
      return fail('not_found', 404)
    }

    if (path.startsWith('/api/notes')) {
      const r = await handleNoteApi(request, env, path, method)
      if (r) return r
      return fail('not_found', 404)
    }

    if (path.startsWith('/api/images')) {
      const r = await handleImageApi(request, env, path, method)
      if (r) return r
      return fail('not_found', 404)
    }

    if (path.startsWith('/api/tokens')) {
      const r = await handleTokenApi(request, env, path, method)
      if (r) return r
      return fail('not_found', 404)
    }

    if (path.startsWith('/api/search')) {
      const r = await handleSearchApi(request, env, path, method, url)
      if (r) return r
      return fail('not_found', 404)
    }

    if (path.startsWith('/api/ai')) {
      const r = await handleAiApi(request, env, path, method)
      if (r) return r
      return fail('not_found', 404)
    }

    if (path.startsWith('/api/items')) {
      const r = await handleItemApi(request, env, path, method)
      if (r) return r
      return fail('not_found', 404)
    }

    return fail('not_found', 404)
  } catch (err) {
    console.error('api error:', err?.message, err?.stack)
    return fail(err?.message || 'internal_server_error', 500)
  }
}

export default handleApiRoutes
