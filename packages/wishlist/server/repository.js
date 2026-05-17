// 心愿单仓储:单表 app_wishlist_items 的 CRUD。
const COLS = `id, name, url, price, priority, status, note, cover, created_at, updated_at`

export const listWishlist = (db, { status = null } = {}) => {
  if (status) {
    return db.prepare(
      `SELECT ${COLS} FROM app_wishlist_items
        WHERE status = ?1
        ORDER BY created_at DESC`
    ).bind(status).all()
  }
  return db.prepare(
    `SELECT ${COLS} FROM app_wishlist_items
      ORDER BY created_at DESC`
  ).all()
}

export const findWishlistById = (db, id) =>
  db.prepare(`SELECT ${COLS} FROM app_wishlist_items WHERE id = ?1`).bind(id).first()

export const insertWishlist = async (db, { id, name, url, price, priority, status, note, cover }) => {
  await db.prepare(
    `INSERT INTO app_wishlist_items (id, name, url, price, priority, status, note, cover, created_at, updated_at)
     VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, datetime('now'), datetime('now'))`
  ).bind(id, name, url, price, priority, status, note, cover).run()
  return findWishlistById(db, id)
}

export const updateWishlist = async (db, id, { name, url, price, priority, status, note, cover }) => {
  await db.prepare(
    `UPDATE app_wishlist_items
        SET name       = COALESCE(?2, name),
            url        = COALESCE(?3, url),
            price      = COALESCE(?4, price),
            priority   = COALESCE(?5, priority),
            status     = COALESCE(?6, status),
            note       = COALESCE(?7, note),
            cover      = CASE WHEN ?8 = '__keep__' THEN cover ELSE ?8 END,
            updated_at = datetime('now')
      WHERE id = ?1`
  ).bind(
    id,
    name ?? null,
    url ?? null,
    price ?? null,
    priority ?? null,
    status ?? null,
    note ?? null,
    cover === undefined ? '__keep__' : cover,
  ).run()
  return findWishlistById(db, id)
}

export const deleteWishlist = (db, id) =>
  db.prepare(`DELETE FROM app_wishlist_items WHERE id = ?1`).bind(id).run()
