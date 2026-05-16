// 回忆:每天一条。
const COLS = `id, date, location, weather, mood, note, created_at, updated_at`

export const listMemories = (db) =>
  db.prepare(`SELECT ${COLS} FROM app_memories_days ORDER BY date DESC, created_at DESC`).all()

export const findMemoryById = (db, id) =>
  db.prepare(`SELECT ${COLS} FROM app_memories_days WHERE id = ?1`).bind(id).first()

export const insertMemory = async (db, { id, date, location, weather, mood, note }) => {
  await db.prepare(
    `INSERT INTO app_memories_days (id, date, location, weather, mood, note, created_at, updated_at)
     VALUES (?1, ?2, ?3, ?4, ?5, ?6, datetime('now'), datetime('now'))`
  ).bind(id, date, location, weather, mood, note).run()
  return findMemoryById(db, id)
}

export const updateMemory = async (db, id, { date, location, weather, mood, note }) => {
  await db.prepare(
    `UPDATE app_memories_days
        SET date       = COALESCE(?2, date),
            location   = COALESCE(?3, location),
            weather    = COALESCE(?4, weather),
            mood       = COALESCE(?5, mood),
            note       = COALESCE(?6, note),
            updated_at = datetime('now')
      WHERE id = ?1`
  ).bind(id, date ?? null, location ?? null, weather ?? null, mood ?? null, note ?? null).run()
  return findMemoryById(db, id)
}

export const deleteMemory = (db, id) =>
  db.prepare(`DELETE FROM app_memories_days WHERE id = ?1`).bind(id).run()
