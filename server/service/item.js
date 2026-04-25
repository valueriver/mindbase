import { readJsonBody } from '../api/utils/body.js'
import { ok, fail } from '../api/utils/json.js'
import { getUserFromRequest } from '../domain/auth/index.js'

// 单个 parent 下,把笔记本和笔记按混合顺序统一编号 sort_order = 0..N-1
// 用 D1 的 batch 在一个事务里把两表写完。
//
// body: { parent_id: string|null, items: [{kind:'notebook'|'note', id:string}, ...] }
export const reorderItemsAction = async (request, env) => {
  const user = await getUserFromRequest(request, env)
  if (!user) return fail('unauthorized', 401)

  const body = await readJsonBody(request)
  if (!body || !Array.isArray(body.items)) return fail('items_required', 400)

  // 上限简单挡一下,防呆
  if (body.items.length > 1000) return fail('too_many_items', 400)

  const parentId = body.parent_id ? String(body.parent_id) : null

  const stmts = []
  for (let i = 0; i < body.items.length; i++) {
    const it = body.items[i]
    const id = String(it?.id || '')
    const kind = String(it?.kind || '')
    if (!id || (kind !== 'notebook' && kind !== 'note')) continue

    if (kind === 'notebook') {
      // 笔记本:同时校验 parent_id 一致(防止跨 parent 误传)
      stmts.push(env.DB.prepare(
        `UPDATE notebooks
            SET sort_order = ?1, updated_at = datetime('now')
          WHERE id = ?2 AND user_id = ?3
            AND (parent_id IS ?4 OR parent_id = ?4)`
      ).bind(i, id, user.id, parentId))
    } else {
      stmts.push(env.DB.prepare(
        `UPDATE notes
            SET sort_order = ?1, updated_at = datetime('now')
          WHERE id = ?2 AND user_id = ?3
            AND (notebook_id IS ?4 OR notebook_id = ?4)`
      ).bind(i, id, user.id, parentId))
    }
  }

  if (stmts.length === 0) return ok({ updated: 0 })

  await env.DB.batch(stmts)
  return ok({ updated: stmts.length })
}
