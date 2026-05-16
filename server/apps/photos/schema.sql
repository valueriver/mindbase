-- 影集:一张照片 + 文字。
CREATE TABLE app_photos_items (
  id          TEXT PRIMARY KEY,
  image_url   TEXT NOT NULL,
  caption     TEXT NOT NULL DEFAULT '',
  taken_at    TEXT,
  location    TEXT NOT NULL DEFAULT '',
  created_at  TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at  TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX idx_app_photos_items_taken ON app_photos_items(taken_at DESC, created_at DESC);
