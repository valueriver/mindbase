// 健康仓储。
const COLS = `id, date, weight_g, sleep_min, mood, exercise, note, created_at, updated_at`

export const listHealthEntries = (db, { limit = 200, offset = 0 } = {}) =>
  db.prepare(
    `SELECT ${COLS} FROM app_health_entries
      ORDER BY date DESC LIMIT ?1 OFFSET ?2`
  ).bind(limit, offset).all()

export const findHealthEntryById = (db, id) =>
  db.prepare(`SELECT ${COLS} FROM app_health_entries WHERE id = ?1`).bind(id).first()

export const findHealthEntryByDate = (db, date) =>
  db.prepare(`SELECT ${COLS} FROM app_health_entries WHERE date = ?1`).bind(date).first()

export const insertHealthEntry = async (db, r) => {
  await db.prepare(
    `INSERT INTO app_health_entries
       (id, date, weight_g, sleep_min, mood, exercise, note, created_at, updated_at)
     VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, datetime('now'), datetime('now'))`
  ).bind(r.id, r.date, r.weight_g, r.sleep_min, r.mood, r.exercise, r.note).run()
  return findHealthEntryById(db, r.id)
}

export const updateHealthEntry = async (db, id, patch) => {
  const sets = []
  const binds = [id]
  const push = (col, val) => { binds.push(val); sets.push(`${col} = ?${binds.length}`) }
  for (const col of ['date','weight_g','sleep_min','mood','exercise','note']) {
    if (patch[col] !== undefined) push(col, patch[col])
  }
  if (sets.length) {
    sets.push(`updated_at = datetime('now')`)
    await db.prepare(`UPDATE app_health_entries SET ${sets.join(', ')} WHERE id = ?1`).bind(...binds).run()
  }
  return findHealthEntryById(db, id)
}

export const deleteHealthEntry = (db, id) =>
  db.prepare(`DELETE FROM app_health_entries WHERE id = ?1`).bind(id).run()
