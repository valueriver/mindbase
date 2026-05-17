import { handleMcpRequest } from './service.js'

export const handleMcpApi = async (request, env, path, method) => {
  if (path === '/api/mcp' && method === 'POST') return handleMcpRequest(request, env)
  if (path === '/api/mcp' && method === 'GET')  {
    return new Response(
      'MindBase MCP endpoint.\n\n' +
      'Use POST with JSON-RPC 2.0 body.\n' +
      'Auth: Authorization: Bearer mb_xxx\n' +
      'Protocol version: 2024-11-05\n',
      { status: 200, headers: { 'Content-Type': 'text/plain; charset=utf-8' } },
    )
  }
  return null
}
