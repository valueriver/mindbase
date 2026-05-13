const COLS = 'id, title, done, sort_order, created_at, updated_at'

export const listTodos = (db) =>
  db.prepare(
    `SELECT ${COLS} FROM todos
      ORDER BY done ASC, sort_order ASC, created_at ASC`
  ).all()

export const findTodoById = (db, id) =>
  db.prepare(`SELECT ${COLS} FROM todos WHERE id = ?1`).bind(id).first()

export const insertTodo = async (db, { id, title }) => {
  await db.prepare(
    `INSERT INTO todos (id, title, done, sort_order, created_at, updated_at)
     VALUES (?1, ?2, 0, ?3, datetime('now'), datetime('now'))`
  ).bind(id, title, Date.now()).run()
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
