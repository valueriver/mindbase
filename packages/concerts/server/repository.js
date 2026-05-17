// 演唱会仓储。
const COLS = `id, artist, tour, venue, city, show_date, ticket_price, seat, rating, note, cover, created_at, updated_at`

export const listConcerts = (db) =>
  db.prepare(
    `SELECT ${COLS} FROM app_concerts_shows
      ORDER BY show_date IS NULL, show_date DESC, created_at DESC`
  ).all()

export const findConcertById = (db, id) =>
  db.prepare(`SELECT ${COLS} FROM app_concerts_shows WHERE id = ?1`).bind(id).first()

export const insertConcert = async (db, r) => {
  await db.prepare(
    `INSERT INTO app_concerts_shows
       (id, artist, tour, venue, city, show_date, ticket_price, seat, rating, note, cover, created_at, updated_at)
     VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, datetime('now'), datetime('now'))`
  ).bind(r.id, r.artist, r.tour, r.venue, r.city, r.show_date, r.ticket_price, r.seat, r.rating, r.note, r.cover).run()
  return findConcertById(db, r.id)
}

export const updateConcert = async (db, id, patch) => {
  const sets = []
  const binds = [id]
  const push = (col, val) => { binds.push(val); sets.push(`${col} = ?${binds.length}`) }
  for (const col of ['artist','tour','venue','city','show_date','ticket_price','seat','rating','note','cover']) {
    if (patch[col] !== undefined) push(col, patch[col])
  }
  if (sets.length) {
    sets.push(`updated_at = datetime('now')`)
    await db.prepare(`UPDATE app_concerts_shows SET ${sets.join(', ')} WHERE id = ?1`).bind(...binds).run()
  }
  return findConcertById(db, id)
}

export const deleteConcert = (db, id) =>
  db.prepare(`DELETE FROM app_concerts_shows WHERE id = ?1`).bind(id).run()
