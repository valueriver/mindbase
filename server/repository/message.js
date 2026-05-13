// messages 表的 message 字段直接存大模型 message JSON
// 用户消息也按相同格式: {role:"user", content:"..."}

export const insertMessage = async (db, { conversationId, message, memo, usage, meta }) => {
  const r = await db.prepare(
    `INSERT INTO messages (conversation_id, message, memo, usage, meta)
     VALUES (?1, ?2, ?3, ?4, ?5)
     RETURNING id, conversation_id, message, memo, usage, meta, created_at`
  ).bind(
    conversationId,
    typeof message === 'string' ? message : JSON.stringify(message),
    memo ?? null,
    usage ? (typeof usage === 'string' ? usage : JSON.stringify(usage)) : null,
    meta  ? (typeof meta  === 'string' ? meta  : JSON.stringify(meta))  : null,
  ).first()
  return r
}

export const listMessages = (db, conversationId) =>
  db.prepare(
    `SELECT id, conversation_id, message, memo, usage, meta, created_at
       FROM messages
      WHERE conversation_id = ?1
      ORDER BY id ASC`
  ).bind(conversationId).all()

// 列对话:取每个 conversation_id 的最后一条 message 作为预览
export const listConversations = (db) =>
  db.prepare(
    `SELECT m.conversation_id,
            COUNT(*) AS msg_count,
            MIN(m.created_at) AS first_at,
            MAX(m.created_at) AS last_at,
            (SELECT message FROM messages m2
              WHERE m2.conversation_id = m.conversation_id
              ORDER BY id DESC LIMIT 1) AS last_message
       FROM messages m
      GROUP BY m.conversation_id
      ORDER BY last_at DESC
      LIMIT 100`
  ).all()

export const deleteConversation = (db, conversationId) =>
  db.prepare(`DELETE FROM messages WHERE conversation_id = ?1`).bind(conversationId).run()
