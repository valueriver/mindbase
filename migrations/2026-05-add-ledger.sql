-- 加 ledger 表(记账)
CREATE TABLE ledger (
  id          TEXT PRIMARY KEY,
  type        TEXT NOT NULL DEFAULT 'expense',
  amount      INTEGER NOT NULL,
  category    TEXT NOT NULL DEFAULT '',
  note        TEXT NOT NULL DEFAULT '',
  happened_at TEXT NOT NULL,
  created_at  TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at  TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX idx_ledger_happened ON ledger(happened_at DESC, id DESC);
CREATE INDEX idx_ledger_type_cat ON ledger(type, category);
