// 菜谱仓储。
const COLS = `id, title, cuisine, servings, prep_min, ingredients, steps, note, cover, created_at, updated_at`

export const listRecipes = (db) =>
  db.prepare(`SELECT ${COLS} FROM app_recipes_items ORDER BY created_at DESC`).all()

export const findRecipeById = (db, id) =>
  db.prepare(`SELECT ${COLS} FROM app_recipes_items WHERE id = ?1`).bind(id).first()

export const insertRecipe = async (db, r) => {
  await db.prepare(
    `INSERT INTO app_recipes_items
       (id, title, cuisine, servings, prep_min, ingredients, steps, note, cover, created_at, updated_at)
     VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, datetime('now'), datetime('now'))`
  ).bind(r.id, r.title, r.cuisine, r.servings, r.prep_min, r.ingredients, r.steps, r.note, r.cover).run()
  return findRecipeById(db, r.id)
}

export const updateRecipe = async (db, id, patch) => {
  const sets = []
  const binds = [id]
  const push = (col, val) => { binds.push(val); sets.push(`${col} = ?${binds.length}`) }
  for (const col of ['title','cuisine','servings','prep_min','ingredients','steps','note','cover']) {
    if (patch[col] !== undefined) push(col, patch[col])
  }
  if (sets.length) {
    sets.push(`updated_at = datetime('now')`)
    await db.prepare(`UPDATE app_recipes_items SET ${sets.join(', ')} WHERE id = ?1`).bind(...binds).run()
  }
  return findRecipeById(db, id)
}

export const deleteRecipe = (db, id) =>
  db.prepare(`DELETE FROM app_recipes_items WHERE id = ?1`).bind(id).run()
