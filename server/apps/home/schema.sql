-- 主页:你和 AI 共写的时间线。author 区分谁写的。
CREATE TABLE app_home_posts (
  id          TEXT PRIMARY KEY,
  author      TEXT NOT NULL DEFAULT 'user',
  content     TEXT NOT NULL DEFAULT '',
  created_at  TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at  TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX idx_app_home_posts_created ON app_home_posts(created_at DESC);

-- 应用事件流。各应用的 service.js 在关键动作后调 emitHomeEvent() 写一条。
-- 仅用于主页时间轴渲染,无副作用。
CREATE TABLE app_home_events (
  id          TEXT PRIMARY KEY,
  app         TEXT NOT NULL,                -- 'ledger' / 'books' / 'goals' ...
  action      TEXT NOT NULL,                -- 'created' / 'status_changed' / 'milestone' / 'completed'
  ref_id      TEXT,                          -- 源记录 id,可空(已删除时仍保留事件)
  summary     TEXT NOT NULL,                 -- 一行人话,e.g. "记了一笔咖啡 ¥18"
  icon        TEXT,                          -- '💰',渲染快
  created_at  TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX idx_app_home_events_created ON app_home_events(created_at DESC);
