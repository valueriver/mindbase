-- 订阅:Netflix / ChatGPT / 域名续费 等。amount 存"分"避免浮点。
CREATE TABLE app_subs_services (
  id          TEXT PRIMARY KEY,
  name        TEXT NOT NULL,
  amount      INTEGER NOT NULL DEFAULT 0,
  cycle       TEXT NOT NULL DEFAULT 'monthly',     -- 'monthly' | 'yearly'
  next_charge TEXT,
  note        TEXT NOT NULL DEFAULT '',
  created_at  TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at  TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX idx_app_subs_services_next_charge ON app_subs_services(next_charge);
