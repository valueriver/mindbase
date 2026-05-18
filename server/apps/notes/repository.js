// Combined repository for notebooks (notes_notebooks) + pages (notes_pages).

// ---------- Notebooks ----------
const NB_COLS = 'id, parent_id, name, icon, cover, sort_order, created_at, updated_at'

export const createNotebook = async (db, { id, parentId, name, icon, cover }) => {
  await db.prepare(
    `INSERT INTO notes_notebooks (id, parent_id, name, icon, cover, sort_order, created_at, updated_at)
     VALUES (?1, ?2, ?3, ?4, ?5, ?6, datetime('now'), datetime('now'))`
  ).bind(id, parentId ?? null, name, icon ?? null, cover ?? null, Date.now()).run()
  return findNotebookById(db, id)
}

export const findNotebookById = (db, id) =>
  db.prepare(`SELECT ${NB_COLS} FROM notes_notebooks WHERE id = ?1`).bind(id).first()

export const listNotebooksUnder = async (db, parentId) => {
  const sql = parentId
    ? `SELECT ${NB_COLS} FROM notes_notebooks WHERE parent_id = ?1 ORDER BY sort_order ASC, created_at ASC`
    : `SELECT ${NB_COLS} FROM notes_notebooks WHERE parent_id IS NULL ORDER BY sort_order ASC, created_at ASC`
  const stmt = parentId ? db.prepare(sql).bind(parentId) : db.prepare(sql)
  const { results } = await stmt.all()
  return results || []
}

const nullableFlag = (value) => (value === undefined ? 0 : 1)

export const updateNotebook = async (db, id, { name, icon, cover, parentId, sortOrder }) => {
  await db.prepare(
    `UPDATE notes_notebooks
        SET name       = COALESCE(?2, name),
            icon       = CASE WHEN ?3 = 1 THEN ?4  ELSE icon       END,
            cover      = CASE WHEN ?5 = 1 THEN ?6  ELSE cover      END,
            parent_id  = CASE WHEN ?7 = 1 THEN ?8  ELSE parent_id  END,
            sort_order = COALESCE(?9, sort_order),
            updated_at = datetime('now')
      WHERE id = ?1`
  ).bind(
    id,
    name ?? null,
    nullableFlag(icon),     icon     ?? null,
    nullableFlag(cover),    cover    ?? null,
    nullableFlag(parentId), parentId ?? null,
    sortOrder ?? null,
  ).run()
  return findNotebookById(db, id)
}

export const deleteNotebook = (db, id) =>
  db.prepare('DELETE FROM notes_notebooks WHERE id = ?1').bind(id).run()

export const getNotebookAncestors = async (db, id) => {
  const chain = []
  let current = await findNotebookById(db, id)
  const seen = new Set()
  while (current && !seen.has(current.id)) {
    chain.push(current)
    seen.add(current.id)
    if (!current.parent_id) break
    current = await findNotebookById(db, current.parent_id)
  }
  return chain.reverse()
}

export const isSelfOrDescendant = async (db, ancestorId, descendantId) => {
  if (!descendantId) return false
  if (ancestorId === descendantId) return true
  let cursor = await findNotebookById(db, descendantId)
  const seen = new Set()
  while (cursor && cursor.parent_id && !seen.has(cursor.id)) {
    seen.add(cursor.id)
    if (cursor.parent_id === ancestorId) return true
    cursor = await findNotebookById(db, cursor.parent_id)
  }
  return false
}

// ---------- Notes (pages) ----------
const NOTE_COLS = 'id, notebook_id, title, content, icon, cover, sort_order, created_at, updated_at'

export const createNote = async (db, { id, notebookId, title, content, icon, cover }) => {
  await db.prepare(
    `INSERT INTO notes_pages (id, notebook_id, title, content, icon, cover, sort_order, created_at, updated_at)
     VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, datetime('now'), datetime('now'))`
  ).bind(id, notebookId, title ?? '', content ?? '', icon ?? null, cover ?? null, Date.now()).run()
  return findNoteById(db, id)
}

export const findNoteById = (db, id) =>
  db.prepare(`SELECT ${NOTE_COLS} FROM notes_pages WHERE id = ?1`).bind(id).first()

export const listNotesIn = async (db, notebookId) => {
  const sql = notebookId
    ? `SELECT ${NOTE_COLS} FROM notes_pages
         WHERE notebook_id = ?1
         ORDER BY sort_order ASC, created_at ASC`
    : `SELECT ${NOTE_COLS} FROM notes_pages
         WHERE notebook_id IS NULL
         ORDER BY sort_order ASC, created_at ASC`
  const stmt = notebookId ? db.prepare(sql).bind(notebookId) : db.prepare(sql)
  const { results } = await stmt.all()
  return results || []
}

export const updateNote = async (db, id, { title, content, icon, cover, notebookId, sortOrder }) => {
  await db.prepare(
    `UPDATE notes_pages
        SET title       = COALESCE(?2, title),
            content     = COALESCE(?3, content),
            icon        = CASE WHEN ?4 = 1 THEN ?5  ELSE icon        END,
            cover       = CASE WHEN ?6 = 1 THEN ?7  ELSE cover       END,
            notebook_id = CASE WHEN ?8 = 1 THEN ?9  ELSE notebook_id END,
            sort_order  = COALESCE(?10, sort_order),
            updated_at  = datetime('now')
      WHERE id = ?1`
  ).bind(
    id,
    title      ?? null,
    content    ?? null,
    nullableFlag(icon),       icon       ?? null,
    nullableFlag(cover),      cover      ?? null,
    nullableFlag(notebookId), notebookId ?? null,
    sortOrder  ?? null,
  ).run()
  return findNoteById(db, id)
}

export const deleteNote = (db, id) =>
  db.prepare('DELETE FROM notes_pages WHERE id = ?1').bind(id).run()
