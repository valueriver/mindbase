// 大模型 API key 仓储。
const COLS = `id, provider, name, api_key, base_url, default_model, quota_note, note, created_at, updated_at`

export const listLlms = (db) =>
  db.prepare(`SELECT ${COLS} FROM app_llms_keys ORDER BY created_at DESC`).all()

export const findLlmById = (db, id) =>
  db.prepare(`SELECT ${COLS} FROM app_llms_keys WHERE id = ?1`).bind(id).first()

export const insertLlm = async (db, r) => {
  await db.prepare(
    `INSERT INTO app_llms_keys
       (id, provider, name, api_key, base_url, default_model, quota_note, note, created_at, updated_at)
     VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, datetime('now'), datetime('now'))`
  ).bind(r.id, r.provider, r.name, r.api_key, r.base_url, r.default_model, r.quota_note, r.note).run()
  return findLlmById(db, r.id)
}

export const updateLlm = async (db, id, patch) => {
  const sets = []
  const binds = [id]
  const push = (col, val) => { binds.push(val); sets.push(`${col} = ?${binds.length}`) }
  for (const col of ['provider','name','api_key','base_url','default_model','quota_note','note']) {
    if (patch[col] !== undefined) push(col, patch[col])
  }
  if (sets.length) {
    sets.push(`updated_at = datetime('now')`)
    await db.prepare(`UPDATE app_llms_keys SET ${sets.join(', ')} WHERE id = ?1`).bind(...binds).run()
  }
  return findLlmById(db, id)
}

export const deleteLlm = (db, id) =>
  db.prepare(`DELETE FROM app_llms_keys WHERE id = ?1`).bind(id).run()
