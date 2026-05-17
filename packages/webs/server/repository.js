// Webs:AI 生成的 HTML 页面收藏。
const COLS = `id, title, description, html, created_at, updated_at`

export const listPages = (db) =>
  db.prepare(
    `SELECT ${COLS} FROM app_webs_pages ORDER BY created_at DESC`
  ).all()

export const findPageById = (db, id) =>
  db.prepare(`SELECT ${COLS} FROM app_webs_pages WHERE id = ?1`).bind(id).first()

export const insertPage = async (db, { id, title, description, html }) => {
  await db.prepare(
    `INSERT INTO app_webs_pages (id, title, description, html, created_at, updated_at)
     VALUES (?1, ?2, ?3, ?4, datetime('now'), datetime('now'))`
  ).bind(id, title, description, html).run()
  return findPageById(db, id)
}

export const updatePage = async (db, id, { title, description, html }) => {
  await db.prepare(
    `UPDATE app_webs_pages
        SET title       = COALESCE(?2, title),
            description = COALESCE(?3, description),
            html        = COALESCE(?4, html),
            updated_at  = datetime('now')
      WHERE id = ?1`
  ).bind(id, title ?? null, description ?? null, html ?? null).run()
  return findPageById(db, id)
}

export const deletePage = (db, id) =>
  db.prepare(`DELETE FROM app_webs_pages WHERE id = ?1`).bind(id).run()
