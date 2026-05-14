// 「记忆」:用户写给助理的长期上下文条目。
// visibility 三档(详见 server/service/prompt/memory.js):
//   count    只让助理知道"有 N 条记忆"
//   summary  注入标题 + 描述,内容隐藏
//   full     全部注入(标题 + 描述 + 内容)

const COLS = `id, title, description, content, visibility, created_at`

const VISIBILITIES = ['count', 'summary', 'full']
const normVisibility = (v) => VISIBILITIES.includes(String(v)) ? String(v) : 'full'

// 排序:必读(full)→ 摘要(summary)→ 已存(count),同档内按 id 倒序
export const listMemories = async (db) => {
  const r = await db.prepare(
    `SELECT ${COLS} FROM memories
     ORDER BY
       CASE visibility WHEN 'full' THEN 0 WHEN 'summary' THEN 1 WHEN 'count' THEN 2 ELSE 3 END,
       id DESC`
  ).all()
  return r?.results || []
}

// 仅供 prompt 注入。按可见性分组,内容只在 full 档返回。
// count 档不返回任何字段,只算进 total。
export const listMemoriesForPrompt = async (db) => {
  const r = await db.prepare(
    `SELECT id, title, description, content, visibility
       FROM memories ORDER BY id ASC`
  ).all()
  const rows = r?.results || []
  return {
    total: rows.length,
    summary: rows
      .filter((x) => x.visibility === 'summary')
      .map((x) => ({ id: x.id, title: x.title || '', description: x.description || '' })),
    full: rows
      .filter((x) => x.visibility === 'full')
      .map((x) => ({
        id: x.id,
        title: x.title || '',
        description: x.description || '',
        content: x.content || '',
      })),
  }
}

export const getMemory = (db, id) =>
  db.prepare(`SELECT ${COLS} FROM memories WHERE id = ?1`).bind(Number(id) || 0).first()

export const insertMemory = async (db, { title, description = '', content, visibility = 'full' }) => {
  const r = await db.prepare(
    `INSERT INTO memories (title, description, content, visibility)
     VALUES (?1, ?2, ?3, ?4)
     RETURNING ${COLS}`
  ).bind(
    String(title || '').trim(),
    String(description || '').trim(),
    String(content || '').trim(),
    normVisibility(visibility),
  ).first()
  return r
}

export const updateMemory = async (db, id, patch = {}) => {
  // 简单全量更新:有传值用传值,没传保留(用 COALESCE 让 ?? 行为干净)
  const cur = await getMemory(db, id)
  if (!cur) return null
  const next = {
    title:       patch.title       === undefined ? cur.title       : String(patch.title).trim(),
    description: patch.description === undefined ? cur.description : String(patch.description).trim(),
    content:     patch.content     === undefined ? cur.content     : String(patch.content).trim(),
    visibility:  patch.visibility  === undefined ? cur.visibility  : normVisibility(patch.visibility),
  }
  await db.prepare(
    `UPDATE memories SET title = ?1, description = ?2, content = ?3, visibility = ?4 WHERE id = ?5`
  ).bind(next.title, next.description, next.content, next.visibility, Number(id) || 0).run()
  return getMemory(db, id)
}

export const deleteMemory = async (db, id) => {
  await db.prepare(`DELETE FROM memories WHERE id = ?1`).bind(Number(id) || 0).run()
  return { success: true }
}
