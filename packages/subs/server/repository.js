// 订阅服务清单。
const COLS = `id, name, amount, cycle, next_charge, note, created_at, updated_at`

export const listSubs = (db) =>
  db.prepare(
    `SELECT ${COLS} FROM app_subs_services
      ORDER BY (next_charge IS NULL), next_charge ASC, created_at DESC`
  ).all()

export const findSubById = (db, id) =>
  db.prepare(`SELECT ${COLS} FROM app_subs_services WHERE id = ?1`).bind(id).first()

export const insertSub = async (db, { id, name, amount, cycle, nextCharge, note }) => {
  await db.prepare(
    `INSERT INTO app_subs_services (id, name, amount, cycle, next_charge, note, created_at, updated_at)
     VALUES (?1, ?2, ?3, ?4, ?5, ?6, datetime('now'), datetime('now'))`
  ).bind(id, name, amount, cycle, nextCharge, note).run()
  return findSubById(db, id)
}

export const updateSub = async (db, id, { name, amount, cycle, nextCharge, note }) => {
  await db.prepare(
    `UPDATE app_subs_services
        SET name        = COALESCE(?2, name),
            amount      = COALESCE(?3, amount),
            cycle       = COALESCE(?4, cycle),
            next_charge = CASE WHEN ?5 = '__keep__' THEN next_charge ELSE ?5 END,
            note        = COALESCE(?6, note),
            updated_at  = datetime('now')
      WHERE id = ?1`
  ).bind(id, name ?? null, amount ?? null, cycle ?? null, nextCharge ?? '__keep__', note ?? null).run()
  return findSubById(db, id)
}

export const deleteSub = (db, id) =>
  db.prepare(`DELETE FROM app_subs_services WHERE id = ?1`).bind(id).run()
