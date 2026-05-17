// 设备仓储。
const COLS = `id, name, category, brand, model, serial, purchased_at, price, note, cover, created_at, updated_at`

export const listDevices = (db) =>
  db.prepare(`SELECT ${COLS} FROM app_devices_items ORDER BY created_at DESC`).all()

export const findDeviceById = (db, id) =>
  db.prepare(`SELECT ${COLS} FROM app_devices_items WHERE id = ?1`).bind(id).first()

export const insertDevice = async (db, r) => {
  await db.prepare(
    `INSERT INTO app_devices_items
       (id, name, category, brand, model, serial, purchased_at, price, note, cover, created_at, updated_at)
     VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, datetime('now'), datetime('now'))`
  ).bind(r.id, r.name, r.category, r.brand, r.model, r.serial, r.purchased_at, r.price, r.note, r.cover).run()
  return findDeviceById(db, r.id)
}

export const updateDevice = async (db, id, patch) => {
  const sets = []
  const binds = [id]
  const push = (col, val) => { binds.push(val); sets.push(`${col} = ?${binds.length}`) }
  for (const col of ['name','category','brand','model','serial','purchased_at','price','note','cover']) {
    if (patch[col] !== undefined) push(col, patch[col])
  }
  if (sets.length) {
    sets.push(`updated_at = datetime('now')`)
    await db.prepare(`UPDATE app_devices_items SET ${sets.join(', ')} WHERE id = ?1`).bind(...binds).run()
  }
  return findDeviceById(db, id)
}

export const deleteDevice = (db, id) =>
  db.prepare(`DELETE FROM app_devices_items WHERE id = ?1`).bind(id).run()
