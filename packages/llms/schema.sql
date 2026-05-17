-- 大模型:在用的 LLM API key 配置。
CREATE TABLE app_llms_keys (
  id            TEXT PRIMARY KEY,
  provider      TEXT NOT NULL DEFAULT '',
  name          TEXT NOT NULL,
  api_key       TEXT NOT NULL DEFAULT '',
  base_url      TEXT NOT NULL DEFAULT '',
  default_model TEXT NOT NULL DEFAULT '',
  quota_note    TEXT NOT NULL DEFAULT '',
  note          TEXT NOT NULL DEFAULT '',
  created_at    TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at    TEXT NOT NULL DEFAULT (datetime('now'))
);
