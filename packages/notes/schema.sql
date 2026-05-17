-- 笔记:无限嵌套笔记本 + 笔记。
CREATE TABLE app_notes_notebooks (
  id          TEXT PRIMARY KEY,
  parent_id   TEXT REFERENCES app_notes_notebooks(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  icon        TEXT,
  cover       TEXT,
  sort_order  INTEGER NOT NULL DEFAULT 0,
  created_at  TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at  TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX idx_app_notes_notebooks_parent ON app_notes_notebooks(parent_id);

CREATE TABLE app_notes_pages (
  id           TEXT PRIMARY KEY,
  notebook_id  TEXT REFERENCES app_notes_notebooks(id) ON DELETE CASCADE,
  title        TEXT NOT NULL DEFAULT '',
  content      TEXT NOT NULL DEFAULT '',
  icon         TEXT,
  cover        TEXT,
  sort_order   INTEGER NOT NULL DEFAULT 0,
  created_at   TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at   TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX idx_app_notes_pages_notebook ON app_notes_pages(notebook_id);
