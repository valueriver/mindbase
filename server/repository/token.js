const COLS = 'id, user_id, name, token, scope, created_at, last_used_at'

export const listTokens = async (db, userId) => {
  const { results } = await db.prepare(
    `SELECT ${COLS} FROM tokens WHERE user_id = ?1 ORDER BY created_at DESC`
  ).bind(userId).all()
  return results || []
}

export const findTokenByValue = (db, token) =>
  db.prepare(
    `SELECT t.id AS token_id, t.user_id, t.scope,
            u.email, u.name, u.avatar_url
       FROM tokens t
       INNER JOIN users u ON u.id = t.user_id
      WHERE t.token = ?1`
  ).bind(token).first()

export const touchToken = (db, id) =>
  db.prepare(`UPDATE tokens SET last_used_at = datetime('now') WHERE id = ?1`)
    .bind(id).run()

export const createToken = async (db, { id, userId, name, token, scope = 'read_write' }) => {
  await db.prepare(
    `INSERT INTO tokens (id, user_id, name, token, scope, created_at)
     VALUES (?1, ?2, ?3, ?4, ?5, datetime('now'))`
  ).bind(id, userId, name, token, scope).run()
  return db.prepare(`SELECT ${COLS} FROM tokens WHERE id = ?1`).bind(id).first()
}

export const deleteAllTokensForUser = (db, userId) =>
  db.prepare(`DELETE FROM tokens WHERE user_id = ?1`).bind(userId).run()

export const deleteToken = (db, id, userId) =>
  db.prepare(`DELETE FROM tokens WHERE id = ?1 AND user_id = ?2`).bind(id, userId).run()
