const USER_COLS = `
  id, email, name, avatar_url,
  home_name, home_icon, home_cover,
  created_at, updated_at
`

export const findUserById = (db, id) =>
  db.prepare(`SELECT ${USER_COLS} FROM users WHERE id = ?1`).bind(id).first()

// 单用户首次登录种子化:若不存在则插入。
// 旧库的 users.google_id 字段保留可空,不再写入。
export const ensureUser = async (db, { id, email, name }) => {
  const existing = await findUserById(db, id)
  if (existing) return existing
  await db.prepare(
    `INSERT INTO users (id, email, name, created_at, updated_at)
     VALUES (?1, ?2, ?3, datetime('now'), datetime('now'))`
  ).bind(id, email, name).run()
  return findUserById(db, id)
}

const nullableFlag = (v) => (v === undefined ? 0 : 1)

// home_name 不接受 null(必填,空字符串会被 service 层改成默认值再传进来)
export const updateUserHome = async (db, id, { homeName, homeIcon, homeCover }) => {
  await db.prepare(
    `UPDATE users
        SET home_name  = COALESCE(?2, home_name),
            home_icon  = CASE WHEN ?3 = 1 THEN ?4 ELSE home_icon  END,
            home_cover = CASE WHEN ?5 = 1 THEN ?6 ELSE home_cover END,
            updated_at = datetime('now')
      WHERE id = ?1`
  ).bind(
    id,
    homeName ?? null,
    nullableFlag(homeIcon),  homeIcon  ?? null,
    nullableFlag(homeCover), homeCover ?? null,
  ).run()
  return findUserById(db, id)
}
