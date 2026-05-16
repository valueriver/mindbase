-- 动态:你和 AI 共写的时间线。author 区分谁写的。
CREATE TABLE app_feed_posts (
  id          TEXT PRIMARY KEY,
  author      TEXT NOT NULL DEFAULT 'user',
  content     TEXT NOT NULL DEFAULT '',
  created_at  TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at  TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX idx_app_feed_posts_created ON app_feed_posts(created_at DESC);
