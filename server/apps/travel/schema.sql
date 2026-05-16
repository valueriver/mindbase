-- 旅行计划。status ∈ { planning, booked, done }。
CREATE TABLE app_travel_trips (
  id          TEXT PRIMARY KEY,
  destination TEXT NOT NULL,
  start_date  TEXT,
  end_date    TEXT,
  status      TEXT NOT NULL DEFAULT 'planning',
  note        TEXT NOT NULL DEFAULT '',
  cover       TEXT,
  created_at  TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at  TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX idx_app_travel_trips_status ON app_travel_trips(status);
CREATE INDEX idx_app_travel_trips_start  ON app_travel_trips(start_date);
