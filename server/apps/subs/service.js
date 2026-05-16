import { ok, fail } from '../../lib/utils/json.js'
import { readJsonBody } from '../../lib/utils/body.js'
import { isAuthenticated } from '../../lib/auth/index.js'
import { listSubs, findSubById, insertSub, updateSub, deleteSub } from './repository.js'

const CYCLES = new Set(['monthly', 'yearly'])

const normDate = (v) => {
  if (v === null || v === '') return null
  if (typeof v !== 'string') return undefined
  return /^\d{4}-\d{2}-\d{2}$/.test(v) ? v : undefined
}

// 前端传"元",转"分"
const normAmount = (v) => {
  const n = Number(v)
  if (!Number.isFinite(n) || n < 0) return null
  return Math.round(n * 100)
}

const serialize = (row) => row && ({
  id:          row.id,
  name:        row.name,
  amount:      row.amount,
  cycle:       row.cycle,
  next_charge: row.next_charge,
  note:        row.note || '',
  created_at:  row.created_at,
  updated_at:  row.updated_at,
})

export const listSubsAction = async (request, env) => {
  if (!(await isAuthenticated(request, env))) return fail('unauthorized', 401)
  const r = await listSubs(env.DB)
  return ok({ items: (r?.results || []).map(serialize) })
}

export const createSubAction = async (request, env) => {
  if (!(await isAuthenticated(request, env))) return fail('unauthorized', 401)
  const body = await readJsonBody(request)
  const name = String(body?.name || '').trim()
  if (!name) return fail('name_required', 400)
  const amount = normAmount(body?.amount ?? 0)
  if (amount == null) return fail('amount_invalid', 400)
  const cycle = CYCLES.has(body?.cycle) ? body.cycle : 'monthly'
  const nextCharge = normDate(body?.next_charge)
  if (nextCharge === undefined) return fail('next_charge_invalid', 400)
  const row = await insertSub(env.DB, {
    id: crypto.randomUUID(),
    name, amount, cycle,
    nextCharge,
    note: String(body?.note || '').trim(),
  })
  return ok({ item: serialize(row) })
}

export const updateSubAction = async (request, env, id) => {
  if (!(await isAuthenticated(request, env))) return fail('unauthorized', 401)
  const body = await readJsonBody(request)
  const existing = await findSubById(env.DB, id)
  if (!existing) return fail('not_found', 404)

  const patch = {}
  if (body?.name !== undefined) {
    const n = String(body.name).trim()
    if (!n) return fail('name_required', 400)
    patch.name = n
  }
  if (body?.amount !== undefined) {
    const a = normAmount(body.amount)
    if (a == null) return fail('amount_invalid', 400)
    patch.amount = a
  }
  if (body?.cycle !== undefined) {
    if (!CYCLES.has(body.cycle)) return fail('cycle_invalid', 400)
    patch.cycle = body.cycle
  }
  if (body?.next_charge !== undefined) {
    const d = normDate(body.next_charge)
    if (d === undefined) return fail('next_charge_invalid', 400)
    patch.nextCharge = d
  }
  if (body?.note !== undefined) patch.note = String(body.note).trim()

  const row = await updateSub(env.DB, id, patch)
  return ok({ item: serialize(row) })
}

export const deleteSubAction = async (request, env, id) => {
  if (!(await isAuthenticated(request, env))) return fail('unauthorized', 401)
  const existing = await findSubById(env.DB, id)
  if (!existing) return fail('not_found', 404)
  await deleteSub(env.DB, id)
  return ok({})
}
