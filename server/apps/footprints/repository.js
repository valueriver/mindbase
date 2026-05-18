// 足迹仓储。
const COLS = `id, name, country, city, visited_at, note, cover, created_at, updated_at`

export const listFootprints = (db, { limit = 200, offset = 0 } = {}) =>
  db.prepare(
    `SELECT ${COLS} FROM footprints_visits
      ORDER BY visited_at IS NULL, visited_at DESC, created_at DESC
      LIMIT ?1 OFFSET ?2`
  ).bind(limit, offset).all()

export const findFootprintById = (db, id) =>
  db.prepare(`SELECT ${COLS} FROM footprints_visits WHERE id = ?1`).bind(id).first()

export const insertFootprint = async (db, { id, name, country = '', city = '', visited_at = null, note = '', cover = null }) => {
  await db.prepare(
    `INSERT INTO footprints_visits (id, name, country, city, visited_at, note, cover, created_at, updated_at)
     VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, datetime('now'), datetime('now'))`
  ).bind(id, name, country, city, visited_at, note, cover).run()
  return findFootprintById(db, id)
}

export const updateFootprint = async (db, id, patch) => {
  const sets = []
  const binds = [id]
  const push = (col, val) => { binds.push(val); sets.push(`${col} = ?${binds.length}`) }
  if (patch.name       !== undefined) push('name', patch.name)
  if (patch.country    !== undefined) push('country', patch.country)
  if (patch.city       !== undefined) push('city', patch.city)
  if (patch.visited_at !== undefined) push('visited_at', patch.visited_at)
  if (patch.note       !== undefined) push('note', patch.note)
  if (patch.cover      !== undefined) push('cover', patch.cover)
  if (sets.length) {
    sets.push(`updated_at = datetime('now')`)
    await db.prepare(`UPDATE footprints_visits SET ${sets.join(', ')} WHERE id = ?1`).bind(...binds).run()
  }
  return findFootprintById(db, id)
}

export const deleteFootprint = (db, id) =>
  db.prepare(`DELETE FROM footprints_visits WHERE id = ?1`).bind(id).run()
