-- 目标:打卡推进。
CREATE TABLE app_goals_items (
  id          TEXT PRIMARY KEY,
  title       TEXT NOT NULL,
  target      INTEGER NOT NULL DEFAULT 0,
  progress    INTEGER NOT NULL DEFAULT 0,
  unit        TEXT NOT NULL DEFAULT '',
  status      TEXT NOT NULL DEFAULT 'active',
  note        TEXT NOT NULL DEFAULT '',
  created_at  TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at  TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX idx_app_goals_items_status ON app_goals_items(status, created_at DESC);
