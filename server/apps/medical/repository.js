// 病例仓储。
const COLS = `id, date, hospital, doctor, diagnosis, prescription, note, cover, created_at, updated_at`

export const listMedicalRecords = (db, { limit = 200, offset = 0 } = {}) =>
  db.prepare(
    `SELECT ${COLS} FROM app_medical_records
      ORDER BY date DESC, created_at DESC
      LIMIT ?1 OFFSET ?2`
  ).bind(limit, offset).all()

export const findMedicalRecordById = (db, id) =>
  db.prepare(`SELECT ${COLS} FROM app_medical_records WHERE id = ?1`).bind(id).first()

export const insertMedicalRecord = async (db, { id, date, hospital = '', doctor = '', diagnosis = '', prescription = '', note = '', cover = null }) => {
  await db.prepare(
    `INSERT INTO app_medical_records (id, date, hospital, doctor, diagnosis, prescription, note, cover, created_at, updated_at)
     VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, datetime('now'), datetime('now'))`
  ).bind(id, date, hospital, doctor, diagnosis, prescription, note, cover).run()
  return findMedicalRecordById(db, id)
}

// patch: undefined 的字段跳过;null 显式清空(nullable 列);其他写入。
export const updateMedicalRecord = async (db, id, patch) => {
  const sets = []
  const binds = [id]
  const push = (col, val) => { binds.push(val); sets.push(`${col} = ?${binds.length}`) }
  if (patch.date         !== undefined) push('date', patch.date)
  if (patch.hospital     !== undefined) push('hospital', patch.hospital)
  if (patch.doctor       !== undefined) push('doctor', patch.doctor)
  if (patch.diagnosis    !== undefined) push('diagnosis', patch.diagnosis)
  if (patch.prescription !== undefined) push('prescription', patch.prescription)
  if (patch.note         !== undefined) push('note', patch.note)
  if (patch.cover        !== undefined) push('cover', patch.cover)
  if (sets.length) {
    sets.push(`updated_at = datetime('now')`)
    await db.prepare(`UPDATE app_medical_records SET ${sets.join(', ')} WHERE id = ?1`).bind(...binds).run()
  }
  return findMedicalRecordById(db, id)
}

export const deleteMedicalRecord = (db, id) =>
  db.prepare(`DELETE FROM app_medical_records WHERE id = ?1`).bind(id).run()
