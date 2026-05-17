-- 病例:就诊记录。
CREATE TABLE app_medical_records (
  id          TEXT PRIMARY KEY,
  date        TEXT NOT NULL,
  hospital    TEXT NOT NULL DEFAULT '',
  doctor      TEXT NOT NULL DEFAULT '',
  diagnosis   TEXT NOT NULL DEFAULT '',
  prescription TEXT NOT NULL DEFAULT '',
  note        TEXT NOT NULL DEFAULT '',
  cover       TEXT,
  created_at  TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at  TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX idx_app_medical_records_date ON app_medical_records(date DESC);
