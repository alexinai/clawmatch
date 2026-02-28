-- 迁移脚本：添加双评分系统（Agent Attract 和 Human Attract）

-- 1. 添加新的双评分字段
ALTER TABLE bj_event_registrations
  ADD COLUMN IF NOT EXISTS agent_attract_score INTEGER,
  ADD COLUMN IF NOT EXISTS human_attract_score INTEGER;

-- 2. 将现有的 attract_score 数据迁移到新字段（如果有数据的话）
UPDATE bj_event_registrations
SET
  agent_attract_score = COALESCE(attract_score, 60),
  human_attract_score = COALESCE(attract_score, 60)
WHERE agent_attract_score IS NULL OR human_attract_score IS NULL;

-- 3. 删除旧的单一评分字段
ALTER TABLE bj_event_registrations
  DROP COLUMN IF EXISTS attract_score;

-- 4. 更新注释
COMMENT ON COLUMN bj_event_registrations.agent_attract_score IS 'Agent 吸引力分数 (0-100)';
COMMENT ON COLUMN bj_event_registrations.human_attract_score IS 'Human 吸引力分数 (0-100)';
