import { ok, fail } from '../../system/utils/json.js'
import { readJsonBody } from '../../system/utils/body.js'
import { isAuthenticated } from '../../system/auth/index.js'
import { listVault, findVaultById, insertVault, updateVault, deleteVault } from './repository.js'
import { parseVaultCSV } from './csv.js'

const serialize = (row) => row && ({
  id:         row.id,
  name:       row.name,
  url:        row.url || '',
  username:   row.username || '',
  password:   row.password || '',
  note:       row.note || '',
  created_at: row.created_at,
  updated_at: row.updated_at,
})

export const listVaultAction = async (request, env) => {
  if (!(await isAuthenticated(request, env))) return fail('unauthorized', 401)
  const r = await listVault(env.DB)
  return ok({ items: (r?.results || []).map(serialize) })
}

export const createVaultAction = async (request, env) => {
  if (!(await isAuthenticated(request, env))) return fail('unauthorized', 401)
  const body = await readJsonBody(request)
  const name = String(body?.name || '').trim()
  if (!name) return fail('name_required', 400)
  const row = await insertVault(env.DB, {
    id: crypto.randomUUID(),
    name,
    url:      String(body?.url || '').trim(),
    username: String(body?.username || ''),
    password: String(body?.password || ''),
    note:     String(body?.note || '').trim(),
  })
  return ok({ item: serialize(row) })
}

export const updateVaultAction = async (request, env, id) => {
  if (!(await isAuthenticated(request, env))) return fail('unauthorized', 401)
  const body = await readJsonBody(request)
  const existing = await findVaultById(env.DB, id)
  if (!existing) return fail('not_found', 404)

  const patch = {}
  if (body?.name !== undefined) {
    const n = String(body.name).trim()
    if (!n) return fail('name_required', 400)
    patch.name = n
  }
  if (body?.url      !== undefined) patch.url      = String(body.url).trim()
  if (body?.username !== undefined) patch.username = String(body.username)
  if (body?.password !== undefined) patch.password = String(body.password)
  if (body?.note     !== undefined) patch.note     = String(body.note).trim()

  const row = await updateVault(env.DB, id, patch)
  return ok({ item: serialize(row) })
}

export const deleteVaultAction = async (request, env, id) => {
  if (!(await isAuthenticated(request, env))) return fail('unauthorized', 401)
  const existing = await findVaultById(env.DB, id)
  if (!existing) return fail('not_found', 404)
  await deleteVault(env.DB, id)
  return ok({})
}

export const importVaultAction = async (request, env) => {
  if (!(await isAuthenticated(request, env))) return fail('unauthorized', 401)
  const ct = request.headers.get('Content-Type') || ''
  let text = ''
  if (ct.includes('application/json')) {
    const body = await readJsonBody(request)
    text = String(body?.csv || '')
  } else {
    try { text = await request.text() } catch { text = '' }
  }
  if (!text.trim()) return fail('empty_csv', 400)

  let rows
  try {
    rows = parseVaultCSV(text)
  } catch {
    return fail('parse_failed', 400)
  }
  if (!rows.length) return fail('no_valid_row', 400)

  // 文件内部先去重:同一 (name+username) 出现多次保留最后一次
  const fp = (name, user) => `${String(name||'').trim().toLowerCase()}\t${String(user||'').trim().toLowerCase()}`
  const incoming = new Map()
  for (const r of rows) incoming.set(fp(r.name, r.username), r)

  // 拉现有库,按指纹建索引
  const existRes = await env.DB.prepare(
    `SELECT id, name, url, username, password, note FROM app_vault_entries`
  ).all()
  const existing = new Map()
  for (const e of existRes?.results || []) existing.set(fp(e.name, e.username), e)

  let inserted = 0, updated = 0, skipped = 0
  for (const [key, r] of incoming) {
    const ex = existing.get(key)
    if (!ex) {
      await insertVault(env.DB, {
        id:       crypto.randomUUID(),
        name:     r.name,
        url:      r.url      || '',
        username: r.username || '',
        password: r.password || '',
        note:     r.note     || '',
      })
      inserted++
    } else if ((ex.password || '') === (r.password || '')) {
      skipped++   // 完全相同
    } else {
      // 同身份不同密码 → 更新(url/note 只在新值非空时覆盖,避免误清空)
      const patch = { password: r.password || '' }
      if (r.url  && r.url  !== ex.url)  patch.url  = r.url
      if (r.note && r.note !== ex.note) patch.note = r.note
      await updateVault(env.DB, ex.id, patch)
      updated++
    }
  }
  return ok({ inserted, updated, skipped })
}
