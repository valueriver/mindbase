const COLS = 'id, parent_id, title, done, sort_order, created_at, updated_at'

export const listTodos = (db) =>
  db.prepare(
    `SELECT ${COLS} FROM todos
      ORDER BY parent_id IS NOT NULL, done ASC, sort_order ASC, created_at ASC`
  ).all()

export const findTodoById = (db, id) =>
  db.prepare(`SELECT ${COLS} FROM todos WHERE id = ?1`).bind(id).first()

export const insertTodo = async (db, { id, parentId, title }) => {
  await db.prepare(
    `INSERT INTO todos (id, parent_id, title, done, sort_order, created_at, updated_at)
     VALUES (?1, ?2, ?3, 0, ?4, datetime('now'), datetime('now'))`
  ).bind(id, parentId ?? null, title, Date.now()).run()
  return findTodoById(db, id)
}

export const updateTodo = async (db, id, { title, done, sortOrder }) => {
  await db.prepare(
    `UPDATE todos
        SET title      = COALESCE(?2, title),
            done       = COALESCE(?3, done),
            sort_order = COALESCE(?4, sort_order),
            updated_at = datetime('now')
      WHERE id = ?1`
  ).bind(
    id,
    title ?? null,
    done === undefined ? null : (done ? 1 : 0),
    sortOrder ?? null,
  ).run()
  return findTodoById(db, id)
}

export const deleteTodo = (db, id) =>
  db.prepare(`DELETE FROM todos WHERE id = ?1`).bind(id).run()
