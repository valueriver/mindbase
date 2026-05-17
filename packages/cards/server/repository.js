// 银行卡。
const COLS = `id, name, bank, card_number, type, expire, note, created_at, updated_at`

export const listCards = (db) =>
  db.prepare(`SELECT ${COLS} FROM app_cards_items ORDER BY created_at DESC`).all()

export const findCardById = (db, id) =>
  db.prepare(`SELECT ${COLS} FROM app_cards_items WHERE id = ?1`).bind(id).first()

export const insertCard = async (db, { id, name, bank, card_number, type, expire, note }) => {
  await db.prepare(
    `INSERT INTO app_cards_items (id, name, bank, card_number, type, expire, note, created_at, updated_at)
     VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, datetime('now'), datetime('now'))`
  ).bind(id, name, bank, card_number, type, expire, note).run()
  return findCardById(db, id)
}

export const updateCard = async (db, id, { name, bank, card_number, type, expire, note }) => {
  await db.prepare(
    `UPDATE app_cards_items
        SET name        = COALESCE(?2, name),
            bank        = COALESCE(?3, bank),
            card_number = COALESCE(?4, card_number),
            type        = COALESCE(?5, type),
            expire      = COALESCE(?6, expire),
            note        = COALESCE(?7, note),
            updated_at  = datetime('now')
      WHERE id = ?1`
  ).bind(
    id,
    name ?? null,
    bank ?? null,
    card_number ?? null,
    type ?? null,
    expire ?? null,
    note ?? null,
  ).run()
  return findCardById(db, id)
}

export const deleteCard = (db, id) =>
  db.prepare(`DELETE FROM app_cards_items WHERE id = ?1`).bind(id).run()
