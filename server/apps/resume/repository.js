// 简历条目。
const COLS = `id, kind, title, org, start_date, end_date, description, sort_order, created_at, updated_at`

export const listResumeEntries = (db, { kind = null } = {}) => {
  const where = []
  const binds = []
  if (kind) { binds.push(kind); where.push(`kind = ?${binds.length}`) }
  const sql = `SELECT ${COLS} FROM app_resume_entries
                ${where.length ? `WHERE ${where.join(' AND ')}` : ''}
               ORDER BY sort_order ASC, COALESCE(start_date, '') DESC, created_at DESC`
  return db.prepare(sql).bind(...binds).all()
}

export const findResumeEntryById = (db, id) =>
  db.prepare(`SELECT ${COLS} FROM app_resume_entries WHERE id = ?1`).bind(id).first()

export const insertResumeEntry = async (db, { id, kind, title, org, start_date, end_date, description, sort_order }) => {
  await db.prepare(
    `INSERT INTO app_resume_entries (id, kind, title, org, start_date, end_date, description, sort_order, created_at, updated_at)
     VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, datetime('now'), datetime('now'))`
  ).bind(id, kind, title, org, start_date, end_date, description, sort_order).run()
  return findResumeEntryById(db, id)
}

export const updateResumeEntry = async (db, id, { kind, title, org, start_date, end_date, description, sort_order }) => {
  await db.prepare(
    `UPDATE app_resume_entries
        SET kind        = COALESCE(?2, kind),
            title       = COALESCE(?3, title),
            org         = COALESCE(?4, org),
            start_date  = ?5,
            end_date    = ?6,
            description = COALESCE(?7, description),
            sort_order  = COALESCE(?8, sort_order),
            updated_at  = datetime('now')
      WHERE id = ?1`
  ).bind(
    id,
    kind ?? null,
    title ?? null,
    org ?? null,
    start_date === undefined ? null : start_date,
    end_date === undefined ? null : end_date,
    description ?? null,
    sort_order ?? null,
  ).run()
  return findResumeEntryById(db, id)
}

export const deleteResumeEntry = (db, id) =>
  db.prepare(`DELETE FROM app_resume_entries WHERE id = ?1`).bind(id).run()
