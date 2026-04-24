const NB_COLS = 'id, user_id, parent_id, name, icon, cover, sort_order, created_at, updated_at'

export const createNotebook = async (db, { id, userId, parentId, name, icon, cover }) => {
  await db.prepare(
    `INSERT INTO notebooks (id, user_id, parent_id, name, icon, cover, sort_order, created_at, updated_at)
     VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, datetime('now'), datetime('now'))`
  ).bind(id, userId, parentId ?? null, name, icon ?? null, cover ?? null, Date.now()).run()
  return findNotebookById(db, id)
}

export const findNotebookById = (db, id) =>
  db.prepare(`SELECT ${NB_COLS} FROM notebooks WHERE id = ?1`).bind(id).first()

export const findNotebookForUser = (db, id, userId) =>
  db.prepare(`SELECT ${NB_COLS} FROM notebooks WHERE id = ?1 AND user_id = ?2`)
    .bind(id, userId).first()

export const listNotebooksUnder = async (db, userId, parentId) => {
  const sql = parentId
    ? `SELECT ${NB_COLS} FROM notebooks WHERE user_id = ?1 AND parent_id = ?2 ORDER BY sort_order ASC, created_at ASC`
    : `SELECT ${NB_COLS} FROM notebooks WHERE user_id = ?1 AND parent_id IS NULL ORDER BY sort_order ASC, created_at ASC`
  const stmt = parentId
    ? db.prepare(sql).bind(userId, parentId)
    : db.prepare(sql).bind(userId)
  const { results } = await stmt.all()
  return results || []
}

// COALESCE-with-flag pattern for fields that can be cleared to NULL:
// pass `undefined` to leave unchanged, pass `null` to clear.
const nullableFlag = (value) => (value === undefined ? 0 : 1)

export const updateNotebook = async (db, id, { name, icon, cover, parentId, sortOrder }) => {
  await db.prepare(
    `UPDATE notebooks
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
  db.prepare('DELETE FROM notebooks WHERE id = ?1').bind(id).run()

// 递归收集祖先链(含自身),用于面包屑。按根→当前顺序返回。
export const getNotebookAncestors = async (db, id, userId) => {
  const chain = []
  let current = await findNotebookForUser(db, id, userId)
  const seen = new Set()
  while (current && !seen.has(current.id)) {
    chain.push(current)
    seen.add(current.id)
    if (!current.parent_id) break
    current = await findNotebookForUser(db, current.parent_id, userId)
  }
  return chain.reverse()
}

// 判断 descendantId 是否是 ancestorId 的后代(或同一个),
// 用于防止把笔记本移动到自己的子孙下,造成环。
export const isSelfOrDescendant = async (db, userId, ancestorId, descendantId) => {
  if (!descendantId) return false
  if (ancestorId === descendantId) return true
  let cursor = await findNotebookForUser(db, descendantId, userId)
  const seen = new Set()
  while (cursor && cursor.parent_id && !seen.has(cursor.id)) {
    seen.add(cursor.id)
    if (cursor.parent_id === ancestorId) return true
    cursor = await findNotebookForUser(db, cursor.parent_id, userId)
  }
  return false
}
