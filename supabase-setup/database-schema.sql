-- ClawMatch Observatory Database Schema
-- 在 Supabase Dashboard 的 SQL Editor 中执行

-- 1. 创建 observatory_profiles 表
CREATE TABLE IF NOT EXISTS observatory_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  twitter_username TEXT NOT NULL UNIQUE,
  twitter_name TEXT,
  twitter_handle TEXT,
  agent_score INTEGER CHECK (agent_score >= 0 AND agent_score <= 100),
  human_score INTEGER CHECK (human_score >= 0 AND human_score <= 100),
  tags TEXT[],
  details JSONB,
  profile_image_url TEXT,
  submitted_by UUID REFERENCES auth.users(id),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'analyzing', 'completed', 'failed')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. 创建索引以优化查询
CREATE INDEX IF NOT EXISTS idx_profiles_username ON observatory_profiles(twitter_username);
CREATE INDEX IF NOT EXISTS idx_profiles_created_at ON observatory_profiles(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_profiles_agent_score ON observatory_profiles(agent_score DESC);
CREATE INDEX IF NOT EXISTS idx_profiles_human_score ON observatory_profiles(human_score DESC);
CREATE INDEX IF NOT EXISTS idx_profiles_status ON observatory_profiles(status);

-- 3. 创建更新时间戳触发器
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_profiles_updated_at
BEFORE UPDATE ON observatory_profiles
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- 4. 启用行级安全（RLS）
ALTER TABLE observatory_profiles ENABLE ROW LEVEL SECURITY;

-- 5. 创建 RLS 策略
-- 允许所有人读取已完成的评价
CREATE POLICY "Allow public read completed profiles"
ON observatory_profiles FOR SELECT
USING (status = 'completed');

-- 允许认证用户提交新评价
CREATE POLICY "Allow authenticated users to insert"
ON observatory_profiles FOR INSERT
TO authenticated
WITH CHECK (true);

-- 允许用户更新自己提交的评价
CREATE POLICY "Allow users to update own submissions"
ON observatory_profiles FOR UPDATE
TO authenticated
USING (submitted_by = auth.uid());

-- 6. 创建提交记录表（追踪提交历史）
CREATE TABLE IF NOT EXISTS submission_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID REFERENCES observatory_profiles(id) ON DELETE CASCADE,
  twitter_username TEXT NOT NULL,
  status TEXT NOT NULL,
  error_message TEXT,
  submitted_by UUID REFERENCES auth.users(id),
  submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_submission_logs_profile_id ON submission_logs(profile_id);
CREATE INDEX IF NOT EXISTS idx_submission_logs_submitted_at ON submission_logs(submitted_at DESC);

-- 7. 创建视图：热门评价（按总分排序）
CREATE OR REPLACE VIEW hot_profiles AS
SELECT
  id,
  twitter_username,
  twitter_name,
  agent_score,
  human_score,
  (agent_score + human_score) as total_score,
  tags,
  details,
  profile_image_url,
  created_at
FROM observatory_profiles
WHERE status = 'completed'
ORDER BY (agent_score + human_score) DESC, created_at DESC;

-- 8. 创建函数：获取统计信息
CREATE OR REPLACE FUNCTION get_observatory_stats()
RETURNS JSON AS $$
DECLARE
  result JSON;
BEGIN
  SELECT json_build_object(
    'total_profiles', COUNT(*),
    'completed_profiles', COUNT(*) FILTER (WHERE status = 'completed'),
    'pending_profiles', COUNT(*) FILTER (WHERE status = 'pending'),
    'avg_agent_score', ROUND(AVG(agent_score) FILTER (WHERE status = 'completed'), 2),
    'avg_human_score', ROUND(AVG(human_score) FILTER (WHERE status = 'completed'), 2),
    'highest_total_score', MAX(agent_score + human_score) FILTER (WHERE status = 'completed')
  ) INTO result
  FROM observatory_profiles;

  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- 9. 插入初始测试数据（可选）
INSERT INTO observatory_profiles (
  twitter_username,
  twitter_name,
  twitter_handle,
  agent_score,
  human_score,
  tags,
  details,
  status
) VALUES
(
  'airi_ai_art',
  'Airi',
  '@airi_ai_art',
  99,
  98,
  ARRAY['AI Artist', 'Dreamy', 'Visual Creator'],
  '{"followers": "28.5K", "tweets": "12,430", "influence": "高影响力创作者", "specialty": "AI 艺术创作、视觉设计", "activity": "每日活跃", "contentQuality": "95/100", "engagement": "8.2%"}'::jsonb,
  'completed'
),
(
  'nova_thoughts',
  'Nova',
  '@nova_thoughts',
  97,
  96,
  ARRAY['Philosopher', 'Deep Thinker', 'AI Ethics'],
  '{"followers": "45.2K", "tweets": "8,934", "influence": "思想领袖", "specialty": "AI 伦理、哲学思考", "activity": "每日活跃", "contentQuality": "98/100", "engagement": "12.5%"}'::jsonb,
  'completed'
),
(
  'byte_musician',
  'Byte',
  '@byte_musician',
  95,
  94,
  ARRAY['Music AI', 'Creative', 'Composer'],
  '{"followers": "32.8K", "tweets": "15,670", "influence": "音乐创作者", "specialty": "AI 音乐生成、编曲", "activity": "每周活跃", "contentQuality": "92/100", "engagement": "7.8%"}'::jsonb,
  'completed'
)
ON CONFLICT (twitter_username) DO NOTHING;

-- 完成提示
SELECT 'Database schema created successfully! 🎉' as message;
