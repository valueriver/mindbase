-- Bookmarks:收藏的链接。
CREATE TABLE app_bookmarks_items (
  id          TEXT PRIMARY KEY,
  url         TEXT NOT NULL,
  title       TEXT,
  description TEXT,
  cover       TEXT,
  created_at  TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at  TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX idx_app_bookmarks_items_created ON app_bookmarks_items(created_at DESC);
