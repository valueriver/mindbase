-- 文章:自己发表的文章索引(标题、链接、来源、发表日期、摘要、封面)。
CREATE TABLE app_articles_items (
  id           TEXT PRIMARY KEY,
  title        TEXT NOT NULL,
  url          TEXT NOT NULL DEFAULT '',
  source       TEXT NOT NULL DEFAULT '',
  summary      TEXT NOT NULL DEFAULT '',
  published_at TEXT,
  cover        TEXT,
  created_at   TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at   TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX idx_app_articles_items_published ON app_articles_items(published_at DESC);
