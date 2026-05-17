// 简单 KV:settings(key, value, updated_at)

export const getAllSettings = async (db) => {
  const r = await db.prepare(`SELECT key, value FROM settings`).all()
  const out = {}
  for (const row of r?.results || []) out[row.key] = row.value
  return out
}

export const getSetting = async (db, key) => {
  const row = await db.prepare(`SELECT value FROM settings WHERE key = ?1`).bind(key).first()
  return row?.value ?? null
}

export const setSetting = async (db, key, value) => {
  await db.prepare(
    `INSERT INTO settings (key, value, updated_at) VALUES (?1, ?2, datetime('now'))
     ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = datetime('now')`
  ).bind(key, value ?? null).run()
}
