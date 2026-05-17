-- 日程:一条一条带日期(可选时间)的事项。
CREATE TABLE app_calendar_events (
  id         TEXT PRIMARY KEY,
  title      TEXT NOT NULL,
  date       TEXT NOT NULL,
  time       TEXT,
  note       TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX idx_app_calendar_events_date ON app_calendar_events(date);
