-- 足迹。
CREATE TABLE app_footprints_visits (
  id          TEXT PRIMARY KEY,
  name        TEXT NOT NULL,
  country     TEXT NOT NULL DEFAULT '',
  city        TEXT NOT NULL DEFAULT '',
  visited_at  TEXT,
  note        TEXT NOT NULL DEFAULT '',
  cover       TEXT,
  created_at  TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at  TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX idx_app_footprints_visits_visited ON app_footprints_visits(visited_at DESC);
