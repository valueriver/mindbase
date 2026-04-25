-- 用户
CREATE TABLE users (
  id          TEXT PRIMARY KEY,
  google_id   TEXT UNIQUE,
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

-- AI 授权令牌:一用户最多一条,开启即生成、关闭即删除。
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
