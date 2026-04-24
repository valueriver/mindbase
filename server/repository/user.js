const USER_COLS = `
  id, google_id, email, name, avatar_url,
  home_name, home_icon, home_cover,
  created_at, updated_at
`

export const findUserById = (db, id) =>
  db.prepare(`SELECT ${USER_COLS} FROM users WHERE id = ?1`).bind(id).first()

export const findUserByGoogleId = (db, googleId) =>
  db.prepare(`SELECT ${USER_COLS} FROM users WHERE google_id = ?1`).bind(googleId).first()

export const findUserByEmail = (db, email) =>
  db.prepare(`SELECT ${USER_COLS} FROM users WHERE email = ?1`).bind(email).first()

export const createUser = async (db, { id, googleId, email, name, avatarUrl }) => {
  await db.prepare(
    `INSERT INTO users (id, google_id, email, name, avatar_url, created_at, updated_at)
     VALUES (?1, ?2, ?3, ?4, ?5, datetime('now'), datetime('now'))`
  ).bind(id, googleId, email, name, avatarUrl).run()
  return findUserById(db, id)
}

export const updateUserProfile = async (db, id, { name, avatarUrl }) => {
  await db.prepare(
    `UPDATE users
       SET name       = COALESCE(?2, name),
           avatar_url = COALESCE(?3, avatar_url),
           updated_at = datetime('now')
     WHERE id = ?1`
  ).bind(id, name ?? null, avatarUrl ?? null).run()
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
