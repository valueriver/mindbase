// 指令集仓储。
const COLS = `id, title, content, tags, model, note, created_at, updated_at`

export const listPrompts = (db) =>
  db.prepare(`SELECT ${COLS} FROM app_prompts_items ORDER BY updated_at DESC`).all()

export const findPromptById = (db, id) =>
  db.prepare(`SELECT ${COLS} FROM app_prompts_items WHERE id = ?1`).bind(id).first()

export const insertPrompt = async (db, { id, title, content, tags, model, note }) => {
  await db.prepare(
    `INSERT INTO app_prompts_items (id, title, content, tags, model, note, created_at, updated_at)
     VALUES (?1, ?2, ?3, ?4, ?5, ?6, datetime('now'), datetime('now'))`
  ).bind(id, title, content, tags, model, note).run()
  return findPromptById(db, id)
}

export const updatePrompt = async (db, id, { title, content, tags, model, note }) => {
  await db.prepare(
    `UPDATE app_prompts_items
        SET title      = COALESCE(?2, title),
            content    = COALESCE(?3, content),
            tags       = COALESCE(?4, tags),
            model      = COALESCE(?5, model),
            note       = COALESCE(?6, note),
            updated_at = datetime('now')
      WHERE id = ?1`
  ).bind(id, title ?? null, content ?? null, tags ?? null, model ?? null, note ?? null).run()
  return findPromptById(db, id)
}

export const deletePrompt = (db, id) =>
  db.prepare(`DELETE FROM app_prompts_items WHERE id = ?1`).bind(id).run()
