// Calendar:按日期排的事项。
const COLS = `id, title, date, time, note, created_at, updated_at`

export const listEvents = (db, { month } = {}) => {
  if (month) {
    return db.prepare(
      `SELECT ${COLS} FROM app_calendar_events
        WHERE date LIKE ?1
        ORDER BY date ASC, time IS NULL, time ASC`
    ).bind(`${month}%`).all()
  }
  return db.prepare(
    `SELECT ${COLS} FROM app_calendar_events
      ORDER BY date ASC, time IS NULL, time ASC`
  ).all()
}

export const findEventById = (db, id) =>
  db.prepare(`SELECT ${COLS} FROM app_calendar_events WHERE id = ?1`).bind(id).first()

export const insertEvent = async (db, { id, title, date, time, note }) => {
  await db.prepare(
    `INSERT INTO app_calendar_events (id, title, date, time, note, created_at, updated_at)
     VALUES (?1, ?2, ?3, ?4, ?5, datetime('now'), datetime('now'))`
  ).bind(id, title, date, time ?? null, note ?? '').run()
  return findEventById(db, id)
}

export const updateEvent = async (db, id, patch) => {
  const fields = []
  const binds  = [id]
  let i = 2
  if (patch.title !== undefined) { fields.push(`title = ?${i++}`); binds.push(patch.title) }
  if (patch.date  !== undefined) { fields.push(`date = ?${i++}`);  binds.push(patch.date) }
  if (patch.time  !== undefined) { fields.push(`time = ?${i++}`);  binds.push(patch.time) }
  if (patch.note  !== undefined) { fields.push(`note = ?${i++}`);  binds.push(patch.note) }
  fields.push(`updated_at = datetime('now')`)
  await db.prepare(
    `UPDATE app_calendar_events SET ${fields.join(', ')} WHERE id = ?1`
  ).bind(...binds).run()
  return findEventById(db, id)
}

export const deleteEvent = (db, id) =>
  db.prepare(`DELETE FROM app_calendar_events WHERE id = ?1`).bind(id).run()
