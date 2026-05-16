-- 设置:全局 KV。系统级,无 app_ 前缀。
-- 存:AI 模型 url/key/model、动态默认 icon/cover 等。
CREATE TABLE settings (
  key         TEXT PRIMARY KEY,
  value       TEXT,
  updated_at  TEXT NOT NULL DEFAULT (datetime('now'))
);
