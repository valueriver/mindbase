-- 针对已存在的生产库(原 Google 登录版本)做增量迁移。
-- 用法:wrangler d1 execute mindbase --remote --file=migrations/2025-11-rebrand.sql
-- 幂等:全部用 IF NOT EXISTS / CREATE INDEX IF NOT EXISTS,重跑无影响。

-- 1. 想法
CREATE TABLE IF NOT EXISTS memos (
  id          TEXT PRIMARY KEY,
  user_id     TEXT NOT NULL,
  content     TEXT NOT NULL DEFAULT '',
  tags        TEXT,
  created_at  TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at  TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_memos_user_created ON memos(user_id, created_at DESC);

-- 2. 助理对话
CREATE TABLE IF NOT EXISTS messages (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  conversation_id TEXT NOT NULL,
  message         TEXT NOT NULL,
  memo            TEXT,
  usage           TEXT,
  meta            TEXT,
  created_at      DATETIME DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_messages_conv ON messages(conversation_id, id);

-- 3. KV 设置(AI 模型 url/key/model 等)
CREATE TABLE IF NOT EXISTS settings (
  key         TEXT PRIMARY KEY,
  value       TEXT,
  updated_at  TEXT NOT NULL DEFAULT (datetime('now'))
);

-- 4. 老 users 表里的 google_id 不再使用,但 D1/SQLite 不支持 DROP COLUMN,
--    保留字段、把 UNIQUE 约束失效问题靠 service 层逻辑回避(永远不查 google_id)。
--    如果你想清干净:用 wrangler d1 export → 改 schema → 重新导入,谨慎操作。
