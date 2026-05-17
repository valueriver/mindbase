// 通讯录仓储。
const COLS = `id, name, nickname, phone, email, company, title, address, birthday, note, avatar, created_at, updated_at`

export const listContacts = (db) =>
  db.prepare(
    `SELECT ${COLS} FROM app_contacts_people
      ORDER BY name COLLATE NOCASE ASC, created_at DESC`
  ).all()

export const findContactById = (db, id) =>
  db.prepare(`SELECT ${COLS} FROM app_contacts_people WHERE id = ?1`).bind(id).first()

export const insertContact = async (db, c) => {
  await db.prepare(
    `INSERT INTO app_contacts_people
       (id, name, nickname, phone, email, company, title, address, birthday, note, avatar, created_at, updated_at)
     VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, datetime('now'), datetime('now'))`
  ).bind(
    c.id, c.name, c.nickname ?? '', c.phone ?? '', c.email ?? '',
    c.company ?? '', c.title ?? '', c.address ?? '',
    c.birthday ?? null, c.note ?? '', c.avatar ?? null,
  ).run()
  return findContactById(db, c.id)
}

export const updateContact = async (db, id, p) => {
  await db.prepare(
    `UPDATE app_contacts_people
        SET name       = COALESCE(?2, name),
            nickname   = COALESCE(?3, nickname),
            phone      = COALESCE(?4, phone),
            email      = COALESCE(?5, email),
            company    = COALESCE(?6, company),
            title      = COALESCE(?7, title),
            address    = COALESCE(?8, address),
            birthday   = CASE WHEN ?9 = '__keep__' THEN birthday ELSE NULLIF(?9, '__null__') END,
            note       = COALESCE(?10, note),
            avatar     = CASE WHEN ?11 = '__keep__' THEN avatar ELSE NULLIF(?11, '__null__') END,
            updated_at = datetime('now')
      WHERE id = ?1`
  ).bind(
    id,
    p.name ?? null,
    p.nickname ?? null,
    p.phone ?? null,
    p.email ?? null,
    p.company ?? null,
    p.title ?? null,
    p.address ?? null,
    p.birthday === undefined ? '__keep__' : (p.birthday === null ? '__null__' : p.birthday),
    p.note ?? null,
    p.avatar === undefined ? '__keep__' : (p.avatar === null ? '__null__' : p.avatar),
  ).run()
  return findContactById(db, id)
}

export const deleteContact = (db, id) =>
  db.prepare(`DELETE FROM app_contacts_people WHERE id = ?1`).bind(id).run()
