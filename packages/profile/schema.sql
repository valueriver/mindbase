-- 个人档:多 block 组成,每个 block 有标题 + 内容。
CREATE TABLE app_profile_blocks (
  id          TEXT PRIMARY KEY,
  title       TEXT NOT NULL DEFAULT '',
  content     TEXT NOT NULL DEFAULT '',
  sort_order  INTEGER NOT NULL DEFAULT 0,
  created_at  TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at  TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX idx_app_profile_blocks_sort ON app_profile_blocks(sort_order);
