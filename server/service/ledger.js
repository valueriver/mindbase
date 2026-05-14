import { ok, fail } from '../api/utils/json.js'
import { readJsonBody } from '../api/utils/body.js'
import { createLedgerId } from '../api/utils/id.js'
import { isAuthenticated } from '../domain/auth/index.js'
import {
  listLedger, findLedgerById, insertLedger, updateLedger, deleteLedger,
  monthlyTotals, distinctCategories,
} from '../repository/ledger.js'

const TYPES = new Set(['expense', 'income'])

// ISO YYYY-MM-DD;非法回 null。
const normDate = (v) => {
  if (typeof v !== 'string') return null
  if (!/^\d{4}-\d{2}-\d{2}$/.test(v)) return null
  const d = new Date(v + 'T00:00:00Z')
  if (isNaN(d.getTime())) return null
  return v
}

// 前端传"元"(数字或字符串),转成"分"。两位小数,不接受负数。
const normAmount = (v) => {
  const n = Number(v)
  if (!Number.isFinite(n) || n <= 0) return null
  return Math.round(n * 100)
}

const todayIso = () => {
  const d = new Date()
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

const currentMonth = () => {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

const serialize = (row) => row && ({
  id:          row.id,
  type:        row.type,
  amount:      row.amount,
  category:    row.category || '',
  note:        row.note || '',
  happened_at: row.happened_at,
  created_at:  row.created_at,
  updated_at:  row.updated_at,
})

export const listLedgerAction = async (request, env, url) => {
  if (!(await isAuthenticated(request, env))) return fail('unauthorized', 401)
  const month = url.searchParams.get('month') || null
  const type  = url.searchParams.get('type')
  const r = await listLedger(env.DB, {
    month: month && /^\d{4}-\d{2}$/.test(month) ? month : null,
    type:  TYPES.has(type) ? type : null,
    limit: Math.min(Number(url.searchParams.get('limit')) || 500, 1000),
  })
  return ok({ items: (r?.results || []).map(serialize) })
}

export const statsLedgerAction = async (request, env, url) => {
  if (!(await isAuthenticated(request, env))) return fail('unauthorized', 401)
  const month = url.searchParams.get('month') || currentMonth()
  if (!/^\d{4}-\d{2}$/.test(month)) return fail('invalid_month', 400)
  return ok(await monthlyTotals(env.DB, month))
}

export const categoriesLedgerAction = async (request, env) => {
  if (!(await isAuthenticated(request, env))) return fail('unauthorized', 401)
  const r = await distinctCategories(env.DB)
  return ok({ categories: (r?.results || []).map((x) => x.category) })
}

export const getLedgerAction = async (request, env, id) => {
  if (!(await isAuthenticated(request, env))) return fail('unauthorized', 401)
  const row = await findLedgerById(env.DB, id)
  if (!row) return fail('not_found', 404)
  return ok({ item: serialize(row) })
}

export const createLedgerAction = async (request, env) => {
  if (!(await isAuthenticated(request, env))) return fail('unauthorized', 401)
  const body = await readJsonBody(request)
  const type   = TYPES.has(body?.type) ? body.type : 'expense'
  const amount = normAmount(body?.amount)
  if (amount == null) return fail('amount_invalid', 400)
  const happenedAt = normDate(body?.happened_at) || todayIso()
  const row = await insertLedger(env.DB, {
    id: createLedgerId(),
    type,
    amount,
    category: String(body?.category || '').trim(),
    note:     String(body?.note || '').trim(),
    happenedAt,
  })
  return ok({ item: serialize(row) })
}

export const updateLedgerAction = async (request, env, id) => {
  if (!(await isAuthenticated(request, env))) return fail('unauthorized', 401)
  const body = await readJsonBody(request)
  const existing = await findLedgerById(env.DB, id)
  if (!existing) return fail('not_found', 404)

  const patch = {}
  if (body?.type !== undefined) {
    if (!TYPES.has(body.type)) return fail('type_invalid', 400)
    patch.type = body.type
  }
  if (body?.amount !== undefined) {
    const a = normAmount(body.amount)
    if (a == null) return fail('amount_invalid', 400)
    patch.amount = a
  }
  if (body?.category   !== undefined) patch.category   = String(body.category).trim()
  if (body?.note       !== undefined) patch.note       = String(body.note).trim()
  if (body?.happened_at !== undefined) {
    const d = normDate(body.happened_at)
    if (!d) return fail('happened_at_invalid', 400)
    patch.happenedAt = d
  }

  const row = await updateLedger(env.DB, id, patch)
  return ok({ item: serialize(row) })
}

export const deleteLedgerAction = async (request, env, id) => {
  if (!(await isAuthenticated(request, env))) return fail('unauthorized', 401)
  const existing = await findLedgerById(env.DB, id)
  if (!existing) return fail('not_found', 404)
  await deleteLedger(env.DB, id)
  return ok({})
}
