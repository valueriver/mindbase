-- 心愿单:想要的东西,带优先级和状态。
CREATE TABLE app_wishlist_items (
  id          TEXT PRIMARY KEY,
  name        TEXT NOT NULL,
  url         TEXT NOT NULL DEFAULT '',
  price       INTEGER NOT NULL DEFAULT 0,        -- 单位"分"
  priority    TEXT NOT NULL DEFAULT 'normal',    -- 'high' | 'normal' | 'low'
  status      TEXT NOT NULL DEFAULT 'want',      -- 'want' | 'bought' | 'gave_up'
  note        TEXT NOT NULL DEFAULT '',
  cover       TEXT,
  created_at  TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at  TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX idx_app_wishlist_items_status ON app_wishlist_items(status, priority);
