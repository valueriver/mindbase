// 邮箱地址簿。
const COLS = `id, address, label, provider, note, created_at, updated_at`

export const listEmails = (db) =>
  db.prepare(`SELECT ${COLS} FROM app_emails_addresses ORDER BY created_at DESC`).all()

export const findEmailById = (db, id) =>
  db.prepare(`SELECT ${COLS} FROM app_emails_addresses WHERE id = ?1`).bind(id).first()

export const insertEmail = async (db, { id, address, label, provider, note }) => {
  await db.prepare(
    `INSERT INTO app_emails_addresses (id, address, label, provider, note, created_at, updated_at)
     VALUES (?1, ?2, ?3, ?4, ?5, datetime('now'), datetime('now'))`
  ).bind(id, address, label, provider, note).run()
  return findEmailById(db, id)
}

export const updateEmail = async (db, id, { address, label, provider, note }) => {
  await db.prepare(
    `UPDATE app_emails_addresses
        SET address    = COALESCE(?2, address),
            label      = COALESCE(?3, label),
            provider   = COALESCE(?4, provider),
            note       = COALESCE(?5, note),
            updated_at = datetime('now')
      WHERE id = ?1`
  ).bind(
    id,
    address ?? null,
    label ?? null,
    provider ?? null,
    note ?? null,
  ).run()
  return findEmailById(db, id)
}

export const deleteEmail = (db, id) =>
  db.prepare(`DELETE FROM app_emails_addresses WHERE id = ?1`).bind(id).run()
