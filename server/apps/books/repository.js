// Books 仓储:单表 app_books_items 的 CRUD。
const COLS = `id, title, author, status, rating, note, cover, created_at, updated_at`

export const listBooks = (db, { status = null, limit = 200, offset = 0 } = {}) => {
  if (status) {
    return db.prepare(
      `SELECT ${COLS} FROM app_books_items
        WHERE status = ?1
        ORDER BY created_at DESC
        LIMIT ?2 OFFSET ?3`
    ).bind(status, limit, offset).all()
  }
  return db.prepare(
    `SELECT ${COLS} FROM app_books_items
      ORDER BY created_at DESC
      LIMIT ?1 OFFSET ?2`
  ).bind(limit, offset).all()
}

export const findBookById = (db, id) =>
  db.prepare(`SELECT ${COLS} FROM app_books_items WHERE id = ?1`).bind(id).first()

export const insertBook = async (db, { id, title, author = '', status = 'want', rating = 0, note = '', cover = null }) => {
  await db.prepare(
    `INSERT INTO app_books_items (id, title, author, status, rating, note, cover, created_at, updated_at)
     VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, datetime('now'), datetime('now'))`
  ).bind(id, title, author, status, rating, note, cover).run()
  return findBookById(db, id)
}

export const updateBook = async (db, id, { title, author, status, rating, note, cover }) => {
  await db.prepare(
    `UPDATE app_books_items
        SET title      = COALESCE(?2, title),
            author     = COALESCE(?3, author),
            status     = COALESCE(?4, status),
            rating     = COALESCE(?5, rating),
            note       = COALESCE(?6, note),
            cover      = CASE WHEN ?7 IS NULL THEN cover ELSE ?7 END,
            updated_at = datetime('now')
      WHERE id = ?1`
  ).bind(id, title ?? null, author ?? null, status ?? null, rating ?? null, note ?? null, cover ?? null).run()
  return findBookById(db, id)
}

export const deleteBook = (db, id) =>
  db.prepare(`DELETE FROM app_books_items WHERE id = ?1`).bind(id).run()
