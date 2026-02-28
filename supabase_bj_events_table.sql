-- 创建北京活动登记表
CREATE TABLE IF NOT EXISTS bj_event_registrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- 活动标识
  event_date TEXT NOT NULL CHECK (event_date IN ('228', '31')),

  -- 登记类型
  registration_type TEXT NOT NULL CHECK (registration_type IN ('twitter', 'wechat')),

  -- Twitter 用户信息
  twitter_username TEXT,
  twitter_avatar_url TEXT,
  attract_score INTEGER,  -- 吸引力分数

  -- 微信用户信息
  wechat_id TEXT,
  wechat_avatar_url TEXT,

  -- 通用信息
  self_intro TEXT CHECK (char_length(self_intro) <= 140),  -- 最多140字

  -- 元数据
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 创建唯一约束（防止同一用户重复登记同一活动）
CREATE UNIQUE INDEX IF NOT EXISTS unique_twitter_event
  ON bj_event_registrations (event_date, twitter_username)
  WHERE twitter_username IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS unique_wechat_event
  ON bj_event_registrations (event_date, wechat_id)
  WHERE wechat_id IS NOT NULL;

-- 创建索引以提升查询性能
CREATE INDEX IF NOT EXISTS idx_event_date ON bj_event_registrations (event_date);
CREATE INDEX IF NOT EXISTS idx_created_at ON bj_event_registrations (created_at DESC);

-- 启用 Row Level Security (RLS)
ALTER TABLE bj_event_registrations ENABLE ROW LEVEL SECURITY;

-- 允许所有人读取登记信息
CREATE POLICY "Allow public read access"
  ON bj_event_registrations
  FOR SELECT
  USING (true);

-- 允许所有人插入登记信息
CREATE POLICY "Allow public insert"
  ON bj_event_registrations
  FOR INSERT
  WITH CHECK (true);

-- 可选：允许用户删除自己的登记（如果需要的话）
-- CREATE POLICY "Allow users to delete their own registrations"
--   ON bj_event_registrations
--   FOR DELETE
--   USING (true);

-- 添加注释
COMMENT ON TABLE bj_event_registrations IS '北京活动用户登记表';
COMMENT ON COLUMN bj_event_registrations.event_date IS '活动日期标识: 228 或 31';
COMMENT ON COLUMN bj_event_registrations.registration_type IS '登记类型: twitter 或 wechat';
COMMENT ON COLUMN bj_event_registrations.attract_score IS 'Twitter用户的吸引力分数';
COMMENT ON COLUMN bj_event_registrations.self_intro IS '自我介绍（最多140字）';
