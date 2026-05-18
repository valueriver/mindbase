// Tool 实现。注意:运行在 Cloudflare Workers,没有 Node 的 child_process/fs。
// 第二个参数 context 由 runner 注入,这里需要拿 env.DB(D1 binding)。

export const sql_query = async ({ sql }, context = {}) => {
  const db = context?.env?.DB
  if (!db) throw new Error('DB binding missing')
  const text = String(sql || '').trim().replace(/;+\s*$/, '')
  if (!text) throw new Error('sql is empty')

  const stmt = db.prepare(text)
  const r = await stmt.all()
  return {
    results: r?.results || [],
    meta: {
      changes:       r?.meta?.changes ?? 0,
      rows_read:     r?.meta?.rows_read ?? 0,
      rows_written:  r?.meta?.rows_written ?? 0,
      duration_ms:   r?.meta?.duration ?? 0,
      last_row_id:   r?.meta?.last_row_id ?? 0,
    },
  }
}
