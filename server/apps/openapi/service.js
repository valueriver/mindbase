import { ok, fail } from '../../lib/utils/json.js'
import { isAuthenticated } from '../../lib/auth/index.js'

// GET /api/ai/index — 返回全部笔记本 + 笔记的"骨架",不含正文。
export const aiIndexAction = async (request, env) => {
  if (!(await isAuthenticated(request, env))) return fail('unauthorized', 401)

  const [nbResult, noteResult] = await Promise.all([
    env.DB.prepare(
      `SELECT id, parent_id, name, icon, sort_order, updated_at
         FROM app_notes_notebooks
        ORDER BY parent_id, sort_order, created_at`
    ).all(),
    env.DB.prepare(
      `SELECT id, notebook_id, title, icon, sort_order, updated_at
         FROM app_notes_pages
        ORDER BY notebook_id, sort_order, created_at`
    ).all(),
  ])

  return ok({
    notebooks: nbResult?.results   || [],
    notes:     noteResult?.results || [],
  })
}
