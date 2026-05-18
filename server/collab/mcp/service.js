// MindBase MCP (Model Context Protocol) endpoint —— JSON-RPC 2.0 over HTTP。
//
// POST /api/mcp 承载完整 MCP 协议:initialize / tools/list / tools/call / ping。
// 鉴权用 mb_ token(Authorization: Bearer mb_xxx)。
//
// 当前提供两把工具:
//   - sql_query —— 对实例的 D1 执行 SQL,读写用户数据
//   - apps_list —— 列出当前装了哪些应用及其表与子路径

import { isAuthenticated } from '../../system/auth/index.js'
import { APPS } from '../../apps/registry.js'

const PROTOCOL_VERSION = '2024-11-05'
const SERVER_INFO = { name: 'mindbase', version: '1.0.0' }

const TOOLS = [
  {
    name: 'sql_query',
    description:
      '对用户 MindBase 实例的 SQLite 执行一条 SQL 语句(末尾无分号),支持查询与写入。' +
      '应用表以 `<name>_*` 命名(如 ledger_entries),建议先用 ' +
      '`SELECT name FROM sqlite_master WHERE type=\'table\'` 查看当前有哪些表。' +
      '`conversations / messages / tokens / settings / contexts` 是系统表,涉及凭证字段时仅在用户明确要求下访问。',
    inputSchema: {
      type: 'object',
      properties: {
        stmt: { type: 'string', description: '单条 SQL 语句,末尾无分号' },
      },
      required: ['stmt'],
    },
  },
  {
    name: 'apps_list',
    description:
      '列出用户 MindBase 实例当前装了哪些应用。返回每个应用的 name / label / kind / tables / subpaths / summary,作为后续查询的索引。',
    inputSchema: {
      type: 'object',
      properties: {},
      required: [],
    },
  },
]

const json = (body, status = 200) => new Response(JSON.stringify(body), {
  status,
  headers: { 'Content-Type': 'application/json' },
})

const result = (id, data) => json({ jsonrpc: '2.0', id, result: data })
const error  = (id, code, message) => json({ jsonrpc: '2.0', id, error: { code, message } })

export const handleMcpRequest = async (request, env) => {
  if (!(await isAuthenticated(request, env))) return error(null, -32001, 'unauthorized')

  let body
  try { body = await request.json() } catch { return error(null, -32700, 'parse error') }

  // 不支持 batch(早期 MCP 客户端基本不发)
  if (Array.isArray(body)) return error(null, -32600, 'batch requests not supported')

  const { id, method, params = {} } = body || {}

  // 通知(无 id 或 id = null)—— 不返回 body
  const isNotification = id === undefined || id === null
  if (isNotification) return new Response(null, { status: 204 })

  try {
    switch (method) {
      case 'initialize':
        return result(id, {
          protocolVersion: PROTOCOL_VERSION,
          capabilities: { tools: {} },
          serverInfo: SERVER_INFO,
        })

      case 'ping':
        return result(id, {})

      case 'tools/list':
        return result(id, { tools: TOOLS })

      case 'tools/call':
        return await callTool(id, env, params)

      default:
        return error(id, -32601, `method not found: ${method}`)
    }
  } catch (err) {
    console.error('mcp error:', err?.message, err?.stack)
    return error(id, -32603, err?.message || 'internal error')
  }
}

const callTool = async (id, env, params) => {
  const name = params?.name
  const args = params?.arguments || {}

  if (name === 'sql_query') return await callSqlQuery(id, env, args.stmt)

  if (name === 'apps_list') return result(id, {
    content: [{ type: 'text', text: JSON.stringify({ apps: APPS }, null, 2) }],
  })

  return error(id, -32602, `unknown tool: ${name}`)
}

const callSqlQuery = async (id, env, stmt) => {
  if (typeof stmt !== 'string' || !stmt.trim()) {
    return error(id, -32602, 'stmt required (non-empty string)')
  }
  const trimmed = stmt.trim().replace(/;\s*$/, '')

  try {
    const r = await env.DB.prepare(trimmed).all()
    const out = {
      success: r?.success !== false,
      results: r?.results || [],
      meta:    r?.meta    || null,
    }
    return result(id, {
      content: [{ type: 'text', text: JSON.stringify(out, null, 2) }],
    })
  } catch (err) {
    return result(id, {
      content: [{ type: 'text', text: `SQL error: ${err?.message || err}` }],
      isError: true,
    })
  }
}
