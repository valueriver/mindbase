-- 设备:在用的硬件。
CREATE TABLE app_devices_items (
  id            TEXT PRIMARY KEY,
  name          TEXT NOT NULL,
  category      TEXT NOT NULL DEFAULT '',
  brand         TEXT NOT NULL DEFAULT '',
  model         TEXT NOT NULL DEFAULT '',
  serial        TEXT NOT NULL DEFAULT '',
  purchased_at  TEXT,
  price         INTEGER NOT NULL DEFAULT 0,
  note          TEXT NOT NULL DEFAULT '',
  cover         TEXT,
  created_at    TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at    TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX idx_app_devices_items_category ON app_devices_items(category);
