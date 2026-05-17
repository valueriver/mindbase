import { ok, fail } from '../../system/utils/json.js'
import { readJsonBody } from '../../system/utils/body.js'
import { isAuthenticated } from '../../system/auth/index.js'
import {
  listMedicalRecords,
  findMedicalRecordById,
  insertMedicalRecord,
  updateMedicalRecord,
  deleteMedicalRecord,
} from './repository.js'

const serialize = (row) => row && ({
  id:           row.id,
  date:         row.date,
  hospital:     row.hospital || '',
  doctor:       row.doctor || '',
  diagnosis:    row.diagnosis || '',
  prescription: row.prescription || '',
  note:         row.note || '',
  cover:        row.cover || null,
  created_at:   row.created_at,
  updated_at:   row.updated_at,
})

const cleanStr = (v) => (v === undefined || v === null) ? '' : String(v).trim()
const cleanOpt = (v) => {
  if (v === undefined) return undefined
  if (v === null) return null
  const s = String(v).trim()
  return s ? s : null
}
const cleanDate = (v) => {
  const s = cleanStr(v)
  return /^\d{4}-\d{2}-\d{2}$/.test(s) ? s : null
}

export const listMedicalAction = async (request, env, url) => {
  if (!(await isAuthenticated(request, env))) return fail('unauthorized', 401)
  const limit  = Math.min(Number(url.searchParams.get('limit'))  || 200, 500)
  const offset = Math.max(Number(url.searchParams.get('offset')) || 0, 0)
  const result = await listMedicalRecords(env.DB, { limit, offset })
  return ok({ items: (result?.results || []).map(serialize) })
}

export const createMedicalAction = async (request, env) => {
  if (!(await isAuthenticated(request, env))) return fail('unauthorized', 401)
  const body = await readJsonBody(request)
  const date = cleanDate(body?.date)
  if (!date) return fail('date_required', 400)
  const row = await insertMedicalRecord(env.DB, {
    id:           crypto.randomUUID(),
    date,
    hospital:     cleanStr(body?.hospital),
    doctor:       cleanStr(body?.doctor),
    diagnosis:    cleanStr(body?.diagnosis),
    prescription: cleanStr(body?.prescription),
    note:         cleanStr(body?.note),
    cover:        cleanOpt(body?.cover) ?? null,
  })
  return ok({ item: serialize(row) })
}

export const updateMedicalAction = async (request, env, id) => {
  if (!(await isAuthenticated(request, env))) return fail('unauthorized', 401)
  const existing = await findMedicalRecordById(env.DB, id)
  if (!existing) return fail('not_found', 404)
  const body = await readJsonBody(request)
  const patch = {}
  if (body?.date !== undefined) {
    const d = cleanDate(body.date)
    if (!d) return fail('date_invalid', 400)
    patch.date = d
  }
  if (body?.hospital     !== undefined) patch.hospital     = cleanStr(body.hospital)
  if (body?.doctor       !== undefined) patch.doctor       = cleanStr(body.doctor)
  if (body?.diagnosis    !== undefined) patch.diagnosis    = cleanStr(body.diagnosis)
  if (body?.prescription !== undefined) patch.prescription = cleanStr(body.prescription)
  if (body?.note         !== undefined) patch.note         = cleanStr(body.note)
  if (body?.cover        !== undefined) patch.cover        = cleanOpt(body.cover)
  const row = await updateMedicalRecord(env.DB, id, patch)
  return ok({ item: serialize(row) })
}

export const deleteMedicalAction = async (request, env, id) => {
  if (!(await isAuthenticated(request, env))) return fail('unauthorized', 401)
  const existing = await findMedicalRecordById(env.DB, id)
  if (!existing) return fail('not_found', 404)
  await deleteMedicalRecord(env.DB, id)
  return ok({})
}
