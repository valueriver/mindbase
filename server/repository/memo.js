const COLS = `id, user_id, content, tags, created_at, updated_at`

export const listMemos = (db, userId, { limit = 200, offset = 0 } = {}) =>
  db.prepare(
    `SELECT ${COLS} FROM memos
      WHERE user_id = ?1
      ORDER BY created_at DESC
      LIMIT ?2 OFFSET ?3`
  ).bind(userId, limit, offset).all()

export const findMemoById = (db, userId, id) =>
  db.prepare(
    `SELECT ${COLS} FROM memos WHERE id = ?1 AND user_id = ?2`
  ).bind(id, userId).first()

export const insertMemo = async (db, { id, userId, content, tags }) => {
  await db.prepare(
    `INSERT INTO memos (id, user_id, content, tags, created_at, updated_at)
     VALUES (?1, ?2, ?3, ?4, datetime('now'), datetime('now'))`
  ).bind(id, userId, content, tags ?? null).run()
  return findMemoById(db, userId, id)
}

export const updateMemo = async (db, userId, id, { content, tags }) => {
  await db.prepare(
    `UPDATE memos
        SET content    = COALESCE(?3, content),
            tags       = CASE WHEN ?4 = 1 THEN ?5 ELSE tags END,
            updated_at = datetime('now')
      WHERE id = ?1 AND user_id = ?2`
  ).bind(
    id, userId,
    content ?? null,
    tags === undefined ? 0 : 1, tags ?? null,
  ).run()
  return findMemoById(db, userId, id)
}

export const deleteMemo = (db, userId, id) =>
  db.prepare(`DELETE FROM memos WHERE id = ?1 AND user_id = ?2`).bind(id, userId).run()
