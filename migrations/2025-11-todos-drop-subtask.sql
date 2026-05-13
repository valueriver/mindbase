DROP INDEX IF EXISTS idx_todos_parent;
ALTER TABLE todos DROP COLUMN parent_id;
CREATE INDEX IF NOT EXISTS idx_todos_done ON todos(done, sort_order);
