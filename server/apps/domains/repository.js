// 域名。
const COLS = `id, domain, registrar, expire_date, status, note, created_at, updated_at`

export const listDomains = (db) =>
  db.prepare(
    `SELECT ${COLS} FROM domains_items
     ORDER BY (expire_date IS NULL), expire_date ASC, domain ASC`
  ).all()

export const findDomainById = (db, id) =>
  db.prepare(`SELECT ${COLS} FROM domains_items WHERE id = ?1`).bind(id).first()

export const insertDomain = async (db, { id, domain, registrar, expire_date, status, note }) => {
  await db.prepare(
    `INSERT INTO domains_items (id, domain, registrar, expire_date, status, note, created_at, updated_at)
     VALUES (?1, ?2, ?3, ?4, ?5, ?6, datetime('now'), datetime('now'))`
  ).bind(id, domain, registrar, expire_date, status, note).run()
  return findDomainById(db, id)
}

export const updateDomain = async (db, id, { domain, registrar, expire_date, status, note }) => {
  await db.prepare(
    `UPDATE domains_items
        SET domain      = COALESCE(?2, domain),
            registrar   = COALESCE(?3, registrar),
            expire_date = CASE WHEN ?5 = 1 THEN ?4 ELSE expire_date END,
            status      = COALESCE(?6, status),
            note        = COALESCE(?7, note),
            updated_at  = datetime('now')
      WHERE id = ?1`
  ).bind(
    id,
    domain ?? null,
    registrar ?? null,
    expire_date ?? null,
    expire_date !== undefined ? 1 : 0,
    status ?? null,
    note ?? null,
  ).run()
  return findDomainById(db, id)
}

export const deleteDomain = (db, id) =>
  db.prepare(`DELETE FROM domains_items WHERE id = ?1`).bind(id).run()
