-- 简历条目。kind ∈ { work, edu, project, skill, other }。
CREATE TABLE app_resume_entries (
  id          TEXT PRIMARY KEY,
  kind        TEXT NOT NULL DEFAULT 'work',
  title       TEXT NOT NULL,
  org         TEXT NOT NULL DEFAULT '',
  start_date  TEXT,
  end_date    TEXT,
  description TEXT NOT NULL DEFAULT '',
  sort_order  INTEGER NOT NULL DEFAULT 0,
  created_at  TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at  TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX idx_app_resume_entries_kind_sort ON app_resume_entries(kind, sort_order);
