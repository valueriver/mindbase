// 说明书仓储。
const COLS = `id, product_name, brand, manual_url, purchased_at, warranty_until, note, cover, created_at, updated_at`

export const listManuals = (db, { limit = 200, offset = 0 } = {}) =>
  db.prepare(
    `SELECT ${COLS} FROM app_manuals_items
      ORDER BY created_at DESC LIMIT ?1 OFFSET ?2`
  ).bind(limit, offset).all()

export const findManualById = (db, id) =>
  db.prepare(`SELECT ${COLS} FROM app_manuals_items WHERE id = ?1`).bind(id).first()

export const insertManual = async (db, { id, product_name, brand = '', manual_url = '', purchased_at = null, warranty_until = null, note = '', cover = null }) => {
  await db.prepare(
    `INSERT INTO app_manuals_items (id, product_name, brand, manual_url, purchased_at, warranty_until, note, cover, created_at, updated_at)
     VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, datetime('now'), datetime('now'))`
  ).bind(id, product_name, brand, manual_url, purchased_at, warranty_until, note, cover).run()
  return findManualById(db, id)
}

export const updateManual = async (db, id, patch) => {
  const sets = []
  const binds = [id]
  const push = (col, val) => { binds.push(val); sets.push(`${col} = ?${binds.length}`) }
  if (patch.product_name   !== undefined) push('product_name', patch.product_name)
  if (patch.brand          !== undefined) push('brand', patch.brand)
  if (patch.manual_url     !== undefined) push('manual_url', patch.manual_url)
  if (patch.purchased_at   !== undefined) push('purchased_at', patch.purchased_at)
  if (patch.warranty_until !== undefined) push('warranty_until', patch.warranty_until)
  if (patch.note           !== undefined) push('note', patch.note)
  if (patch.cover          !== undefined) push('cover', patch.cover)
  if (sets.length) {
    sets.push(`updated_at = datetime('now')`)
    await db.prepare(`UPDATE app_manuals_items SET ${sets.join(', ')} WHERE id = ?1`).bind(...binds).run()
  }
  return findManualById(db, id)
}

export const deleteManual = (db, id) =>
  db.prepare(`DELETE FROM app_manuals_items WHERE id = ?1`).bind(id).run()
