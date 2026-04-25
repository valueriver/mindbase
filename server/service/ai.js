import { ok, fail } from '../api/utils/json.js'
import { getUserFromRequest } from '../domain/auth/index.js'

// GET /api/ai/index — 返回当前用户全部笔记本 + 笔记的"骨架",不含正文。
// AI 看到整棵树之后,再按需拿 /api/notes/:id 或 /api/search。
export const aiIndexAction = async (request, env) => {
  const user = await getUserFromRequest(request, env)
  if (!user) return fail('unauthorized', 401)

  const [nbResult, noteResult] = await Promise.all([
    env.DB.prepare(
      `SELECT id, parent_id, name, icon, sort_order, updated_at
         FROM notebooks
        WHERE user_id = ?1
        ORDER BY parent_id, sort_order, created_at`
    ).bind(user.id).all(),
    env.DB.prepare(
      `SELECT id, notebook_id, title, icon, sort_order, updated_at
         FROM notes
        WHERE user_id = ?1
        ORDER BY notebook_id, sort_order, created_at`
    ).bind(user.id).all(),
  ])

  return ok({
    notebooks: nbResult?.results   || [],
    notes:     noteResult?.results || [],
  })
}
