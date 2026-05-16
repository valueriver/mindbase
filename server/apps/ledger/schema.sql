-- 记账:逐笔流水。amount 单位"分"避免浮点。
CREATE TABLE app_ledger_entries (
  id          TEXT PRIMARY KEY,
  type        TEXT NOT NULL DEFAULT 'expense',   -- 'expense' | 'income'
  amount      INTEGER NOT NULL,
  category    TEXT NOT NULL DEFAULT '',
  note        TEXT NOT NULL DEFAULT '',
  happened_at TEXT NOT NULL,
  created_at  TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at  TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX idx_app_ledger_entries_happened ON app_ledger_entries(happened_at DESC, id DESC);
CREATE INDEX idx_app_ledger_entries_type_cat ON app_ledger_entries(type, category);
