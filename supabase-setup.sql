-- ============================================================
-- Supabase 建表脚本（在 Supabase SQL Editor 里执行一次）
-- 表：tasks（id / title / priority / completed / created_at / due_date）
-- ============================================================

CREATE TABLE IF NOT EXISTS tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  priority text NOT NULL DEFAULT '中' CHECK (priority IN ('高', '中', '低')),
  completed boolean NOT NULL DEFAULT false,
  due_date date,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 查询性能优化：按创建时间倒序查列表
CREATE INDEX IF NOT EXISTS idx_tasks_created_at ON tasks (created_at DESC);

-- RLS 策略：课程项目用发布密钥，允许匿名读写（如需用户隔离再改）
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "tasks_select" ON tasks;
DROP POLICY IF EXISTS "tasks_insert" ON tasks;
DROP POLICY IF EXISTS "tasks_update" ON tasks;
DROP POLICY IF EXISTS "tasks_delete" ON tasks;

CREATE POLICY "tasks_select" ON tasks FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "tasks_insert" ON tasks FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "tasks_update" ON tasks FOR UPDATE TO anon, authenticated USING (true);
CREATE POLICY "tasks_delete" ON tasks FOR DELETE TO anon, authenticated USING (true);
