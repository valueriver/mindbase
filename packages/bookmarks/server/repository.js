// Bookmarks 仓储:单表 app_bookmarks_items 的 CRUD。
const COLS = `id, url, title, description, cover, created_at, updated_at`

export const listBookmarks = (db, { limit = 200, offset = 0 } = {}) =>
  db.prepare(
    `SELECT ${COLS} FROM app_bookmarks_items
      ORDER BY created_at DESC
      LIMIT ?1 OFFSET ?2`
  ).bind(limit, offset).all()

export const findBookmarkById = (db, id) =>
  db.prepare(`SELECT ${COLS} FROM app_bookmarks_items WHERE id = ?1`).bind(id).first()

export const insertBookmark = async (db, { id, url, title = null, description = null, cover = null }) => {
  await db.prepare(
    `INSERT INTO app_bookmarks_items (id, url, title, description, cover, created_at, updated_at)
     VALUES (?1, ?2, ?3, ?4, ?5, datetime('now'), datetime('now'))`
  ).bind(id, url, title, description, cover).run()
  return findBookmarkById(db, id)
}

export const updateBookmark = async (db, id, { url, title, description, cover }) => {
  await db.prepare(
    `UPDATE app_bookmarks_items
        SET url         = COALESCE(?2, url),
            title       = CASE WHEN ?3 IS NULL THEN title ELSE ?3 END,
            description = CASE WHEN ?4 IS NULL THEN description ELSE ?4 END,
            cover       = CASE WHEN ?5 IS NULL THEN cover ELSE ?5 END,
            updated_at  = datetime('now')
      WHERE id = ?1`
  ).bind(id, url ?? null, title ?? null, description ?? null, cover ?? null).run()
  return findBookmarkById(db, id)
}

export const deleteBookmark = (db, id) =>
  db.prepare(`DELETE FROM app_bookmarks_items WHERE id = ?1`).bind(id).run()
