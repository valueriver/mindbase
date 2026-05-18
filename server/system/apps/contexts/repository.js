const COLS = 'id, content, source_app, source_id, sort_order, created_at, updated_at'

export const listContexts = (db) =>
  db.prepare(
    `SELECT ${COLS} FROM contexts ORDER BY sort_order ASC, created_at ASC`
  ).all()

export const findContextById = (db, id) =>
  db.prepare(`SELECT ${COLS} FROM contexts WHERE id = ?1`).bind(id).first()

export const findContextBySource = (db, sourceApp, sourceId) =>
  db.prepare(
    `SELECT ${COLS} FROM contexts WHERE source_app = ?1 AND source_id = ?2`
  ).bind(sourceApp, sourceId).first()

export const insertContext = async (db, { id, content, sourceApp, sourceId, sortOrder }) => {
  await db.prepare(
    `INSERT INTO contexts (id, content, source_app, source_id, sort_order, created_at, updated_at)
     VALUES (?1, ?2, ?3, ?4, ?5, datetime('now'), datetime('now'))`
  ).bind(id, content, sourceApp, sourceId ?? null, sortOrder).run()
  return findContextById(db, id)
}

export const upsertContext = async (db, { id, content, sourceApp, sourceId, sortOrder }) => {
  await db.prepare(
    `INSERT INTO contexts (id, content, source_app, source_id, sort_order, created_at, updated_at)
     VALUES (?1, ?2, ?3, ?4, ?5, datetime('now'), datetime('now'))
     ON CONFLICT(source_app, source_id) DO UPDATE SET
       content    = excluded.content,
       sort_order = excluded.sort_order,
       updated_at = datetime('now')`
  ).bind(id, content, sourceApp, sourceId ?? null, sortOrder).run()
  return findContextBySource(db, sourceApp, sourceId)
}

export const updateContext = async (db, id, patch) => {
  const sets = []
  const binds = [id]
  const push = (col, val) => { binds.push(val); sets.push(`${col} = ?${binds.length}`) }
  if (patch.content   !== undefined) push('content',    patch.content)
  if (patch.sortOrder !== undefined) push('sort_order', patch.sortOrder)
  if (sets.length) {
    sets.push(`updated_at = datetime('now')`)
    await db.prepare(`UPDATE contexts SET ${sets.join(', ')} WHERE id = ?1`).bind(...binds).run()
  }
  return findContextById(db, id)
}

export const deleteContext = (db, id) =>
  db.prepare(`DELETE FROM contexts WHERE id = ?1`).bind(id).run()

export const deleteContextBySource = (db, sourceApp, sourceId) =>
  db.prepare(
    `DELETE FROM contexts WHERE source_app = ?1 AND source_id = ?2`
  ).bind(sourceApp, sourceId).run()
