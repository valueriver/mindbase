-- 银行卡。type ∈ { debit, credit }。
CREATE TABLE app_cards_items (
  id          TEXT PRIMARY KEY,
  name        TEXT NOT NULL,
  bank        TEXT NOT NULL DEFAULT '',
  card_number TEXT NOT NULL DEFAULT '',
  type        TEXT NOT NULL DEFAULT 'debit',
  expire      TEXT NOT NULL DEFAULT '',
  note        TEXT NOT NULL DEFAULT '',
  created_at  TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at  TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX idx_app_cards_items_created ON app_cards_items(created_at DESC);
