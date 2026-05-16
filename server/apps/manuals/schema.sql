-- 说明书:家电、设备的说明书 + 保修。
CREATE TABLE app_manuals_items (
  id              TEXT PRIMARY KEY,
  product_name    TEXT NOT NULL,
  brand           TEXT NOT NULL DEFAULT '',
  manual_url      TEXT NOT NULL DEFAULT '',
  purchased_at    TEXT,
  warranty_until  TEXT,
  note            TEXT NOT NULL DEFAULT '',
  cover           TEXT,
  created_at      TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at      TEXT NOT NULL DEFAULT (datetime('now'))
);
