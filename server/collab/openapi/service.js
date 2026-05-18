import { ok, fail } from '../../system/utils/json.js'
import { readJsonBody } from '../../system/utils/body.js'
import { isAuthenticated } from '../../system/auth/index.js'
import { APPS as USER_APPS }   from '../../apps/registry.js'
import { APPS as SYSTEM_APPS } from '../../system/apps/registry.js'
import { listContexts }        from '../../system/apps/contexts/repository.js'

// 与 MCP 工具对齐 —— OpenAPI 也只暴露同样的两把:
//   GET  /api/ai/apps  → apps_list (含 contexts)
//   POST /api/ai/sql   → sql_query

export const aiAppsAction = async (request, env) => {
  let contexts = []
  if (env?.DB) {
    try {
      const r = await listContexts(env.DB)
      contexts = (r?.results || []).map((c) => ({ id: c.id, content: c.content, source_app: c.source_app, source_id: c.source_id }))
    } catch { /* non-fatal */ }
  }
  return ok({ apps: [...USER_APPS, ...SYSTEM_APPS], contexts })
}

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
