-- MindBase 数据库 schema —— 单一事实源,初始化 D1 用:
--   npx wrangler d1 execute mindbase --remote --file=schema.sql --yes
--
-- 约定:
--   - 系统表(平台基础设施)用裸表名:conversations / messages / tokens / settings
--   - 上下文应用表用 `app_<name>_*` 前缀,AI 通过
--     SELECT name FROM sqlite_master WHERE name LIKE 'app_%' 拿到的就是纯用户数据
--   - 加新应用 = 在下面"应用"段 append 一节 CREATE TABLE
--
-- 所有表集中在这一个文件,保持单一事实源;加新应用就在下面 append 一节。


-- ============================================================
-- 系统 (system/apps/*)
-- ============================================================

-- ---- chat:对话(会话 + 消息) ----
CREATE TABLE conversations (
  id          TEXT PRIMARY KEY,
  title       TEXT NOT NULL DEFAULT '',
  created_at  TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at  TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX idx_conversations_updated ON conversations(updated_at DESC);

CREATE TABLE messages (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  conversation_id TEXT NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  message         TEXT NOT NULL,
  meta            TEXT,
  created_at      TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX idx_messages_conv ON messages(conversation_id, id);

-- ---- collab:外部 AI 接入授权 token ----
CREATE TABLE tokens (
  id            TEXT PRIMARY KEY,
  name          TEXT NOT NULL,
  token         TEXT NOT NULL UNIQUE,
  scope         TEXT NOT NULL DEFAULT 'read',
  created_at    TEXT NOT NULL DEFAULT (datetime('now')),
  last_used_at  TEXT
);
CREATE INDEX idx_tokens_token ON tokens(token);

-- ---- settings:全局 KV(AI 模型 url/key/model、动态默认 icon/cover 等)----
CREATE TABLE settings (
  key         TEXT PRIMARY KEY,
  value       TEXT,
  updated_at  TEXT NOT NULL DEFAULT (datetime('now'))
);


-- ============================================================
-- 应用 (apps/*)
-- ============================================================

-- ---- home:主页时间轴(你和 AI 共写)+ 应用事件流 ----
CREATE TABLE app_home_posts (
  id          TEXT PRIMARY KEY,
  author      TEXT NOT NULL DEFAULT 'user',
  content     TEXT NOT NULL DEFAULT '',
  created_at  TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at  TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX idx_app_home_posts_created ON app_home_posts(created_at DESC);

-- 各应用 service.js 在关键动作后往这里 INSERT 一条
-- (直接 import home/repository.js 的 insertEvent,或自己写 SQL)。
-- 仅用于主页时间轴渲染,无副作用。
CREATE TABLE app_home_events (
  id          TEXT PRIMARY KEY,
  app         TEXT NOT NULL,                -- 'ledger' / 'books' / 'goals' ...
  action      TEXT NOT NULL,                -- 'created' / 'status_changed' / 'milestone' / 'completed'
  ref_id      TEXT,                          -- 源记录 id,可空(已删除时仍保留事件)
  summary     TEXT NOT NULL,                 -- 一行人话,e.g. "记了一笔咖啡 ¥18"
  icon        TEXT,                          -- '💰',渲染快
  created_at  TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX idx_app_home_events_created ON app_home_events(created_at DESC);
