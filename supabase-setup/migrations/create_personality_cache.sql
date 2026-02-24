-- 创建性格分析缓存表
CREATE TABLE IF NOT EXISTS personality_analysis_cache (
  username TEXT PRIMARY KEY,
  analysis_result JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 创建索引以便过期清理
CREATE INDEX IF NOT EXISTS idx_cache_created_at ON personality_analysis_cache(created_at);

-- 创建自动更新时间戳的触发器
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_personality_cache_updated_at BEFORE UPDATE
    ON personality_analysis_cache FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 创建定期清理函数（删除超过30天的缓存）
CREATE OR REPLACE FUNCTION clean_old_cache()
RETURNS void AS $$
BEGIN
  DELETE FROM personality_analysis_cache
  WHERE created_at < NOW() - INTERVAL '30 days';
END;
$$ LANGUAGE plpgsql;

-- 设置RLS（Row Level Security）
ALTER TABLE personality_analysis_cache ENABLE ROW LEVEL SECURITY;

-- 允许所有人读取（用于前端展示）
CREATE POLICY "Allow public read access" ON personality_analysis_cache
  FOR SELECT USING (true);

-- 只允许服务角色写入（用于Edge Function）
CREATE POLICY "Allow service role write access" ON personality_analysis_cache
  FOR ALL USING (auth.role() = 'service_role');
