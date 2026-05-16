-- 展览。
CREATE TABLE app_exhibitions_visits (
  id          TEXT PRIMARY KEY,
  title       TEXT NOT NULL,
  venue       TEXT NOT NULL DEFAULT '',
  city        TEXT NOT NULL DEFAULT '',
  visited_at  TEXT,
  rating      INTEGER NOT NULL DEFAULT 0,
  note        TEXT NOT NULL DEFAULT '',
  cover       TEXT,
  created_at  TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at  TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX idx_app_exhibitions_visits_at ON app_exhibitions_visits(visited_at DESC);
