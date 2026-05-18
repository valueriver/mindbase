// profile_blocks:个人档的 block 列表。
const COLS = `id, title, content, sort_order, created_at, updated_at`

export const listBlocks = async (db) => {
  const result = await db.prepare(
    `SELECT ${COLS} FROM profile_blocks
      ORDER BY sort_order ASC, created_at ASC`
  ).all()
  return result?.results || []
}

export const getBlock = (db, id) =>
  db.prepare(`SELECT ${COLS} FROM profile_blocks WHERE id = ?1`).bind(id).first()

export const insertBlock = async (db, { id, title = '', content = '', sort_order = 0 }) => {
  await db.prepare(
    `INSERT INTO profile_blocks (id, title, content, sort_order, created_at, updated_at)
     VALUES (?1, ?2, ?3, ?4, datetime('now'), datetime('now'))`
  ).bind(id, String(title ?? ''), String(content ?? ''), Number(sort_order) || 0).run()
  return getBlock(db, id)
}

export const updateBlock = async (db, id, patch = {}) => {
  const sets = []
  const binds = []
  let i = 1
  if (patch.title !== undefined) {
    sets.push(`title = ?${i++}`)
    binds.push(String(patch.title ?? ''))
  }
  if (patch.content !== undefined) {
    sets.push(`content = ?${i++}`)
    binds.push(String(patch.content ?? ''))
  }
  if (patch.sort_order !== undefined) {
    sets.push(`sort_order = ?${i++}`)
    binds.push(Number(patch.sort_order) || 0)
  }
  sets.push(`updated_at = datetime('now')`)
  binds.push(id)
  await db.prepare(
    `UPDATE profile_blocks SET ${sets.join(', ')} WHERE id = ?${i}`
  ).bind(...binds).run()
  return getBlock(db, id)
}

export const deleteBlock = (db, id) =>
  db.prepare(`DELETE FROM profile_blocks WHERE id = ?1`).bind(id).run()

export const reorderBlocks = async (db, ids) => {
  if (!Array.isArray(ids) || ids.length === 0) return
  const stmts = ids.map((id, idx) =>
    db.prepare(`UPDATE profile_blocks SET sort_order = ?1, updated_at = datetime('now') WHERE id = ?2`)
      .bind(idx, id)
  )
  await db.batch(stmts)
}
