import { ok, fail } from '../../lib/utils/json.js'
import { readJsonBody } from '../../lib/utils/body.js'
import { isAuthenticated } from '../../lib/auth/index.js'
import { listAssets, findAssetById, insertAsset, updateAsset, deleteAsset } from './repository.js'

const KINDS = new Set(['asset', 'liability'])

// 前端传"元",转"分"
const normAmount = (v) => {
  const n = Number(v)
  if (!Number.isFinite(n) || n < 0) return null
  return Math.round(n * 100)
}

const serialize = (row) => row && ({
  id:         row.id,
  name:       row.name,
  kind:       row.kind,
  category:   row.category || '',
  amount:     row.amount,
  note:       row.note || '',
  created_at: row.created_at,
  updated_at: row.updated_at,
})

export const listAssetsAction = async (request, env) => {
  if (!(await isAuthenticated(request, env))) return fail('unauthorized', 401)
  const r = await listAssets(env.DB)
  return ok({ items: (r?.results || []).map(serialize) })
}

export const createAssetAction = async (request, env) => {
  if (!(await isAuthenticated(request, env))) return fail('unauthorized', 401)
  const body = await readJsonBody(request)
  const name = String(body?.name || '').trim()
  if (!name) return fail('name_required', 400)
  const kind = KINDS.has(body?.kind) ? body.kind : 'asset'
  const amount = normAmount(body?.amount ?? 0)
  if (amount == null) return fail('amount_invalid', 400)
  const row = await insertAsset(env.DB, {
    id: crypto.randomUUID(),
    name, kind,
    category: String(body?.category || '').trim(),
    amount,
    note:     String(body?.note || '').trim(),
  })
  return ok({ item: serialize(row) })
}

export const updateAssetAction = async (request, env, id) => {
  if (!(await isAuthenticated(request, env))) return fail('unauthorized', 401)
  const body = await readJsonBody(request)
  const existing = await findAssetById(env.DB, id)
  if (!existing) return fail('not_found', 404)

  const patch = {}
  if (body?.name !== undefined) {
    const n = String(body.name).trim()
    if (!n) return fail('name_required', 400)
    patch.name = n
  }
  if (body?.kind !== undefined) {
    if (!KINDS.has(body.kind)) return fail('kind_invalid', 400)
    patch.kind = body.kind
  }
  if (body?.category !== undefined) patch.category = String(body.category).trim()
  if (body?.amount !== undefined) {
    const a = normAmount(body.amount)
    if (a == null) return fail('amount_invalid', 400)
    patch.amount = a
  }
  if (body?.note !== undefined) patch.note = String(body.note).trim()

  const row = await updateAsset(env.DB, id, patch)
  return ok({ item: serialize(row) })
}

export const deleteAssetAction = async (request, env, id) => {
  if (!(await isAuthenticated(request, env))) return fail('unauthorized', 401)
  const existing = await findAssetById(env.DB, id)
  if (!existing) return fail('not_found', 404)
  await deleteAsset(env.DB, id)
  return ok({})
}
