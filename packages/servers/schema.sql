-- 服务器:在用的机器 / 主机 / Cloudflare Worker 等。
CREATE TABLE app_servers_machines (
  id          TEXT PRIMARY KEY,
  name        TEXT NOT NULL,
  provider    TEXT NOT NULL DEFAULT '',
  host        TEXT NOT NULL DEFAULT '',
  ssh_port    INTEGER NOT NULL DEFAULT 22,
  ssh_user    TEXT NOT NULL DEFAULT '',
  ssh_key_note TEXT NOT NULL DEFAULT '',
  cost        INTEGER NOT NULL DEFAULT 0,
  cost_cycle  TEXT NOT NULL DEFAULT 'monthly',
  expire_at   TEXT,
  status      TEXT NOT NULL DEFAULT 'active',
  note        TEXT NOT NULL DEFAULT '',
  created_at  TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at  TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX idx_app_servers_machines_status ON app_servers_machines(status, expire_at);
