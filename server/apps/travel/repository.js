// 旅行计划。
const COLS = `id, destination, start_date, end_date, status, note, cover, created_at, updated_at`

export const listTrips = (db, { status = null } = {}) => {
  const where = []
  const binds = []
  if (status) { binds.push(status); where.push(`status = ?${binds.length}`) }
  const sql = `SELECT ${COLS} FROM app_travel_trips
                ${where.length ? `WHERE ${where.join(' AND ')}` : ''}
               ORDER BY (start_date IS NULL), start_date ASC, created_at DESC`
  return db.prepare(sql).bind(...binds).all()
}

export const findTripById = (db, id) =>
  db.prepare(`SELECT ${COLS} FROM app_travel_trips WHERE id = ?1`).bind(id).first()

export const insertTrip = async (db, { id, destination, startDate, endDate, status, note, cover }) => {
  await db.prepare(
    `INSERT INTO app_travel_trips (id, destination, start_date, end_date, status, note, cover, created_at, updated_at)
     VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, datetime('now'), datetime('now'))`
  ).bind(id, destination, startDate, endDate, status, note, cover).run()
  return findTripById(db, id)
}

export const updateTrip = async (db, id, { destination, startDate, endDate, status, note, cover }) => {
  await db.prepare(
    `UPDATE app_travel_trips
        SET destination = COALESCE(?2, destination),
            start_date  = CASE WHEN ?3 = '__keep__' THEN start_date ELSE ?3 END,
            end_date    = CASE WHEN ?4 = '__keep__' THEN end_date   ELSE ?4 END,
            status      = COALESCE(?5, status),
            note        = COALESCE(?6, note),
            cover       = CASE WHEN ?7 = '__keep__' THEN cover ELSE ?7 END,
            updated_at  = datetime('now')
      WHERE id = ?1`
  ).bind(
    id,
    destination ?? null,
    startDate ?? '__keep__',
    endDate ?? '__keep__',
    status ?? null,
    note ?? null,
    cover ?? '__keep__',
  ).run()
  return findTripById(db, id)
}

export const deleteTrip = (db, id) =>
  db.prepare(`DELETE FROM app_travel_trips WHERE id = ?1`).bind(id).run()
