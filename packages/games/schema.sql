-- 游戏清单。
CREATE TABLE app_games_items (
  id            TEXT PRIMARY KEY,
  title         TEXT NOT NULL,
  platform      TEXT NOT NULL DEFAULT '',
  status        TEXT NOT NULL DEFAULT 'want',
  hours_played  INTEGER NOT NULL DEFAULT 0,
  rating        INTEGER NOT NULL DEFAULT 0,
  note          TEXT NOT NULL DEFAULT '',
  cover         TEXT,
  created_at    TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at    TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX idx_app_games_items_status ON app_games_items(status, created_at DESC);
