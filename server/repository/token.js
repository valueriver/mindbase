const COLS = 'id, name, token, scope, created_at, last_used_at'

export const listTokens = async (db) => {
  const { results } = await db.prepare(
    `SELECT ${COLS} FROM tokens ORDER BY created_at DESC`
  ).all()
  return results || []
}

export const findTokenByValue = (db, token) =>
  db.prepare(`SELECT id AS token_id, scope FROM tokens WHERE token = ?1`).bind(token).first()

export const touchToken = (db, id) =>
  db.prepare(`UPDATE tokens SET last_used_at = datetime('now') WHERE id = ?1`)
    .bind(id).run()

export const createToken = async (db, { id, name, token, scope = 'read_write' }) => {
  await db.prepare(
    `INSERT INTO tokens (id, name, token, scope, created_at)
     VALUES (?1, ?2, ?3, ?4, datetime('now'))`
  ).bind(id, name, token, scope).run()
  return db.prepare(`SELECT ${COLS} FROM tokens WHERE id = ?1`).bind(id).first()
}

export const deleteAllTokens = (db) =>
  db.prepare(`DELETE FROM tokens`).run()

export const deleteToken = (db, id) =>
  db.prepare(`DELETE FROM tokens WHERE id = ?1`).bind(id).run()
