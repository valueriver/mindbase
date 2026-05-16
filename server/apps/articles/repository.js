// 文章。
const COLS = `id, title, url, source, summary, published_at, cover, created_at, updated_at`

export const listArticles = (db, { source = null } = {}) => {
  const where = []
  const binds = []
  if (source) { binds.push(source); where.push(`source = ?${binds.length}`) }
  const sql = `SELECT ${COLS} FROM app_articles_items
                ${where.length ? `WHERE ${where.join(' AND ')}` : ''}
               ORDER BY (published_at IS NULL), published_at DESC, created_at DESC`
  return db.prepare(sql).bind(...binds).all()
}

export const findArticleById = (db, id) =>
  db.prepare(`SELECT ${COLS} FROM app_articles_items WHERE id = ?1`).bind(id).first()

export const insertArticle = async (db, { id, title, url, source, summary, published_at, cover }) => {
  await db.prepare(
    `INSERT INTO app_articles_items (id, title, url, source, summary, published_at, cover, created_at, updated_at)
     VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, datetime('now'), datetime('now'))`
  ).bind(id, title, url, source, summary, published_at, cover).run()
  return findArticleById(db, id)
}

export const updateArticle = async (db, id, patch) => {
  await db.prepare(
    `UPDATE app_articles_items
        SET title        = COALESCE(?2, title),
            url          = COALESCE(?3, url),
            source       = COALESCE(?4, source),
            summary      = COALESCE(?5, summary),
            published_at = CASE WHEN ?7 = 1 THEN ?6 ELSE published_at END,
            cover        = CASE WHEN ?9 = 1 THEN ?8 ELSE cover END,
            updated_at   = datetime('now')
      WHERE id = ?1`
  ).bind(
    id,
    patch.title ?? null,
    patch.url ?? null,
    patch.source ?? null,
    patch.summary ?? null,
    patch.published_at ?? null,
    patch.published_at !== undefined ? 1 : 0,
    patch.cover ?? null,
    patch.cover !== undefined ? 1 : 0,
  ).run()
  return findArticleById(db, id)
}

export const deleteArticle = (db, id) =>
  db.prepare(`DELETE FROM app_articles_items WHERE id = ?1`).bind(id).run()
