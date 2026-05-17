-- 邮箱地址簿。
CREATE TABLE app_emails_addresses (
  id         TEXT PRIMARY KEY,
  address    TEXT NOT NULL,
  label      TEXT NOT NULL DEFAULT '',
  provider   TEXT NOT NULL DEFAULT '',
  note       TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX idx_app_emails_addresses_created ON app_emails_addresses(created_at DESC);
