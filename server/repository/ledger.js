// 记账流水。
// amount 存"分"(整数),前端 ÷ 100 显示;type ∈ { expense, income }。

const COLS = `id, type, amount, category, note, happened_at, created_at, updated_at`

export const listLedger = (db, { month = null, type = null, limit = 500 } = {}) => {
  const where = []
  const binds = []
  if (month) { binds.push(`${month}%`); where.push(`happened_at LIKE ?${binds.length}`) }
  if (type)  { binds.push(type);        where.push(`type = ?${binds.length}`) }
  binds.push(limit)
  const sql = `SELECT ${COLS} FROM ledger
                ${where.length ? `WHERE ${where.join(' AND ')}` : ''}
               ORDER BY happened_at DESC, id DESC
               LIMIT ?${binds.length}`
  return db.prepare(sql).bind(...binds).all()
}

export const findLedgerById = (db, id) =>
  db.prepare(`SELECT ${COLS} FROM ledger WHERE id = ?1`).bind(id).first()

export const insertLedger = async (db, { id, type, amount, category, note, happenedAt }) => {
  await db.prepare(
    `INSERT INTO ledger (id, type, amount, category, note, happened_at, created_at, updated_at)
     VALUES (?1, ?2, ?3, ?4, ?5, ?6, datetime('now'), datetime('now'))`
  ).bind(id, type, amount, category, note, happenedAt).run()
  return findLedgerById(db, id)
}

export const updateLedger = async (db, id, { type, amount, category, note, happenedAt }) => {
  await db.prepare(
    `UPDATE ledger
        SET type        = COALESCE(?2, type),
            amount      = COALESCE(?3, amount),
            category    = COALESCE(?4, category),
            note        = COALESCE(?5, note),
            happened_at = COALESCE(?6, happened_at),
            updated_at  = datetime('now')
      WHERE id = ?1`
  ).bind(id, type ?? null, amount ?? null, category ?? null, note ?? null, happenedAt ?? null).run()
  return findLedgerById(db, id)
}

export const deleteLedger = async (db, id) => {
  await db.prepare(`DELETE FROM ledger WHERE id = ?1`).bind(id).run()
  return { success: true }
}

// 当月统计:支出 / 收入 / 结余(分)
export const monthlyTotals = async (db, month) => {
  const r = await db.prepare(
    `SELECT type, COALESCE(SUM(amount), 0) AS sum
       FROM ledger WHERE happened_at LIKE ?1
      GROUP BY type`
  ).bind(`${month}%`).all()
  let expense = 0, income = 0
  for (const row of r?.results || []) {
    if (row.type === 'expense') expense = Number(row.sum) || 0
    if (row.type === 'income')  income  = Number(row.sum) || 0
  }
  return { month, expense, income, balance: income - expense }
}

// 历史用过的分类(用于自动补全)。按使用次数倒序。
export const distinctCategories = (db) =>
  db.prepare(
    `SELECT category, COUNT(*) AS cnt
       FROM ledger
      WHERE category != ''
      GROUP BY category
      ORDER BY cnt DESC, category ASC`
  ).all()
