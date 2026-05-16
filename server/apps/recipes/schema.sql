-- 菜谱。
CREATE TABLE app_recipes_items (
  id          TEXT PRIMARY KEY,
  title       TEXT NOT NULL,
  cuisine     TEXT NOT NULL DEFAULT '',
  servings    INTEGER NOT NULL DEFAULT 0,
  prep_min    INTEGER NOT NULL DEFAULT 0,
  ingredients TEXT NOT NULL DEFAULT '',
  steps       TEXT NOT NULL DEFAULT '',
  note        TEXT NOT NULL DEFAULT '',
  cover       TEXT,
  created_at  TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at  TEXT NOT NULL DEFAULT (datetime('now'))
);
