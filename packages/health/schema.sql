-- 健康:每天一条身体状态打卡。
CREATE TABLE app_health_entries (
  id          TEXT PRIMARY KEY,
  date        TEXT NOT NULL UNIQUE,
  weight_g    INTEGER,
  sleep_min   INTEGER,
  mood        TEXT NOT NULL DEFAULT '',
  exercise    TEXT NOT NULL DEFAULT '',
  note        TEXT NOT NULL DEFAULT '',
  created_at  TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at  TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX idx_app_health_entries_date ON app_health_entries(date DESC);
