-- 域名:记录持有的域名、注册商、过期日期。
CREATE TABLE app_domains_items (
  id          TEXT PRIMARY KEY,
  domain      TEXT NOT NULL,
  registrar   TEXT NOT NULL DEFAULT '',
  expire_date TEXT,
  status      TEXT NOT NULL DEFAULT 'active',
  note        TEXT NOT NULL DEFAULT '',
  created_at  TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at  TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX idx_app_domains_items_expire ON app_domains_items(expire_date);
