// 展览仓储。
const COLS = `id, title, venue, city, visited_at, rating, note, cover, created_at, updated_at`

export const listExhibitions = (db) =>
  db.prepare(
    `SELECT ${COLS} FROM app_exhibitions_visits
      ORDER BY visited_at IS NULL, visited_at DESC, created_at DESC`
  ).all()

export const findExhibitionById = (db, id) =>
  db.prepare(`SELECT ${COLS} FROM app_exhibitions_visits WHERE id = ?1`).bind(id).first()

export const insertExhibition = async (db, r) => {
  await db.prepare(
    `INSERT INTO app_exhibitions_visits
       (id, title, venue, city, visited_at, rating, note, cover, created_at, updated_at)
     VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, datetime('now'), datetime('now'))`
  ).bind(r.id, r.title, r.venue, r.city, r.visited_at, r.rating, r.note, r.cover).run()
  return findExhibitionById(db, r.id)
}

export const updateExhibition = async (db, id, patch) => {
  const sets = []
  const binds = [id]
  const push = (col, val) => { binds.push(val); sets.push(`${col} = ?${binds.length}`) }
  for (const col of ['title','venue','city','visited_at','rating','note','cover']) {
    if (patch[col] !== undefined) push(col, patch[col])
  }
  if (sets.length) {
    sets.push(`updated_at = datetime('now')`)
    await db.prepare(`UPDATE app_exhibitions_visits SET ${sets.join(', ')} WHERE id = ?1`).bind(...binds).run()
  }
  return findExhibitionById(db, id)
}

export const deleteExhibition = (db, id) =>
  db.prepare(`DELETE FROM app_exhibitions_visits WHERE id = ?1`).bind(id).run()
