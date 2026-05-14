// messages 表的 message 字段直接存大模型 message JSON。
// 用户消息也按相同格式: {role:"user", content:"..."}

export const insertMessage = async (db, { conversationId, message, meta }) => {
  const r = await db.prepare(
    `INSERT INTO messages (conversation_id, message, meta)
     VALUES (?1, ?2, ?3)
     RETURNING id, conversation_id, message, meta, created_at`
  ).bind(
    conversationId,
    typeof message === 'string' ? message : JSON.stringify(message),
    meta ? (typeof meta === 'string' ? meta : JSON.stringify(meta)) : null,
  ).first()
  return r
}

// 全量(给 chat 调用送上下文用)
export const listMessages = (db, conversationId) =>
  db.prepare(
    `SELECT id, conversation_id, message, meta, created_at
       FROM messages
      WHERE conversation_id = ?1
      ORDER BY id ASC`
  ).bind(conversationId).all()

// 分页(给前端列表用):取 id < before 的最近 limit 条,DESC 后再反转得到 ASC
export const listMessagesPage = async (db, conversationId, { before, limit = 30 } = {}) => {
  const lim = Math.max(1, Math.min(200, Number(limit) || 30))
  const r = before
    ? await db.prepare(
        `SELECT id, conversation_id, message, meta, created_at
           FROM messages
          WHERE conversation_id = ?1 AND id < ?2
          ORDER BY id DESC
          LIMIT ?3`
      ).bind(conversationId, before, lim).all()
    : await db.prepare(
        `SELECT id, conversation_id, message, meta, created_at
           FROM messages
          WHERE conversation_id = ?1
          ORDER BY id DESC
          LIMIT ?2`
      ).bind(conversationId, lim).all()
  const rows = (r?.results || []).reverse()
  return rows
}
