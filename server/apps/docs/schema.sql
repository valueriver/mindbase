-- 证件库:身份证、护照、驾照等。明文存储(单机自部署设计选择)。
CREATE TABLE app_docs_items (
  id          TEXT PRIMARY KEY,
  name        TEXT NOT NULL,
  number      TEXT NOT NULL DEFAULT '',
  issuer      TEXT NOT NULL DEFAULT '',
  issued_at   TEXT,
  expire_at   TEXT,
  image_front TEXT,
  image_back  TEXT,
  note        TEXT NOT NULL DEFAULT '',
  created_at  TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at  TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX idx_app_docs_items_expire ON app_docs_items(expire_at);
