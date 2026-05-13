-- 单用户:wrangler.jsonc 配 AUTH_USERNAME / AUTH_PASSWORD,首次登录写入 users 表(固定 id)
CREATE TABLE users (
  id          TEXT PRIMARY KEY,
  email       TEXT NOT NULL,
  name        TEXT,
  avatar_url  TEXT,
  home_name   TEXT NOT NULL DEFAULT '首页',
  home_icon   TEXT,
  home_cover  TEXT,
  created_at  TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at  TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX idx_users_email ON users(email);

-- 笔记本:无限嵌套
CREATE TABLE notebooks (
  id          TEXT PRIMARY KEY,
  user_id     TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  parent_id   TEXT REFERENCES notebooks(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  icon        TEXT,
  cover       TEXT,
  sort_order  INTEGER NOT NULL DEFAULT 0,
  created_at  TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at  TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX idx_notebooks_user        ON notebooks(user_id);
CREATE INDEX idx_notebooks_user_parent ON notebooks(user_id, parent_id);

-- 笔记:挂在某个笔记本下
CREATE TABLE notes (
  id           TEXT PRIMARY KEY,
  user_id      TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  notebook_id  TEXT          REFERENCES notebooks(id) ON DELETE CASCADE,
  title        TEXT NOT NULL DEFAULT '',
  content      TEXT NOT NULL DEFAULT '',
  icon         TEXT,
  cover        TEXT,
  sort_order   INTEGER NOT NULL DEFAULT 0,
  created_at   TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at   TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX idx_notes_user     ON notes(user_id);
CREATE INDEX idx_notes_notebook ON notes(notebook_id);

-- 想法:时间轴随手记
CREATE TABLE memos (
  id          TEXT PRIMARY KEY,
  user_id     TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  content     TEXT NOT NULL DEFAULT '',
  tags        TEXT,   -- JSON array,e.g. '["idea","工作"]'
  created_at  TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at  TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX idx_memos_user_created ON memos(user_id, created_at DESC);

-- 助理对话:message 直接存大模型返回的 message 字段(含 role/content/tool_calls 等)
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

-- 应用级 KV 设置:AI 模型 url/key/model 等
CREATE TABLE settings (
  key         TEXT PRIMARY KEY,
  value       TEXT,
  updated_at  TEXT NOT NULL DEFAULT (datetime('now'))
);

-- AI 对外授权令牌:一用户最多一条,开启即生成、关闭即删除。
CREATE TABLE tokens (
  id            TEXT PRIMARY KEY,
  user_id       TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name          TEXT NOT NULL,
  token         TEXT NOT NULL UNIQUE,
  scope         TEXT NOT NULL DEFAULT 'read',
  created_at    TEXT NOT NULL DEFAULT (datetime('now')),
  last_used_at  TEXT
);
CREATE INDEX idx_tokens_user  ON tokens(user_id);
CREATE INDEX idx_tokens_token ON tokens(token);
