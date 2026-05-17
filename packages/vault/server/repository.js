// 密码箱条目。
const COLS = `id, name, url, username, password, note, created_at, updated_at`

export const listVault = (db) =>
  db.prepare(
    `SELECT ${COLS} FROM app_vault_entries ORDER BY name COLLATE NOCASE ASC, created_at DESC`
  ).all()

export const findVaultById = (db, id) =>
  db.prepare(`SELECT ${COLS} FROM app_vault_entries WHERE id = ?1`).bind(id).first()

export const insertVault = async (db, { id, name, url, username, password, note }) => {
  await db.prepare(
    `INSERT INTO app_vault_entries (id, name, url, username, password, note, created_at, updated_at)
     VALUES (?1, ?2, ?3, ?4, ?5, ?6, datetime('now'), datetime('now'))`
  ).bind(id, name, url, username, password, note).run()
  return findVaultById(db, id)
}

export const updateVault = async (db, id, { name, url, username, password, note }) => {
  await db.prepare(
    `UPDATE app_vault_entries
        SET name       = COALESCE(?2, name),
            url        = COALESCE(?3, url),
            username   = COALESCE(?4, username),
            password   = COALESCE(?5, password),
            note       = COALESCE(?6, note),
            updated_at = datetime('now')
      WHERE id = ?1`
  ).bind(id, name ?? null, url ?? null, username ?? null, password ?? null, note ?? null).run()
  return findVaultById(db, id)
}

export const deleteVault = (db, id) =>
  db.prepare(`DELETE FROM app_vault_entries WHERE id = ?1`).bind(id).run()
