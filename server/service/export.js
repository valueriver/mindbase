import { fail } from '../api/utils/json.js'
import { buildCorsHeaders } from '../api/utils/http.js'
import { getUserFromRequest } from '../domain/auth/index.js'
import { findUserById } from '../repository/user.js'

// GET /api/export — 把当前用户所有的笔记本 + 笔记导出成一个 JSON 文件
export const exportAction = async (request, env) => {
  const user = await getUserFromRequest(request, env)
  if (!user) return fail('unauthorized', 401)

  const [dbUser, notebooksResult, notesResult] = await Promise.all([
    findUserById(env.DB, user.id),
    env.DB.prepare(
      `SELECT id, parent_id, name, icon, cover, sort_order, created_at, updated_at
         FROM notebooks
        WHERE user_id = ?1
        ORDER BY parent_id, sort_order, created_at`
    ).bind(user.id).all(),
    env.DB.prepare(
      `SELECT id, notebook_id, title, content, icon, cover, sort_order, created_at, updated_at
         FROM notes
        WHERE user_id = ?1
        ORDER BY notebook_id, sort_order, created_at`
    ).bind(user.id).all(),
  ])

  const payload = {
    exported_at: new Date().toISOString(),
    version:     1,
    user: dbUser ? {
      email:      dbUser.email,
      name:       dbUser.name,
      avatar_url: dbUser.avatar_url,
      home_name:  dbUser.home_name,
      home_icon:  dbUser.home_icon,
      home_cover: dbUser.home_cover,
    } : null,
    notebooks: notebooksResult?.results || [],
    notes:     notesResult?.results     || [],
  }

  const body = JSON.stringify(payload, null, 2)
  const stamp = new Date().toISOString().slice(0, 10)
  return new Response(body, {
    status: 200,
    headers: {
      'Content-Type':        'application/json; charset=utf-8',
      'Content-Disposition': `attachment; filename="mindbase-export-${stamp}.json"`,
      ...buildCorsHeaders('Content-Type'),
    },
  })
}
