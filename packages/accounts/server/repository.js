// 网络账号。
const COLS = `id, name, url, username, email, note, created_at, updated_at`

export const listAccounts = (db) =>
  db.prepare(`SELECT ${COLS} FROM app_accounts_services ORDER BY created_at DESC`).all()

export const findAccountById = (db, id) =>
  db.prepare(`SELECT ${COLS} FROM app_accounts_services WHERE id = ?1`).bind(id).first()

export const insertAccount = async (db, { id, name, url, username, email, note }) => {
  await db.prepare(
    `INSERT INTO app_accounts_services (id, name, url, username, email, note, created_at, updated_at)
     VALUES (?1, ?2, ?3, ?4, ?5, ?6, datetime('now'), datetime('now'))`
  ).bind(id, name, url, username, email, note).run()
  return findAccountById(db, id)
}

export const updateAccount = async (db, id, { name, url, username, email, note }) => {
  await db.prepare(
    `UPDATE app_accounts_services
        SET name       = COALESCE(?2, name),
            url        = COALESCE(?3, url),
            username   = COALESCE(?4, username),
            email      = COALESCE(?5, email),
            note       = COALESCE(?6, note),
            updated_at = datetime('now')
      WHERE id = ?1`
  ).bind(
    id,
    name ?? null,
    url ?? null,
    username ?? null,
    email ?? null,
    note ?? null,
  ).run()
  return findAccountById(db, id)
}

export const deleteAccount = (db, id) =>
  db.prepare(`DELETE FROM app_accounts_services WHERE id = ?1`).bind(id).run()
