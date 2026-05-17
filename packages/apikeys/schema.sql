-- 各种服务的 API key。
CREATE TABLE app_apikeys_items (
  id          TEXT PRIMARY KEY,
  service     TEXT NOT NULL,
  name        TEXT NOT NULL DEFAULT '',
  api_key     TEXT NOT NULL DEFAULT '',
  scope       TEXT NOT NULL DEFAULT '',
  expire_at   TEXT,
  note        TEXT NOT NULL DEFAULT '',
  created_at  TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at  TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX idx_app_apikeys_items_expire ON app_apikeys_items(expire_at);
