const NOTE_COLS = 'id, user_id, notebook_id, title, content, icon, cover, sort_order, created_at, updated_at'

export const createNote = async (db, { id, userId, notebookId, title, content, icon, cover }) => {
  await db.prepare(
    `INSERT INTO notes (id, user_id, notebook_id, title, content, icon, cover, sort_order, created_at, updated_at)
     VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, datetime('now'), datetime('now'))`
  ).bind(id, userId, notebookId, title ?? '', content ?? '', icon ?? null, cover ?? null, Date.now()).run()
  return findNoteById(db, id)
}

export const findNoteById = (db, id) =>
  db.prepare(`SELECT ${NOTE_COLS} FROM notes WHERE id = ?1`).bind(id).first()

export const findNoteForUser = (db, id, userId) =>
  db.prepare(`SELECT ${NOTE_COLS} FROM notes WHERE id = ?1 AND user_id = ?2`)
    .bind(id, userId).first()

export const listNotesIn = async (db, userId, notebookId) => {
  const sql = notebookId
    ? `SELECT ${NOTE_COLS} FROM notes
         WHERE user_id = ?1 AND notebook_id = ?2
         ORDER BY sort_order ASC, created_at ASC`
    : `SELECT ${NOTE_COLS} FROM notes
         WHERE user_id = ?1 AND notebook_id IS NULL
         ORDER BY sort_order ASC, created_at ASC`
  const stmt = notebookId
    ? db.prepare(sql).bind(userId, notebookId)
    : db.prepare(sql).bind(userId)
  const { results } = await stmt.all()
  return results || []
}

const nullableFlag = (value) => (value === undefined ? 0 : 1)

export const updateNote = async (db, id, { title, content, icon, cover, notebookId, sortOrder }) => {
  await db.prepare(
    `UPDATE notes
        SET title       = COALESCE(?2, title),
            content     = COALESCE(?3, content),
            icon        = CASE WHEN ?4 = 1 THEN ?5  ELSE icon        END,
            cover       = CASE WHEN ?6 = 1 THEN ?7  ELSE cover       END,
            notebook_id = COALESCE(?8, notebook_id),
            sort_order  = COALESCE(?9, sort_order),
            updated_at  = datetime('now')
      WHERE id = ?1`
  ).bind(
    id,
    title      ?? null,
    content    ?? null,
    nullableFlag(icon),  icon  ?? null,
    nullableFlag(cover), cover ?? null,
    notebookId ?? null,
    sortOrder  ?? null,
  ).run()
  return findNoteById(db, id)
}

export const deleteNote = (db, id) =>
  db.prepare('DELETE FROM notes WHERE id = ?1').bind(id).run()
