// Movies 仓储:单表 app_movies_items 的 CRUD。
const COLS = `id, title, year, status, rating, note, cover, created_at, updated_at`

export const listMovies = (db, { status = null, limit = 200, offset = 0 } = {}) => {
  if (status) {
    return db.prepare(
      `SELECT ${COLS} FROM app_movies_items
        WHERE status = ?1
        ORDER BY created_at DESC
        LIMIT ?2 OFFSET ?3`
    ).bind(status, limit, offset).all()
  }
  return db.prepare(
    `SELECT ${COLS} FROM app_movies_items
      ORDER BY created_at DESC
      LIMIT ?1 OFFSET ?2`
  ).bind(limit, offset).all()
}

export const findMovieById = (db, id) =>
  db.prepare(`SELECT ${COLS} FROM app_movies_items WHERE id = ?1`).bind(id).first()

export const insertMovie = async (db, { id, title, year = null, status = 'want', rating = 0, note = '', cover = null }) => {
  await db.prepare(
    `INSERT INTO app_movies_items (id, title, year, status, rating, note, cover, created_at, updated_at)
     VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, datetime('now'), datetime('now'))`
  ).bind(id, title, year, status, rating, note, cover).run()
  return findMovieById(db, id)
}

export const updateMovie = async (db, id, { title, year, status, rating, note, cover }) => {
  await db.prepare(
    `UPDATE app_movies_items
        SET title      = COALESCE(?2, title),
            year       = CASE WHEN ?3 IS NULL THEN year ELSE ?3 END,
            status     = COALESCE(?4, status),
            rating     = COALESCE(?5, rating),
            note       = COALESCE(?6, note),
            cover      = CASE WHEN ?7 IS NULL THEN cover ELSE ?7 END,
            updated_at = datetime('now')
      WHERE id = ?1`
  ).bind(id, title ?? null, year ?? null, status ?? null, rating ?? null, note ?? null, cover ?? null).run()
  return findMovieById(db, id)
}

export const deleteMovie = (db, id) =>
  db.prepare(`DELETE FROM app_movies_items WHERE id = ?1`).bind(id).run()
