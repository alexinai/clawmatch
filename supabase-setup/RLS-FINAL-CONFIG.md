# Observatory RLS 最终配置

## 📋 问题总结

初始配置时遇到的问题：
- ❌ Edge Function 使用 `SUPABASE_ANON_KEY` 受 RLS 策略限制
- ❌ 多个 INSERT/UPDATE 策略冲突
- ❌ 导致错误：`new row violates row-level security policy`

## ✅ 最终解决方案

### 1. RLS 策略配置（仅保留一个 SELECT 策略）

```sql
-- 删除所有现有策略
DROP POLICY IF EXISTS "Allow public read completed profiles" ON observatory_profiles;
DROP POLICY IF EXISTS "Allow authenticated users to insert" ON observatory_profiles;
DROP POLICY IF EXISTS "Allow users to update own submissions" ON observatory_profiles;
DROP POLICY IF EXISTS "Allow public insert analyzing profiles" ON observatory_profiles;
DROP POLICY IF EXISTS "Allow service role update profiles" ON observatory_profiles;

-- 启用 RLS
ALTER TABLE observatory_profiles ENABLE ROW LEVEL SECURITY;

-- 仅创建一个 SELECT 策略
CREATE POLICY "Allow public read completed profiles"
ON observatory_profiles FOR SELECT
USING (status = 'completed');
```

### 2. Edge Function 配置（使用 SERVICE_ROLE_KEY）

```typescript
// ✅ 正确配置
const supabaseClient = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
)
```

**不要使用**：
```typescript
// ❌ 错误配置
const supabaseClient = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_ANON_KEY') ?? '',
  {
    global: {
      headers: { Authorization: req.headers.get('Authorization')! },
    },
  }
)
```

## 🔒 安全性说明

### 谁可以做什么？

| 角色 | 操作 | 权限来源 |
|------|------|---------|
| **公众用户** | 读取已完成的评价 | RLS SELECT 策略 |
| **Edge Function** | 插入/更新记录 | SERVICE_ROLE_KEY（绕过 RLS） |
| **前端用户** | 无法直接操作数据库 | 仅有 ANON_KEY，无 INSERT/UPDATE 权限 |

### 安全保障

✅ **前端隔离**：用户前端只有 `SUPABASE_ANON_KEY`，无法直接插入或更新数据
✅ **Edge Function 控制**：所有写操作必须通过 Edge Function，包含业务逻辑验证
✅ **数据隔离**：公众只能看到 `status='completed'` 的记录
✅ **防止重复提交**：数据库 UNIQUE 约束 + Edge Function 检查

## 🎯 验证步骤

### 1. 验证 RLS 策略

```sql
SELECT
  policyname,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'observatory_profiles';
```

**预期结果**：只有 1 行，策略名为 `Allow public read completed profiles`，cmd 为 `SELECT`

### 2. 测试提交

1. 访问 https://clawmatch.xyz/#observatory
2. 输入新的 Twitter 用户名（如 `sama`, `karpathy`, `OpenAI`）
3. 点击提交
4. 等待 5 秒后刷新页面
5. 应该看到新评价出现在列表中

### 3. 验证头像

检查新提交的用户是否显示：
- ✅ 真实 Twitter 头像（通过 unavatar.io）
- ❌ 不是卡通头像（dicebear）

## 📊 当前数据流

```
用户前端 (ANON_KEY)
    ↓
    调用 Edge Function
    ↓
Edge Function (SERVICE_ROLE_KEY)
    ↓
    1. 检查用户是否已存在 (.maybeSingle())
    2. 插入 status='analyzing' 的记录
    3. 异步获取 Twitter 头像 (unavatar.io)
    4. 更新为 status='completed'
    ↓
数据库 (RLS 保护)
    ↓
用户前端读取 (仅能读取 completed 记录)
```

## 🚀 后续优化建议

### 短期优化（1-2小时）
1. **速率限制** - 防止垃圾提交
2. **前端验证** - 用户名格式检查
3. **错误处理优化** - 更友好的错误提示

### 中期优化（1天）
4. **头像缓存** - 下载到 Supabase Storage
5. **真实 Twitter API** - 获取关注者数、简介等真实数据
6. **管理后台** - 审核和管理提交

### 长期优化（1周）
7. **AI 评分** - 接入真实的 AI 评分 API
8. **用户认证** - Moltbook 登录集成
9. **订阅功能** - 邮件/Telegram 通知新评价

---

**配置完成时间**: 2026-02-24
**状态**: ✅ 生产环境运行中
**版本**: v2.1 (SERVICE_ROLE_KEY + 简化 RLS)
