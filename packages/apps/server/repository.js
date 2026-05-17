// App 清单仓储。
const COLS = `id, name, platform, category, url, status, note, cover, created_at, updated_at`

export const listApps = (db, { status = null, limit = 200, offset = 0 } = {}) => {
  if (status) {
    return db.prepare(
      `SELECT ${COLS} FROM app_apps_items WHERE status = ?1
        ORDER BY created_at DESC LIMIT ?2 OFFSET ?3`
    ).bind(status, limit, offset).all()
  }
  return db.prepare(
    `SELECT ${COLS} FROM app_apps_items ORDER BY created_at DESC LIMIT ?1 OFFSET ?2`
  ).bind(limit, offset).all()
}

export const findAppById = (db, id) =>
  db.prepare(`SELECT ${COLS} FROM app_apps_items WHERE id = ?1`).bind(id).first()

export const insertApp = async (db, { id, name, platform = '', category = '', url = '', status = 'using', note = '', cover = null }) => {
  await db.prepare(
    `INSERT INTO app_apps_items (id, name, platform, category, url, status, note, cover, created_at, updated_at)
     VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, datetime('now'), datetime('now'))`
  ).bind(id, name, platform, category, url, status, note, cover).run()
  return findAppById(db, id)
}

export const updateApp = async (db, id, patch) => {
  const sets = []
  const binds = [id]
  const push = (col, val) => { binds.push(val); sets.push(`${col} = ?${binds.length}`) }
  if (patch.name     !== undefined) push('name', patch.name)
  if (patch.platform !== undefined) push('platform', patch.platform)
  if (patch.category !== undefined) push('category', patch.category)
  if (patch.url      !== undefined) push('url', patch.url)
  if (patch.status   !== undefined) push('status', patch.status)
  if (patch.note     !== undefined) push('note', patch.note)
  if (patch.cover    !== undefined) push('cover', patch.cover)
  if (sets.length) {
    sets.push(`updated_at = datetime('now')`)
    await db.prepare(`UPDATE app_apps_items SET ${sets.join(', ')} WHERE id = ?1`).bind(...binds).run()
  }
  return findAppById(db, id)
}

export const deleteApp = (db, id) =>
  db.prepare(`DELETE FROM app_apps_items WHERE id = ?1`).bind(id).run()
