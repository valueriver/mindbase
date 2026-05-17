// API key 仓储。
const COLS = `id, service, name, api_key, scope, expire_at, note, created_at, updated_at`

export const listApikeys = (db) =>
  db.prepare(
    `SELECT ${COLS} FROM app_apikeys_items
      ORDER BY (expire_at IS NULL), expire_at ASC, created_at DESC`
  ).all()

export const findApikeyById = (db, id) =>
  db.prepare(`SELECT ${COLS} FROM app_apikeys_items WHERE id = ?1`).bind(id).first()

export const insertApikey = async (db, r) => {
  await db.prepare(
    `INSERT INTO app_apikeys_items
       (id, service, name, api_key, scope, expire_at, note, created_at, updated_at)
     VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, datetime('now'), datetime('now'))`
  ).bind(r.id, r.service, r.name, r.api_key, r.scope, r.expire_at, r.note).run()
  return findApikeyById(db, r.id)
}

export const updateApikey = async (db, id, patch) => {
  const sets = []
  const binds = [id]
  const push = (col, val) => { binds.push(val); sets.push(`${col} = ?${binds.length}`) }
  for (const col of ['service','name','api_key','scope','expire_at','note']) {
    if (patch[col] !== undefined) push(col, patch[col])
  }
  if (sets.length) {
    sets.push(`updated_at = datetime('now')`)
    await db.prepare(`UPDATE app_apikeys_items SET ${sets.join(', ')} WHERE id = ?1`).bind(...binds).run()
  }
  return findApikeyById(db, id)
}

export const deleteApikey = (db, id) =>
  db.prepare(`DELETE FROM app_apikeys_items WHERE id = ?1`).bind(id).run()
