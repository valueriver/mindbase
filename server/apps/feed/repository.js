// Feed posts:你和 AI 共写的时间线。author ∈ {'user','ai'} 区分谁写的。
const COLS = `id, author, content, created_at, updated_at`

export const listMemos = (db, { limit = 200, offset = 0 } = {}) =>
  db.prepare(
    `SELECT ${COLS} FROM app_feed_posts
      ORDER BY created_at DESC
      LIMIT ?1 OFFSET ?2`
  ).bind(limit, offset).all()

export const findMemoById = (db, id) =>
  db.prepare(`SELECT ${COLS} FROM app_feed_posts WHERE id = ?1`).bind(id).first()

export const insertMemo = async (db, { id, content, author = 'user' }) => {
  await db.prepare(
    `INSERT INTO app_feed_posts (id, author, content, created_at, updated_at)
     VALUES (?1, ?2, ?3, datetime('now'), datetime('now'))`
  ).bind(id, author, content).run()
  return findMemoById(db, id)
}

export const updateMemo = async (db, id, { content }) => {
  await db.prepare(
    `UPDATE app_feed_posts
        SET content    = COALESCE(?2, content),
            updated_at = datetime('now')
      WHERE id = ?1`
  ).bind(id, content ?? null).run()
  return findMemoById(db, id)
}

export const deleteMemo = (db, id) =>
  db.prepare(`DELETE FROM app_feed_posts WHERE id = ?1`).bind(id).run()
