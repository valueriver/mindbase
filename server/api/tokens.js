import {
  createTokenAction,
  deleteTokenAction,
  listTokensAction,
} from '../service/token.js'

// /api/tokens         GET  -> list
// /api/tokens         POST -> create (auto-revokes any previous token)
// /api/tokens/:id     DELETE -> revoke
export const handleTokenApi = async (request, env, path, method) => {
  if (path === '/api/tokens' && method === 'GET')  return listTokensAction(request, env)
  if (path === '/api/tokens' && method === 'POST') return createTokenAction(request, env)

  const m = path.match(/^\/api\/tokens\/([^/]+)$/)
  if (m && method === 'DELETE') return deleteTokenAction(request, env, m[1])

  return null
}
