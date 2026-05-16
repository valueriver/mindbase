// Home posts:主页时间轴上的用户帖子。author 是身份 slug —— 'user' / 'ai' / 'codex' / 'claude-code' / 'opencode' / 'cursor' / ... 任意短串。
const COLS = `id, author, content, created_at, updated_at`

export const listPosts = (db, { limit = 200, offset = 0 } = {}) =>
  db.prepare(
    `SELECT ${COLS} FROM app_home_posts
      ORDER BY created_at DESC
      LIMIT ?1 OFFSET ?2`
  ).bind(limit, offset).all()

export const findPostById = (db, id) =>
  db.prepare(`SELECT ${COLS} FROM app_home_posts WHERE id = ?1`).bind(id).first()

export const insertPost = async (db, { id, content, author = 'user' }) => {
  await db.prepare(
    `INSERT INTO app_home_posts (id, author, content, created_at, updated_at)
     VALUES (?1, ?2, ?3, datetime('now'), datetime('now'))`
  ).bind(id, author, content).run()
  return findPostById(db, id)
}

export const updatePost = async (db, id, { content, author }) => {
  await db.prepare(
    `UPDATE app_home_posts
        SET content    = COALESCE(?2, content),
            author     = COALESCE(?3, author),
            updated_at = datetime('now')
      WHERE id = ?1`
  ).bind(id, content ?? null, author ?? null).run()
  return findPostById(db, id)
}

export const deletePost = (db, id) =>
  db.prepare(`DELETE FROM app_home_posts WHERE id = ?1`).bind(id).run()

// === 应用事件流(跨应用动作的时间轴投影)===

const EVENT_COLS = `id, app, action, ref_id, summary, icon, created_at`

export const listEvents = (db, { limit = 200, before = null } = {}) => {
  if (before) {
    return db.prepare(
      `SELECT ${EVENT_COLS} FROM app_home_events
        WHERE created_at < ?2
        ORDER BY created_at DESC
        LIMIT ?1`
    ).bind(limit, before).all()
  }
  return db.prepare(
    `SELECT ${EVENT_COLS} FROM app_home_events
      ORDER BY created_at DESC
      LIMIT ?1`
  ).bind(limit).all()
}

export const insertEvent = async (db, { id, app, action, ref_id = null, summary, icon = null }) => {
  await db.prepare(
    `INSERT INTO app_home_events (id, app, action, ref_id, summary, icon)
     VALUES (?1, ?2, ?3, ?4, ?5, ?6)`
  ).bind(id, app, action, ref_id, summary, icon).run()
}
