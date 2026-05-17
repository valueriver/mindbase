-- Movies:想看 / 在看 / 看过的影片。
CREATE TABLE app_movies_items (
  id          TEXT PRIMARY KEY,
  title       TEXT NOT NULL,
  year        INTEGER,
  status      TEXT NOT NULL DEFAULT 'want',
  rating      INTEGER NOT NULL DEFAULT 0,
  note        TEXT NOT NULL DEFAULT '',
  cover       TEXT,
  created_at  TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at  TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX idx_app_movies_items_status_created ON app_movies_items(status, created_at DESC);
