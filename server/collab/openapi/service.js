import { ok, fail } from '../../system/utils/json.js'
import { readJsonBody } from '../../system/utils/body.js'
import { isAuthenticated } from '../../system/auth/index.js'
import { APPS as USER_APPS }   from '../../apps/registry.js'
import { APPS as SYSTEM_APPS } from '../../system/apps/registry.js'

// 与 MCP 工具对齐 —— OpenAPI 也只暴露同样的两把:
//   GET  /api/ai/apps  → apps_list
//   POST /api/ai/sql   → sql_query

export const aiAppsAction = () => ok({ apps: [...USER_APPS, ...SYSTEM_APPS] })

export const aiSqlAction = async (request, env) => {
  if (!(await isAuthenticated(request, env))) return fail('unauthorized', 401)

  const body = await readJsonBody(request) || {}
  const stmt = typeof body.stmt === 'string' ? body.stmt.trim().replace(/;\s*$/, '') : ''
  if (!stmt) return fail('stmt required (non-empty string)', 400)

  try {
    const r = await env.DB.prepare(stmt).all()
    return ok({
      results: r?.results || [],
      meta:    r?.meta    || null,
    })
  } catch (err) {
    return fail(`SQL error: ${err?.message || err}`, 400)
  }
}
