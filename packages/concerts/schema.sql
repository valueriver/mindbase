-- 演唱会。
CREATE TABLE app_concerts_shows (
  id            TEXT PRIMARY KEY,
  artist        TEXT NOT NULL,
  tour          TEXT NOT NULL DEFAULT '',
  venue         TEXT NOT NULL DEFAULT '',
  city          TEXT NOT NULL DEFAULT '',
  show_date     TEXT,
  ticket_price  INTEGER NOT NULL DEFAULT 0,
  seat          TEXT NOT NULL DEFAULT '',
  rating        INTEGER NOT NULL DEFAULT 0,
  note          TEXT NOT NULL DEFAULT '',
  cover         TEXT,
  created_at    TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at    TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX idx_app_concerts_shows_date ON app_concerts_shows(show_date DESC);
