// 游戏清单仓储。
const COLS = `id, title, platform, status, hours_played, rating, note, cover, created_at, updated_at`

export const listGames = (db, { status = null, limit = 200, offset = 0 } = {}) => {
  if (status) {
    return db.prepare(
      `SELECT ${COLS} FROM app_games_items WHERE status = ?1
        ORDER BY created_at DESC LIMIT ?2 OFFSET ?3`
    ).bind(status, limit, offset).all()
  }
  return db.prepare(
    `SELECT ${COLS} FROM app_games_items ORDER BY created_at DESC LIMIT ?1 OFFSET ?2`
  ).bind(limit, offset).all()
}

export const findGameById = (db, id) =>
  db.prepare(`SELECT ${COLS} FROM app_games_items WHERE id = ?1`).bind(id).first()

export const insertGame = async (db, { id, title, platform = '', status = 'want', hours_played = 0, rating = 0, note = '', cover = null }) => {
  await db.prepare(
    `INSERT INTO app_games_items (id, title, platform, status, hours_played, rating, note, cover, created_at, updated_at)
     VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, datetime('now'), datetime('now'))`
  ).bind(id, title, platform, status, hours_played, rating, note, cover).run()
  return findGameById(db, id)
}

export const updateGame = async (db, id, patch) => {
  const sets = []
  const binds = [id]
  const push = (col, val) => { binds.push(val); sets.push(`${col} = ?${binds.length}`) }
  if (patch.title        !== undefined) push('title', patch.title)
  if (patch.platform     !== undefined) push('platform', patch.platform)
  if (patch.status       !== undefined) push('status', patch.status)
  if (patch.hours_played !== undefined) push('hours_played', patch.hours_played)
  if (patch.rating       !== undefined) push('rating', patch.rating)
  if (patch.note         !== undefined) push('note', patch.note)
  if (patch.cover        !== undefined) push('cover', patch.cover)
  if (sets.length) {
    sets.push(`updated_at = datetime('now')`)
    await db.prepare(`UPDATE app_games_items SET ${sets.join(', ')} WHERE id = ?1`).bind(...binds).run()
  }
  return findGameById(db, id)
}

export const deleteGame = (db, id) =>
  db.prepare(`DELETE FROM app_games_items WHERE id = ?1`).bind(id).run()
