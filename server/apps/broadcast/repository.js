// ---------- posts ----------

const POST_COLS = 'id, title, note, created_at, updated_at'

export const listPosts = (db) =>
  db.prepare(
    `SELECT ${POST_COLS} FROM app_broadcast_posts ORDER BY created_at DESC`
  ).all()

export const findPostById = (db, id) =>
  db.prepare(`SELECT ${POST_COLS} FROM app_broadcast_posts WHERE id = ?1`).bind(id).first()

export const insertPost = async (db, { id, title, note }) => {
  await db.prepare(
    `INSERT INTO app_broadcast_posts (id, title, note, created_at, updated_at)
     VALUES (?1, ?2, ?3, datetime('now'), datetime('now'))`
  ).bind(id, title, note).run()
  return findPostById(db, id)
}

export const updatePost = async (db, id, patch) => {
  const sets = []
  const binds = [id]
  const push = (col, val) => { binds.push(val); sets.push(`${col} = ?${binds.length}`) }
  if (patch.title !== undefined) push('title', patch.title)
  if (patch.note  !== undefined) push('note',  patch.note)
  if (sets.length) {
    sets.push(`updated_at = datetime('now')`)
    await db.prepare(`UPDATE app_broadcast_posts SET ${sets.join(', ')} WHERE id = ?1`).bind(...binds).run()
  }
  return findPostById(db, id)
}

export const deletePost = (db, id) =>
  db.prepare(`DELETE FROM app_broadcast_posts WHERE id = ?1`).bind(id).run()

// ---------- platforms ----------

const PLAT_COLS = 'id, name, url, sort_order, created_at, updated_at'

export const listPlatforms = (db) =>
  db.prepare(
    `SELECT ${PLAT_COLS} FROM app_broadcast_platforms ORDER BY sort_order ASC, created_at ASC`
  ).all()

export const findPlatformById = (db, id) =>
  db.prepare(`SELECT ${PLAT_COLS} FROM app_broadcast_platforms WHERE id = ?1`).bind(id).first()

export const insertPlatform = async (db, { id, name, url, sortOrder }) => {
  await db.prepare(
    `INSERT INTO app_broadcast_platforms (id, name, url, sort_order, created_at, updated_at)
     VALUES (?1, ?2, ?3, ?4, datetime('now'), datetime('now'))`
  ).bind(id, name, url, sortOrder).run()
  return findPlatformById(db, id)
}

export const updatePlatform = async (db, id, patch) => {
  const sets = []
  const binds = [id]
  const push = (col, val) => { binds.push(val); sets.push(`${col} = ?${binds.length}`) }
  if (patch.name      !== undefined) push('name',       patch.name)
  if (patch.url       !== undefined) push('url',        patch.url)
  if (patch.sortOrder !== undefined) push('sort_order', patch.sortOrder)
  if (sets.length) {
    sets.push(`updated_at = datetime('now')`)
    await db.prepare(`UPDATE app_broadcast_platforms SET ${sets.join(', ')} WHERE id = ?1`).bind(...binds).run()
  }
  return findPlatformById(db, id)
}

export const deletePlatform = (db, id) =>
  db.prepare(`DELETE FROM app_broadcast_platforms WHERE id = ?1`).bind(id).run()

// ---------- statuses ----------

const STAT_COLS = 'id, post_id, platform_id, status, pub_url, created_at, updated_at'

export const listStatusesByPost = (db, postId) =>
  db.prepare(
    `SELECT ${STAT_COLS} FROM app_broadcast_statuses WHERE post_id = ?1`
  ).bind(postId).all()

export const upsertStatus = async (db, { id, postId, platformId, status, pubUrl }) => {
  await db.prepare(
    `INSERT INTO app_broadcast_statuses (id, post_id, platform_id, status, pub_url, created_at, updated_at)
     VALUES (?1, ?2, ?3, ?4, ?5, datetime('now'), datetime('now'))
     ON CONFLICT(post_id, platform_id) DO UPDATE SET
       status     = excluded.status,
       pub_url    = excluded.pub_url,
       updated_at = datetime('now')`
  ).bind(id, postId, platformId, status, pubUrl).run()
  return db.prepare(
    `SELECT ${STAT_COLS} FROM app_broadcast_statuses WHERE post_id = ?1 AND platform_id = ?2`
  ).bind(postId, platformId).first()
}
