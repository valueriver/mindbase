-- 网页:用户跟 AI 聊出来的 HTML demo / 小可视化,留着以后翻看。
CREATE TABLE app_webs_pages (
  id          TEXT PRIMARY KEY,
  title       TEXT NOT NULL DEFAULT '',
  description TEXT NOT NULL DEFAULT '',
  html        TEXT NOT NULL DEFAULT '',
  created_at  TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at  TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX idx_app_webs_pages_created ON app_webs_pages(created_at DESC);
