-- 回忆:时间线式的日记本,每条对应一天。
CREATE TABLE app_memories_days (
  id          TEXT PRIMARY KEY,
  date        TEXT NOT NULL,
  location    TEXT NOT NULL DEFAULT '',
  weather     TEXT NOT NULL DEFAULT '',
  mood        TEXT NOT NULL DEFAULT '',
  note        TEXT NOT NULL DEFAULT '',
  created_at  TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at  TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX idx_app_memories_days_date ON app_memories_days(date DESC);
