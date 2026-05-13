const COLS = `id, content, created_at, updated_at`

export const listMemos = (db, { limit = 200, offset = 0 } = {}) =>
  db.prepare(
    `SELECT ${COLS} FROM memos
      ORDER BY created_at DESC
      LIMIT ?1 OFFSET ?2`
  ).bind(limit, offset).all()

export const findMemoById = (db, id) =>
  db.prepare(`SELECT ${COLS} FROM memos WHERE id = ?1`).bind(id).first()

export const insertMemo = async (db, { id, content }) => {
  await db.prepare(
    `INSERT INTO memos (id, content, created_at, updated_at)
     VALUES (?1, ?2, datetime('now'), datetime('now'))`
  ).bind(id, content).run()
  return findMemoById(db, id)
}

export const updateMemo = async (db, id, { content }) => {
  await db.prepare(
    `UPDATE memos
        SET content    = COALESCE(?2, content),
            updated_at = datetime('now')
      WHERE id = ?1`
  ).bind(id, content ?? null).run()
  return findMemoById(db, id)
}

export const deleteMemo = (db, id) =>
  db.prepare(`DELETE FROM memos WHERE id = ?1`).bind(id).run()
