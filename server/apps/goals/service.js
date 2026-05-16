import { ok, fail } from '../../lib/utils/json.js'
import { readJsonBody } from '../../lib/utils/body.js'
import { isAuthenticated } from '../../lib/auth/index.js'
import { emitHomeEvent } from '../../lib/events.js'
import { listGoals, findGoalById, insertGoal, updateGoal, deleteGoal } from './repository.js'

const STATUSES = new Set(['active', 'done', 'gave_up'])

const serialize = (row) => row && ({
  id:         row.id,
  title:      row.title,
  target:     row.target ?? 0,
  progress:   row.progress ?? 0,
  unit:       row.unit || '',
  status:     row.status || 'active',
  note:       row.note || '',
  created_at: row.created_at,
  updated_at: row.updated_at,
})

const cleanStr = (v) => (v === undefined || v === null) ? '' : String(v).trim()
const cleanInt = (v) => {
  if (v === undefined) return undefined
  const n = Math.round(Number(v))
  return Number.isFinite(n) && n >= 0 ? n : 0
}

export const listGoalsAction = async (request, env, url) => {
  if (!(await isAuthenticated(request, env))) return fail('unauthorized', 401)
  const status = url.searchParams.get('status')
  const r = await listGoals(env.DB, { status: STATUSES.has(status) ? status : null })
  return ok({ items: (r?.results || []).map(serialize) })
}

export const createGoalAction = async (request, env) => {
  if (!(await isAuthenticated(request, env))) return fail('unauthorized', 401)
  const body = await readJsonBody(request)
  const title = cleanStr(body?.title)
  if (!title) return fail('title_required', 400)
  const row = await insertGoal(env.DB, {
    id:       crypto.randomUUID(),
    title,
    target:   cleanInt(body?.target) ?? 0,
    progress: cleanInt(body?.progress) ?? 0,
    unit:     cleanStr(body?.unit),
    status:   STATUSES.has(body?.status) ? body.status : 'active',
    note:     cleanStr(body?.note),
  })
  await emitHomeEvent(env.DB, {
    app: 'goals',
    action: 'created',
    ref_id: row.id,
    summary: `定下目标:${row.title}`,
    icon: '🎯',
  })
  return ok({ item: serialize(row) })
}

export const updateGoalAction = async (request, env, id) => {
  if (!(await isAuthenticated(request, env))) return fail('unauthorized', 401)
  const existing = await findGoalById(env.DB, id)
  if (!existing) return fail('not_found', 404)
  const body = await readJsonBody(request)
  const patch = {}
  if (body?.title !== undefined) {
    const t = cleanStr(body.title)
    if (!t) return fail('title_required', 400)
    patch.title = t
  }
  if (body?.target   !== undefined) patch.target   = cleanInt(body.target)
  if (body?.progress !== undefined) patch.progress = cleanInt(body.progress)
  if (body?.unit     !== undefined) patch.unit     = cleanStr(body.unit)
  if (body?.status   !== undefined) {
    if (!STATUSES.has(body.status)) return fail('status_invalid', 400)
    patch.status = body.status
  }
  if (body?.note     !== undefined) patch.note     = cleanStr(body.note)

  // 自动状态转换:progress >= target(且 target > 0)且状态仍是 active → done。
  const nextTarget   = patch.target   !== undefined ? patch.target   : existing.target
  const nextProgress = patch.progress !== undefined ? patch.progress : existing.progress
  const nextStatus   = patch.status   !== undefined ? patch.status   : existing.status
  if (nextStatus === 'active' && nextTarget > 0 && nextProgress >= nextTarget) {
    patch.status = 'done'
  }

  const row = await updateGoal(env.DB, id, patch)
  if (row && row.status === 'done' && existing.status !== 'done') {
    await emitHomeEvent(env.DB, {
      app: 'goals',
      action: 'completed',
      ref_id: id,
      summary: `完成目标:${existing.title}`,
      icon: '🎯',
    })
  }
  return ok({ item: serialize(row) })
}

export const deleteGoalAction = async (request, env, id) => {
  if (!(await isAuthenticated(request, env))) return fail('unauthorized', 401)
  const existing = await findGoalById(env.DB, id)
  if (!existing) return fail('not_found', 404)
  await deleteGoal(env.DB, id)
  return ok({})
}
