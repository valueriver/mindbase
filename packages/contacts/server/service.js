import { ok, fail } from '../../system/utils/json.js'
import { readJsonBody } from '../../system/utils/body.js'
import { isAuthenticated } from '../../system/auth/index.js'
import {
  listContacts,
  findContactById,
  insertContact,
  updateContact,
  deleteContact,
} from './repository.js'
import { parseVCards } from './vcard.js'

const serialize = (row) => row && ({
  id:         row.id,
  name:       row.name,
  nickname:   row.nickname || '',
  phone:      row.phone || '',
  email:      row.email || '',
  company:    row.company || '',
  title:      row.title || '',
  address:    row.address || '',
  birthday:   row.birthday || null,
  note:       row.note || '',
  avatar:     row.avatar || null,
  created_at: row.created_at,
  updated_at: row.updated_at,
})

const cleanStr  = (v) => (v === undefined || v === null) ? null : String(v).trim()
const cleanDate = (v) => {
  if (v === null) return null
  if (v === undefined || v === '') return null
  const s = String(v).trim()
  return /^\d{4}-\d{2}-\d{2}$/.test(s) ? s : null
}

export const listContactsAction = async (request, env) => {
  if (!(await isAuthenticated(request, env))) return fail('unauthorized', 401)
  const r = await listContacts(env.DB)
  return ok({ items: (r?.results || []).map(serialize) })
}

export const createContactAction = async (request, env) => {
  if (!(await isAuthenticated(request, env))) return fail('unauthorized', 401)
  const body = await readJsonBody(request)
  const name = cleanStr(body?.name)
  if (!name) return fail('name_required', 400)
  const row = await insertContact(env.DB, {
    id:       crypto.randomUUID(),
    name,
    nickname: cleanStr(body?.nickname) || '',
    phone:    cleanStr(body?.phone) || '',
    email:    cleanStr(body?.email) || '',
    company:  cleanStr(body?.company) || '',
    title:    cleanStr(body?.title) || '',
    address:  cleanStr(body?.address) || '',
    birthday: cleanDate(body?.birthday),
    note:     cleanStr(body?.note) || '',
    avatar:   cleanStr(body?.avatar),
  })
  return ok({ item: serialize(row) })
}

export const updateContactAction = async (request, env, id) => {
  if (!(await isAuthenticated(request, env))) return fail('unauthorized', 401)
  const existing = await findContactById(env.DB, id)
  if (!existing) return fail('not_found', 404)
  const body = await readJsonBody(request)

  let name
  if (body?.name !== undefined) {
    name = cleanStr(body.name)
    if (!name) return fail('name_required', 400)
  }

  const patch = { name }
  for (const k of ['nickname', 'phone', 'email', 'company', 'title', 'address', 'note']) {
    if (body?.[k] !== undefined) patch[k] = cleanStr(body[k]) ?? ''
  }
  if (body?.birthday !== undefined) {
    patch.birthday = body.birthday === null ? null : cleanDate(body.birthday)
  }
  if (body?.avatar !== undefined) {
    patch.avatar = body.avatar === null ? null : cleanStr(body.avatar)
  }
  const row = await updateContact(env.DB, id, patch)
  return ok({ item: serialize(row) })
}

export const deleteContactAction = async (request, env, id) => {
  if (!(await isAuthenticated(request, env))) return fail('unauthorized', 401)
  const existing = await findContactById(env.DB, id)
  if (!existing) return fail('not_found', 404)
  await deleteContact(env.DB, id)
  return ok({})
}

export const importContactsAction = async (request, env) => {
  if (!(await isAuthenticated(request, env))) return fail('unauthorized', 401)

  // 支持 text/plain(直接原文 .vcf)和 application/json { vcard }
  const ct = request.headers.get('Content-Type') || ''
  let text = ''
  if (ct.includes('application/json')) {
    const body = await readJsonBody(request)
    text = String(body?.vcard || '')
  } else {
    try { text = await request.text() } catch { text = '' }
  }
  if (!text.trim()) return fail('empty_vcard', 400)

  let cards
  try {
    cards = parseVCards(text)
  } catch {
    return fail('parse_failed', 400)
  }
  if (!cards.length) return fail('no_valid_contact', 400)

  // 身份指纹:优先 email,其次 phone,最后 name(都 lower + trim)
  const fp = (c) => {
    const e = String(c.email || '').trim().toLowerCase()
    if (e) return `e:${e}`
    const p = String(c.phone || '').replace(/[\s\-+()]/g, '')
    if (p) return `p:${p}`
    return `n:${String(c.name || '').trim().toLowerCase()}`
  }

  // 文件内部去重(同身份只留最后一次)
  const incoming = new Map()
  for (const c of cards) incoming.set(fp(c), c)

  // 库内现有指纹
  const existRes = await env.DB.prepare(
    `SELECT id, name, nickname, phone, email, company, title, address, birthday, note FROM app_contacts_people`
  ).all()
  const existing = new Map()
  for (const e of existRes?.results || []) existing.set(fp(e), e)

  let inserted = 0, updated = 0, skipped = 0
  for (const [key, c] of incoming) {
    const ex = existing.get(key)
    if (!ex) {
      await insertContact(env.DB, {
        id:       crypto.randomUUID(),
        name:     c.name,
        nickname: c.nickname || '',
        phone:    c.phone || '',
        email:    c.email || '',
        company:  c.company || '',
        title:    c.title || '',
        address:  c.address || '',
        birthday: c.birthday || null,
        note:     c.note || '',
        avatar:   null,
      })
      inserted++
    } else {
      // 同身份:把新数据里非空的字段补/覆盖到已有条目;若完全无新信息则 skip
      const patch = {}
      const maybe = (k, v) => { const s = String(v || '').trim(); if (s && s !== (ex[k] || '')) patch[k] = s }
      maybe('nickname', c.nickname); maybe('phone', c.phone); maybe('email', c.email)
      maybe('company',  c.company);  maybe('title', c.title); maybe('address', c.address)
      maybe('note',     c.note)
      if (c.birthday && c.birthday !== ex.birthday) patch.birthday = c.birthday
      if (Object.keys(patch).length === 0) {
        skipped++
      } else {
        await updateContact(env.DB, ex.id, patch)
        updated++
      }
    }
  }
  return ok({ inserted, updated, skipped })
}
