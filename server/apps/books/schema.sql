-- Books:想读 / 在读 / 读过的书。
CREATE TABLE app_books_items (
  id          TEXT PRIMARY KEY,
  title       TEXT NOT NULL,
  author      TEXT NOT NULL DEFAULT '',
  status      TEXT NOT NULL DEFAULT 'want',
  rating      INTEGER NOT NULL DEFAULT 0,
  note        TEXT NOT NULL DEFAULT '',
  cover       TEXT,
  created_at  TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at  TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX idx_app_books_items_status_created ON app_books_items(status, created_at DESC);
