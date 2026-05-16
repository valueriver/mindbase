import { ok, fail } from '../../lib/utils/json.js'
import { readJsonBody } from '../../lib/utils/body.js'
import { isAuthenticated } from '../../lib/auth/index.js'
import { listAccounts, findAccountById, insertAccount, updateAccount, deleteAccount } from './repository.js'

const serialize = (row) => row && ({
  id:         row.id,
  name:       row.name,
  url:        row.url || '',
  username:   row.username || '',
  email:      row.email || '',
  note:       row.note || '',
  created_at: row.created_at,
  updated_at: row.updated_at,
})

export const listAccountsAction = async (request, env) => {
  if (!(await isAuthenticated(request, env))) return fail('unauthorized', 401)
  const r = await listAccounts(env.DB)
  return ok({ items: (r?.results || []).map(serialize) })
}

export const createAccountAction = async (request, env) => {
  if (!(await isAuthenticated(request, env))) return fail('unauthorized', 401)
  const body = await readJsonBody(request)
  const name = String(body?.name || '').trim()
  if (!name) return fail('name_required', 400)
  const row = await insertAccount(env.DB, {
    id: crypto.randomUUID(),
    name,
    url:      String(body?.url || '').trim(),
    username: String(body?.username || '').trim(),
    email:    String(body?.email || '').trim(),
    note:     String(body?.note || '').trim(),
  })
  return ok({ item: serialize(row) })
}

export const updateAccountAction = async (request, env, id) => {
  if (!(await isAuthenticated(request, env))) return fail('unauthorized', 401)
  const body = await readJsonBody(request)
  const existing = await findAccountById(env.DB, id)
  if (!existing) return fail('not_found', 404)

  const patch = {}
  if (body?.name !== undefined) {
    const n = String(body.name).trim()
    if (!n) return fail('name_required', 400)
    patch.name = n
  }
  if (body?.url !== undefined)      patch.url = String(body.url).trim()
  if (body?.username !== undefined) patch.username = String(body.username).trim()
  if (body?.email !== undefined)    patch.email = String(body.email).trim()
  if (body?.note !== undefined)     patch.note = String(body.note).trim()

  const row = await updateAccount(env.DB, id, patch)
  return ok({ item: serialize(row) })
}

export const deleteAccountAction = async (request, env, id) => {
  if (!(await isAuthenticated(request, env))) return fail('unauthorized', 401)
  const existing = await findAccountById(env.DB, id)
  if (!existing) return fail('not_found', 404)
  await deleteAccount(env.DB, id)
  return ok({})
}
