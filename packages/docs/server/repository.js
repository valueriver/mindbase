// 证件库仓储。
const COLS = `id, name, number, issuer, issued_at, expire_at, image_front, image_back, note, created_at, updated_at`

export const listDocs = (db, { limit = 200, offset = 0 } = {}) =>
  db.prepare(
    `SELECT ${COLS} FROM app_docs_items
      ORDER BY created_at DESC LIMIT ?1 OFFSET ?2`
  ).bind(limit, offset).all()

export const findDocById = (db, id) =>
  db.prepare(`SELECT ${COLS} FROM app_docs_items WHERE id = ?1`).bind(id).first()

export const insertDoc = async (db, { id, name, number = '', issuer = '', issued_at = null, expire_at = null, image_front = null, image_back = null, note = '' }) => {
  await db.prepare(
    `INSERT INTO app_docs_items (id, name, number, issuer, issued_at, expire_at, image_front, image_back, note, created_at, updated_at)
     VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, datetime('now'), datetime('now'))`
  ).bind(id, name, number, issuer, issued_at, expire_at, image_front, image_back, note).run()
  return findDocById(db, id)
}

export const updateDoc = async (db, id, patch) => {
  const sets = []
  const binds = [id]
  const push = (col, val) => { binds.push(val); sets.push(`${col} = ?${binds.length}`) }
  if (patch.name        !== undefined) push('name', patch.name)
  if (patch.number      !== undefined) push('number', patch.number)
  if (patch.issuer      !== undefined) push('issuer', patch.issuer)
  if (patch.issued_at   !== undefined) push('issued_at', patch.issued_at)
  if (patch.expire_at   !== undefined) push('expire_at', patch.expire_at)
  if (patch.image_front !== undefined) push('image_front', patch.image_front)
  if (patch.image_back  !== undefined) push('image_back', patch.image_back)
  if (patch.note        !== undefined) push('note', patch.note)
  if (sets.length) {
    sets.push(`updated_at = datetime('now')`)
    await db.prepare(`UPDATE app_docs_items SET ${sets.join(', ')} WHERE id = ?1`).bind(...binds).run()
  }
  return findDocById(db, id)
}

export const deleteDoc = (db, id) =>
  db.prepare(`DELETE FROM app_docs_items WHERE id = ?1`).bind(id).run()
