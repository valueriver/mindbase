import { ok, fail } from '../../lib/utils/json.js'
import { readJsonBody } from '../../lib/utils/body.js'
import { isAuthenticated } from '../../lib/auth/index.js'
import { listEmails, findEmailById, insertEmail, updateEmail, deleteEmail } from './repository.js'

const serialize = (row) => row && ({
  id:         row.id,
  address:    row.address,
  label:      row.label || '',
  provider:   row.provider || '',
  note:       row.note || '',
  created_at: row.created_at,
  updated_at: row.updated_at,
})

export const listEmailsAction = async (request, env) => {
  if (!(await isAuthenticated(request, env))) return fail('unauthorized', 401)
  const r = await listEmails(env.DB)
  return ok({ items: (r?.results || []).map(serialize) })
}

export const createEmailAction = async (request, env) => {
  if (!(await isAuthenticated(request, env))) return fail('unauthorized', 401)
  const body = await readJsonBody(request)
  const address = String(body?.address || '').trim()
  if (!address) return fail('address_required', 400)
  const row = await insertEmail(env.DB, {
    id: crypto.randomUUID(),
    address,
    label:    String(body?.label || '').trim(),
    provider: String(body?.provider || '').trim(),
    note:     String(body?.note || '').trim(),
  })
  return ok({ item: serialize(row) })
}

export const updateEmailAction = async (request, env, id) => {
  if (!(await isAuthenticated(request, env))) return fail('unauthorized', 401)
  const body = await readJsonBody(request)
  const existing = await findEmailById(env.DB, id)
  if (!existing) return fail('not_found', 404)

  const patch = {}
  if (body?.address !== undefined) {
    const a = String(body.address).trim()
    if (!a) return fail('address_required', 400)
    patch.address = a
  }
  if (body?.label !== undefined)    patch.label = String(body.label).trim()
  if (body?.provider !== undefined) patch.provider = String(body.provider).trim()
  if (body?.note !== undefined)     patch.note = String(body.note).trim()

  const row = await updateEmail(env.DB, id, patch)
  return ok({ item: serialize(row) })
}

export const deleteEmailAction = async (request, env, id) => {
  if (!(await isAuthenticated(request, env))) return fail('unauthorized', 401)
  const existing = await findEmailById(env.DB, id)
  if (!existing) return fail('not_found', 404)
  await deleteEmail(env.DB, id)
  return ok({})
}
