-- 新增 todos 表(支持 1 层子任务:parent_id 自引用,业务层不允许子任务再带子任务)
CREATE TABLE IF NOT EXISTS todos (
  id          TEXT PRIMARY KEY,
  parent_id   TEXT REFERENCES todos(id) ON DELETE CASCADE,
  title       TEXT NOT NULL DEFAULT '',
  done        INTEGER NOT NULL DEFAULT 0,
  sort_order  INTEGER NOT NULL DEFAULT 0,
  created_at  TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at  TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_todos_parent ON todos(parent_id, sort_order);
