// 影集仓储。
const COLS = `id, image_url, caption, taken_at, location, created_at, updated_at`

export const listPhotos = (db, { limit = 200, offset = 0 } = {}) =>
  db.prepare(
    `SELECT ${COLS} FROM app_photos_items
      ORDER BY taken_at IS NULL, taken_at DESC, created_at DESC
      LIMIT ?1 OFFSET ?2`
  ).bind(limit, offset).all()

export const findPhotoById = (db, id) =>
  db.prepare(`SELECT ${COLS} FROM app_photos_items WHERE id = ?1`).bind(id).first()

export const insertPhoto = async (db, { id, image_url, caption = '', taken_at = null, location = '' }) => {
  await db.prepare(
    `INSERT INTO app_photos_items (id, image_url, caption, taken_at, location, created_at, updated_at)
     VALUES (?1, ?2, ?3, ?4, ?5, datetime('now'), datetime('now'))`
  ).bind(id, image_url, caption, taken_at, location).run()
  return findPhotoById(db, id)
}

export const updatePhoto = async (db, id, patch) => {
  const sets = []
  const binds = [id]
  const push = (col, val) => { binds.push(val); sets.push(`${col} = ?${binds.length}`) }
  if (patch.image_url !== undefined) push('image_url', patch.image_url)
  if (patch.caption   !== undefined) push('caption', patch.caption)
  if (patch.taken_at  !== undefined) push('taken_at', patch.taken_at)
  if (patch.location  !== undefined) push('location', patch.location)
  if (sets.length) {
    sets.push(`updated_at = datetime('now')`)
    await db.prepare(`UPDATE app_photos_items SET ${sets.join(', ')} WHERE id = ?1`).bind(...binds).run()
  }
  return findPhotoById(db, id)
}

export const deletePhoto = (db, id) =>
  db.prepare(`DELETE FROM app_photos_items WHERE id = ?1`).bind(id).run()
