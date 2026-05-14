-- mindbase 跟 meem 拉齐:
-- 1) messages 表去掉 memo / usage 列(从来没人写也没人读)
-- 2) 新增 memories 表(三档可见性)
-- 3) 把硬编码的 system prompt 从 server/ai/system-prompt.js 移到 settings.ai_system_prompt
--
-- D1 在 prod 上有真实数据,这里走 ALTER + 数据保留;
-- 如果是新环境,直接跑 mindbase.sql 即可,这份文件不要再执行。

-- ---------- messages: 去 memo / usage ----------
ALTER TABLE messages DROP COLUMN memo;
ALTER TABLE messages DROP COLUMN usage;

-- ---------- memories ----------
CREATE TABLE memories (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  title       TEXT NOT NULL DEFAULT '',
  description TEXT NOT NULL DEFAULT '',
  content     TEXT NOT NULL DEFAULT '',
  visibility  TEXT NOT NULL DEFAULT 'full',
  created_at  TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX idx_memories_visibility_id ON memories(visibility, id DESC);
