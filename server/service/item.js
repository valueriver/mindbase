import { readJsonBody } from '../api/utils/body.js'
import { ok, fail } from '../api/utils/json.js'
import { isAuthenticated } from '../domain/auth/index.js'

export const reorderItemsAction = async (request, env) => {
  if (!(await isAuthenticated(request, env))) return fail('unauthorized', 401)

  const body = await readJsonBody(request)
  if (!body || !Array.isArray(body.items)) return fail('items_required', 400)
  if (body.items.length > 1000) return fail('too_many_items', 400)

  const parentId = body.parent_id ? String(body.parent_id) : null

  const stmts = []
  for (let i = 0; i < body.items.length; i++) {
    const it = body.items[i]
    const id = String(it?.id || '')
    const kind = String(it?.kind || '')
    if (!id || (kind !== 'notebook' && kind !== 'note')) continue

    if (kind === 'notebook') {
      stmts.push(env.DB.prepare(
        `UPDATE notebooks
            SET sort_order = ?1, updated_at = datetime('now')
          WHERE id = ?2
            AND (parent_id IS ?3 OR parent_id = ?3)`
      ).bind(i, id, parentId))
    } else {
      stmts.push(env.DB.prepare(
        `UPDATE notes
            SET sort_order = ?1, updated_at = datetime('now')
          WHERE id = ?2
            AND (notebook_id IS ?3 OR notebook_id = ?3)`
      ).bind(i, id, parentId))
    }
  }

  if (stmts.length === 0) return ok({ updated: 0 })

  await env.DB.batch(stmts)
  return ok({ updated: stmts.length })
}
