-- 通讯录:联系人。
CREATE TABLE app_contacts_people (
  id          TEXT PRIMARY KEY,
  name        TEXT NOT NULL,
  nickname    TEXT NOT NULL DEFAULT '',
  phone       TEXT NOT NULL DEFAULT '',
  email       TEXT NOT NULL DEFAULT '',
  company     TEXT NOT NULL DEFAULT '',
  title       TEXT NOT NULL DEFAULT '',
  address     TEXT NOT NULL DEFAULT '',
  birthday    TEXT,
  note        TEXT NOT NULL DEFAULT '',
  avatar      TEXT,
  created_at  TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at  TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX idx_app_contacts_people_name ON app_contacts_people(name);
