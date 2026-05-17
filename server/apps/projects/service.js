import { ok, fail } from '../../system/utils/json.js'
import { readJsonBody } from '../../system/utils/body.js'
import { isAuthenticated } from '../../system/auth/index.js'
import { listProjects, findProjectById, insertProject, updateProject, deleteProject } from './repository.js'

const STATUSES = new Set(['active', 'paused', 'done', 'abandoned'])

const serialize = (row) => row && ({
  id:         row.id,
  title:      row.title,
  status:     row.status,
  note:       row.note || '',
  created_at: row.created_at,
  updated_at: row.updated_at,
})

export const listProjectsAction = async (request, env, url) => {
  if (!(await isAuthenticated(request, env))) return fail('unauthorized', 401)
  const status = url.searchParams.get('status')
  const r = await listProjects(env.DB, { status: STATUSES.has(status) ? status : null })
  return ok({ items: (r?.results || []).map(serialize) })
}

export const createProjectAction = async (request, env) => {
  if (!(await isAuthenticated(request, env))) return fail('unauthorized', 401)
  const body = await readJsonBody(request)
  const title = String(body?.title || '').trim()
  if (!title) return fail('title_required', 400)
  const status = STATUSES.has(body?.status) ? body.status : 'active'
  const row = await insertProject(env.DB, {
    id: crypto.randomUUID(),
    title, status,
    note: String(body?.note || '').trim(),
  })
  return ok({ item: serialize(row) })
}

export const updateProjectAction = async (request, env, id) => {
  if (!(await isAuthenticated(request, env))) return fail('unauthorized', 401)
  const body = await readJsonBody(request)
  const existing = await findProjectById(env.DB, id)
  if (!existing) return fail('not_found', 404)

  const patch = {}
  if (body?.title !== undefined) {
    const t = String(body.title).trim()
    if (!t) return fail('title_required', 400)
    patch.title = t
  }
  if (body?.status !== undefined) {
    if (!STATUSES.has(body.status)) return fail('status_invalid', 400)
    patch.status = body.status
  }
  if (body?.note !== undefined) patch.note = String(body.note).trim()

  const row = await updateProject(env.DB, id, patch)
  return ok({ item: serialize(row) })
}

export const deleteProjectAction = async (request, env, id) => {
  if (!(await isAuthenticated(request, env))) return fail('unauthorized', 401)
  const existing = await findProjectById(env.DB, id)
  if (!existing) return fail('not_found', 404)
  await deleteProject(env.DB, id)
  return ok({})
}
