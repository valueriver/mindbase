// 目标仓储。
const COLS = `id, title, target, progress, unit, status, note, created_at, updated_at`

export const listGoals = (db, { status = null } = {}) => {
  if (status) {
    return db.prepare(
      `SELECT ${COLS} FROM app_goals_items
        WHERE status = ?1
        ORDER BY created_at DESC`
    ).bind(status).all()
  }
  return db.prepare(`SELECT ${COLS} FROM app_goals_items ORDER BY created_at DESC`).all()
}

export const findGoalById = (db, id) =>
  db.prepare(`SELECT ${COLS} FROM app_goals_items WHERE id = ?1`).bind(id).first()

export const insertGoal = async (db, r) => {
  await db.prepare(
    `INSERT INTO app_goals_items
       (id, title, target, progress, unit, status, note, created_at, updated_at)
     VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, datetime('now'), datetime('now'))`
  ).bind(r.id, r.title, r.target, r.progress, r.unit, r.status, r.note).run()
  return findGoalById(db, r.id)
}

export const updateGoal = async (db, id, patch) => {
  const sets = []
  const binds = [id]
  const push = (col, val) => { binds.push(val); sets.push(`${col} = ?${binds.length}`) }
  for (const col of ['title','target','progress','unit','status','note']) {
    if (patch[col] !== undefined) push(col, patch[col])
  }
  if (sets.length) {
    sets.push(`updated_at = datetime('now')`)
    await db.prepare(`UPDATE app_goals_items SET ${sets.join(', ')} WHERE id = ?1`).bind(...binds).run()
  }
  return findGoalById(db, id)
}

export const deleteGoal = (db, id) =>
  db.prepare(`DELETE FROM app_goals_items WHERE id = ?1`).bind(id).run()
