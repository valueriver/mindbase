-- App 清单:在用的软件和服务。
CREATE TABLE app_apps_items (
  id          TEXT PRIMARY KEY,
  name        TEXT NOT NULL,
  platform    TEXT NOT NULL DEFAULT '',
  category    TEXT NOT NULL DEFAULT '',
  url         TEXT NOT NULL DEFAULT '',
  status      TEXT NOT NULL DEFAULT 'using',
  note        TEXT NOT NULL DEFAULT '',
  cover       TEXT,
  created_at  TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at  TEXT NOT NULL DEFAULT (datetime('now'))
);
