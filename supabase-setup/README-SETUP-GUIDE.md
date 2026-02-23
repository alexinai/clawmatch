# ClawMatch Supabase 后端集成完整指南

## 📋 目录
1. [数据库设置](#1-数据库设置)
2. [Edge Function 部署](#2-edge-function-部署)
3. [前端集成](#3-前端集成)
4. [测试验证](#4-测试验证)
5. [生产部署](#5-生产部署)

---

## 1. 数据库设置

### 步骤 1.1: 登录 Supabase Dashboard
访问: https://supabase.com/dashboard/project/wnvkcikcrjlgeptfhidg

### 步骤 1.2: 执行数据库迁移
1. 点击左侧菜单 **SQL Editor**
2. 点击 **New Query**
3. 复制 `database-schema.sql` 的全部内容
4. 粘贴到编辑器
5. 点击 **Run** 执行

**预期结果**:
```
✅ Table "observatory_profiles" created
✅ Table "submission_logs" created
✅ View "hot_profiles" created
✅ Function "get_observatory_stats" created
✅ 3 test profiles inserted
```

### 步骤 1.3: 验证表结构
```sql
-- 在 SQL Editor 中执行
SELECT * FROM observatory_profiles;
```

应该看到 3 条测试数据（Airi, Nova, Byte）。

### 步骤 1.4: 获取 API Keys
1. 点击左侧菜单 **Settings** → **API**
2. 复制以下信息：
   - **Project URL**: `https://wnvkcikcrjlgeptfhidg.supabase.co`
   - **anon public**: `eyJ... (很长的 JWT token)`

---

## 2. Edge Function 部署

### 方式 A: 通过 Dashboard（推荐新手）

1. 点击左侧菜单 **Edge Functions**
2. 点击 **Create a new function**
3. 函数名称: `score-twitter-profile`
4. 复制 `edge-function-score-profile.ts` 的内容
5. 粘贴到编辑器
6. 点击 **Deploy** 部署

### 方式 B: 通过 CLI（推荐高级用户）

如果你想使用 CLI 部署，需要先安装 Supabase CLI：

```bash
# macOS 安装 Homebrew（如果还没有）
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# 安装 Supabase CLI
brew install supabase/tap/supabase

# 登录 Supabase
supabase login

# 部署 Edge Function
cd /Users/mac/openclaw-workspace/supabase-setup
supabase functions deploy score-twitter-profile --project-ref wnvkcikcrjlgeptfhidg
```

### 步骤 2.2: 设置环境变量

在 Edge Function 设置中添加：
- `SUPABASE_URL`: `https://wnvkcikcrjlgeptfhidg.supabase.co`
- `SUPABASE_ANON_KEY`: `<your-anon-key>`
- `TWITTER_BEARER_TOKEN`: `<可选，真实 Twitter API token>`

### 步骤 2.3: 测试 Edge Function

```bash
curl -X POST \
  'https://wnvkcikcrjlgeptfhidg.supabase.co/functions/v1/score-twitter-profile' \
  -H 'Authorization: Bearer <your-anon-key>' \
  -H 'Content-Type: application/json' \
  -d '{"twitterUsername": "test_user_123"}'
```

**预期响应**:
```json
{
  "success": true,
  "message": "提交成功，小龙虾正在分析中...",
  "data": {
    "id": "uuid...",
    "twitter_username": "test_user_123",
    "status": "pending"
  }
}
```

---

## 3. 前端集成

### 步骤 3.1: 更新 Supabase 配置

在 `index.html` 中，找到以下代码（约在第 1200 行）：

```javascript
const SUPABASE_URL = 'https://wnvkcikcrjlgeptfhidg.supabase.co'
const SUPABASE_ANON_KEY = 'YOUR_ANON_KEY_HERE' // ⚠️ 替换为真实的 anon key
```

**替换为你从 Dashboard 复制的真实 API keys**。

### 步骤 3.2: 修改前端函数

我将创建一个新的 `index-supabase-integrated.html` 文件，包含完整的 Supabase 集成代码。

---

## 4. 测试验证

### 测试 1: 本地测试
1. 用浏览器打开 `index.html`
2. 打开开发者工具 Console
3. 应该看到：`✅ Supabase 初始化成功`

### 测试 2: 提交 Twitter 用户
1. 进入 Observatory 页面
2. 输入 Twitter 用户名：`testuser123`
3. 点击"提交评价 Submit"
4. 应该看到："小龙虾正在分析中..."
5. 3 秒后自动出现在列表中

### 测试 3: 验证数据库
在 Supabase Dashboard SQL Editor 执行：
```sql
SELECT * FROM observatory_profiles ORDER BY created_at DESC LIMIT 10;
```

应该看到刚刚提交的用户。

---

## 5. 生产部署

### 步骤 5.1: 推送到 GitHub

```bash
cd /Users/mac/openclaw-workspace
git add index.html supabase-setup/
git commit -m "Add Supabase backend integration for Observatory"
git push origin main
```

### 步骤 5.2: GitHub Pages 自动部署
等待 2-3 分钟，GitHub Pages 会自动部署到 clawmatch.xyz

### 步骤 5.3: 验证生产环境
1. 访问 https://clawmatch.xyz
2. 进入 Observatory 页面
3. 提交一个测试用户
4. 确认数据保存到数据库

---

## 🔐 安全注意事项

### ✅ 安全的做法：
- **anon key 可以公开**：这是 Supabase 设计的公开 key，安全性由 RLS 策略保证
- **启用 RLS**：我们已在数据库 schema 中启用了 Row Level Security
- **HTTPS 传输**：所有数据通过 HTTPS 加密传输

### ⚠️ 不要做的事：
- **不要暴露 service_role key**：这是管理员密钥，绝不能放在前端
- **不要关闭 RLS**：这会导致所有数据公开可访问

---

## 📊 数据流程图

```
用户提交 Twitter 用户名
    ↓
前端调用 submitProfile()
    ↓
调用 Supabase Edge Function
    ↓
Edge Function:
  1. 验证用户名
  2. 检查是否重复
  3. 创建 pending 记录
  4. 异步评分
  5. 更新为 completed
    ↓
前端实时监听变化
    ↓
自动更新 UI 显示新评分
```

---

## 🆘 故障排除

### 问题 1: "Supabase 初始化失败"
**原因**: anon key 未正确配置
**解决**: 检查 `SUPABASE_ANON_KEY` 是否正确复制

### 问题 2: "Cross-Origin Request Blocked"
**原因**: CORS 未正确配置
**解决**: 在 Edge Function 中已包含 CORS headers，确保部署成功

### 问题 3: "RLS policy violation"
**原因**: Row Level Security 策略阻止操作
**解决**: 检查数据库 RLS 策略，确保 `Allow public read completed profiles` 已启用

### 问题 4: Edge Function 超时
**原因**: Function 执行时间过长
**解决**: 确保异步评分逻辑正确，不在主响应中等待

---

## 📈 后续优化

### Phase 1: 基础功能（当前）
- ✅ 提交 Twitter 用户名
- ✅ 模拟评分
- ✅ 数据持久化

### Phase 2: 真实 Twitter API
- [ ] 集成 Twitter API v2
- [ ] 抓取真实推文内容
- [ ] 分析用户画像

### Phase 3: AI 评分
- [ ] 集成 Gemini/OpenAI API
- [ ] 内容语义分析
- [ ] 生成详细评价

### Phase 4: 高级功能
- [ ] 实时推送通知
- [ ] 用户收藏列表
- [ ] 评价历史记录
- [ ] 排行榜系统

---

## 🎯 快速启动清单

- [ ] 1. 执行 `database-schema.sql` 创建表
- [ ] 2. 部署 Edge Function `score-twitter-profile`
- [ ] 3. 复制 anon key 到 `index.html`
- [ ] 4. 本地测试提交功能
- [ ] 5. 推送到 GitHub
- [ ] 6. 验证生产环境

完成这 6 步，你的后端功能就上线了！🚀

---

**创建时间**: 2026-02-24
**作者**: Claude (AI Assistant)
**项目**: ClawMatch Observatory Backend
