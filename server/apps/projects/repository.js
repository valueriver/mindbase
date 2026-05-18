// 个人项目。
const COLS = `id, title, status, note, created_at, updated_at`

export const listProjects = (db, { status = null } = {}) => {
  const where = []
  const binds = []
  if (status) { binds.push(status); where.push(`status = ?${binds.length}`) }
  const sql = `SELECT ${COLS} FROM projects_items
                ${where.length ? `WHERE ${where.join(' AND ')}` : ''}
               ORDER BY created_at DESC`
  return db.prepare(sql).bind(...binds).all()
}

export const findProjectById = (db, id) =>
  db.prepare(`SELECT ${COLS} FROM projects_items WHERE id = ?1`).bind(id).first()

export const insertProject = async (db, { id, title, status, note }) => {
  await db.prepare(
    `INSERT INTO projects_items (id, title, status, note, created_at, updated_at)
     VALUES (?1, ?2, ?3, ?4, datetime('now'), datetime('now'))`
  ).bind(id, title, status, note).run()
  return findProjectById(db, id)
}

export const updateProject = async (db, id, { title, status, note }) => {
  await db.prepare(
    `UPDATE projects_items
        SET title      = COALESCE(?2, title),
            status     = COALESCE(?3, status),
            note       = COALESCE(?4, note),
            updated_at = datetime('now')
      WHERE id = ?1`
  ).bind(id, title ?? null, status ?? null, note ?? null).run()
  return findProjectById(db, id)
}

export const deleteProject = (db, id) =>
  db.prepare(`DELETE FROM projects_items WHERE id = ?1`).bind(id).run()
