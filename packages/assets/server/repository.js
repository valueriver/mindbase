// 资产/负债。
const COLS = `id, name, kind, category, amount, note, created_at, updated_at`

export const listAssets = (db) =>
  db.prepare(`SELECT ${COLS} FROM app_assets_items ORDER BY kind ASC, amount DESC`).all()

export const findAssetById = (db, id) =>
  db.prepare(`SELECT ${COLS} FROM app_assets_items WHERE id = ?1`).bind(id).first()

export const insertAsset = async (db, { id, name, kind, category, amount, note }) => {
  await db.prepare(
    `INSERT INTO app_assets_items (id, name, kind, category, amount, note, created_at, updated_at)
     VALUES (?1, ?2, ?3, ?4, ?5, ?6, datetime('now'), datetime('now'))`
  ).bind(id, name, kind, category, amount, note).run()
  return findAssetById(db, id)
}

export const updateAsset = async (db, id, { name, kind, category, amount, note }) => {
  await db.prepare(
    `UPDATE app_assets_items
        SET name       = COALESCE(?2, name),
            kind       = COALESCE(?3, kind),
            category   = COALESCE(?4, category),
            amount     = COALESCE(?5, amount),
            note       = COALESCE(?6, note),
            updated_at = datetime('now')
      WHERE id = ?1`
  ).bind(id, name ?? null, kind ?? null, category ?? null, amount ?? null, note ?? null).run()
  return findAssetById(db, id)
}

export const deleteAsset = (db, id) =>
  db.prepare(`DELETE FROM app_assets_items WHERE id = ?1`).bind(id).run()
