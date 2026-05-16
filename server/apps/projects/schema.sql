-- 个人项目(博客/副业/实验)。status ∈ { active, paused, done, abandoned }。
CREATE TABLE app_projects_items (
  id         TEXT PRIMARY KEY,
  title      TEXT NOT NULL,
  status     TEXT NOT NULL DEFAULT 'active',
  note       TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX idx_app_projects_items_status  ON app_projects_items(status);
CREATE INDEX idx_app_projects_items_created ON app_projects_items(created_at DESC);
