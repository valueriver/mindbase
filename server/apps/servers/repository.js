// 服务器仓储。
const COLS = `id, name, provider, host, ssh_port, ssh_user, ssh_key_note, cost, cost_cycle, expire_at, status, note, created_at, updated_at`

export const listServers = (db, { status = null } = {}) => {
  if (status) {
    return db.prepare(
      `SELECT ${COLS} FROM app_servers_machines
        WHERE status = ?1
        ORDER BY (expire_at IS NULL), expire_at ASC, created_at DESC`
    ).bind(status).all()
  }
  return db.prepare(
    `SELECT ${COLS} FROM app_servers_machines
      ORDER BY (expire_at IS NULL), expire_at ASC, created_at DESC`
  ).all()
}

export const findServerById = (db, id) =>
  db.prepare(`SELECT ${COLS} FROM app_servers_machines WHERE id = ?1`).bind(id).first()

export const insertServer = async (db, r) => {
  await db.prepare(
    `INSERT INTO app_servers_machines
       (id, name, provider, host, ssh_port, ssh_user, ssh_key_note, cost, cost_cycle, expire_at, status, note, created_at, updated_at)
     VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12, datetime('now'), datetime('now'))`
  ).bind(
    r.id, r.name, r.provider, r.host, r.ssh_port, r.ssh_user, r.ssh_key_note,
    r.cost, r.cost_cycle, r.expire_at, r.status, r.note
  ).run()
  return findServerById(db, r.id)
}

export const updateServer = async (db, id, patch) => {
  const sets = []
  const binds = [id]
  const push = (col, val) => { binds.push(val); sets.push(`${col} = ?${binds.length}`) }
  for (const col of ['name','provider','host','ssh_port','ssh_user','ssh_key_note','cost','cost_cycle','expire_at','status','note']) {
    if (patch[col] !== undefined) push(col, patch[col])
  }
  if (sets.length) {
    sets.push(`updated_at = datetime('now')`)
    await db.prepare(`UPDATE app_servers_machines SET ${sets.join(', ')} WHERE id = ?1`).bind(...binds).run()
  }
  return findServerById(db, id)
}

export const deleteServer = (db, id) =>
  db.prepare(`DELETE FROM app_servers_machines WHERE id = ?1`).bind(id).run()
