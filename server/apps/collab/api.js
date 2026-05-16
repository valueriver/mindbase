import {
  createTokenAction,
  deleteTokenAction,
  listTokensAction,
} from './service.js'

// Mounted at /api/collab. Sub-paths:
//   /tokens         GET  -> list
//   /tokens         POST -> create (auto-revokes any previous token)
//   /tokens/:id     DELETE -> revoke
const handle = async (request, env, sub, method) => {
  if (sub === '/tokens' && method === 'GET')  return listTokensAction(request, env)
  if (sub === '/tokens' && method === 'POST') return createTokenAction(request, env)

  const m = sub.match(/^\/tokens\/([^/]+)$/)
  if (m && method === 'DELETE') return deleteTokenAction(request, env, m[1])

  return null
}

export default handle
