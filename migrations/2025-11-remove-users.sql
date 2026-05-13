-- 去用户化:这是单机应用,不需要 user_id 字段,也不需要 users 表。
-- D1/SQLite 3.35+ 支持 DROP COLUMN。先删依赖的索引,再删字段,最后删表。

-- 1. 删依赖 user_id 的索引
DROP INDEX IF EXISTS idx_users_email;
DROP INDEX IF EXISTS idx_notebooks_user;
DROP INDEX IF EXISTS idx_notebooks_user_parent;
DROP INDEX IF EXISTS idx_notes_user;
DROP INDEX IF EXISTS idx_memos_user_created;
DROP INDEX IF EXISTS idx_tokens_user;

-- 2. 删 user_id 字段
ALTER TABLE notebooks DROP COLUMN user_id;
ALTER TABLE notes     DROP COLUMN user_id;
ALTER TABLE memos     DROP COLUMN user_id;
ALTER TABLE tokens    DROP COLUMN user_id;

-- 3. 删 users 表
DROP TABLE IF EXISTS users;

-- 4. 补几个新索引(原本带 user_id 现在改成普通索引)
CREATE INDEX IF NOT EXISTS idx_notebooks_parent     ON notebooks(parent_id);
CREATE INDEX IF NOT EXISTS idx_memos_created        ON memos(created_at DESC);
