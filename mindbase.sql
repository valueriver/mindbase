-- 单机应用,不需要 users 表;所有数据全局共享,由 AUTH_USERNAME/AUTH_PASSWORD 守门。

-- 笔记本:无限嵌套
CREATE TABLE notebooks (
  id          TEXT PRIMARY KEY,
  parent_id   TEXT REFERENCES notebooks(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  icon        TEXT,
  cover       TEXT,
  sort_order  INTEGER NOT NULL DEFAULT 0,
  created_at  TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at  TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX idx_notebooks_parent ON notebooks(parent_id);

-- 笔记:挂在某个笔记本下
CREATE TABLE notes (
  id           TEXT PRIMARY KEY,
  notebook_id  TEXT REFERENCES notebooks(id) ON DELETE CASCADE,
  title        TEXT NOT NULL DEFAULT '',
  content      TEXT NOT NULL DEFAULT '',
  icon         TEXT,
  cover        TEXT,
  sort_order   INTEGER NOT NULL DEFAULT 0,
  created_at   TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at   TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX idx_notes_notebook ON notes(notebook_id);

-- 待办:单层任务列表
CREATE TABLE todos (
  id          TEXT PRIMARY KEY,
  title       TEXT NOT NULL DEFAULT '',
  done        INTEGER NOT NULL DEFAULT 0,
  sort_order  INTEGER NOT NULL DEFAULT 0,
  created_at  TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at  TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX idx_todos_done ON todos(done, sort_order);

-- 想法:时间轴随手记;content 是纯文本,内嵌图片用 markdown 语法 ![](/i/...)
CREATE TABLE memos (
  id          TEXT PRIMARY KEY,
  content     TEXT NOT NULL DEFAULT '',
  created_at  TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at  TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX idx_memos_created ON memos(created_at DESC);

-- 助理对话:message 直接存大模型返回的 message 字段
CREATE TABLE messages (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  conversation_id TEXT NOT NULL,
  message         TEXT NOT NULL,
  memo            TEXT,
  usage           TEXT,
  meta            TEXT,
  created_at      DATETIME DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_messages_conv ON messages(conversation_id, id);

-- 应用级 KV:AI 模型 url/key/model、想法 icon/cover 等
CREATE TABLE settings (
  key         TEXT PRIMARY KEY,
  value       TEXT,
  updated_at  TEXT NOT NULL DEFAULT (datetime('now'))
);

-- AI 对外授权令牌:开启即生成、关闭即删除。
CREATE TABLE tokens (
  id            TEXT PRIMARY KEY,
  name          TEXT NOT NULL,
  token         TEXT NOT NULL UNIQUE,
  scope         TEXT NOT NULL DEFAULT 'read',
  created_at    TEXT NOT NULL DEFAULT (datetime('now')),
  last_used_at  TEXT
);
CREATE INDEX idx_tokens_token ON tokens(token);
