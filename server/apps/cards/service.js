import { ok, fail } from '../../lib/utils/json.js'
import { readJsonBody } from '../../lib/utils/body.js'
import { isAuthenticated } from '../../lib/auth/index.js'
import { listCards, findCardById, insertCard, updateCard, deleteCard } from './repository.js'

const TYPES = new Set(['debit', 'credit'])

const serialize = (row) => row && ({
  id:          row.id,
  name:        row.name,
  bank:        row.bank || '',
  card_number: row.card_number || '',
  type:        row.type,
  expire:      row.expire || '',
  note:        row.note || '',
  created_at:  row.created_at,
  updated_at:  row.updated_at,
})

export const listCardsAction = async (request, env) => {
  if (!(await isAuthenticated(request, env))) return fail('unauthorized', 401)
  const r = await listCards(env.DB)
  return ok({ items: (r?.results || []).map(serialize) })
}

export const createCardAction = async (request, env) => {
  if (!(await isAuthenticated(request, env))) return fail('unauthorized', 401)
  const body = await readJsonBody(request)
  const name = String(body?.name || '').trim()
  if (!name) return fail('name_required', 400)
  const type = TYPES.has(body?.type) ? body.type : 'debit'
  const row = await insertCard(env.DB, {
    id: crypto.randomUUID(),
    name,
    bank:        String(body?.bank || '').trim(),
    card_number: String(body?.card_number || '').replace(/\s+/g, ''),
    type,
    expire:      String(body?.expire || '').trim(),
    note:        String(body?.note || '').trim(),
  })
  return ok({ item: serialize(row) })
}

export const updateCardAction = async (request, env, id) => {
  if (!(await isAuthenticated(request, env))) return fail('unauthorized', 401)
  const body = await readJsonBody(request)
  const existing = await findCardById(env.DB, id)
  if (!existing) return fail('not_found', 404)

  const patch = {}
  if (body?.name !== undefined) {
    const n = String(body.name).trim()
    if (!n) return fail('name_required', 400)
    patch.name = n
  }
  if (body?.bank !== undefined)        patch.bank = String(body.bank).trim()
  if (body?.card_number !== undefined) patch.card_number = String(body.card_number).replace(/\s+/g, '')
  if (body?.type !== undefined) {
    if (!TYPES.has(body.type)) return fail('type_invalid', 400)
    patch.type = body.type
  }
  if (body?.expire !== undefined) patch.expire = String(body.expire).trim()
  if (body?.note !== undefined)   patch.note = String(body.note).trim()

  const row = await updateCard(env.DB, id, patch)
  return ok({ item: serialize(row) })
}

export const deleteCardAction = async (request, env, id) => {
  if (!(await isAuthenticated(request, env))) return fail('unauthorized', 401)
  const existing = await findCardById(env.DB, id)
  if (!existing) return fail('not_found', 404)
  await deleteCard(env.DB, id)
  return ok({})
}
