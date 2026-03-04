# 🦞 ClawMatch 网站部署架构说明

## 📊 架构概览

```
┌─────────────────────────────────────────────────────────────────┐
│                         用户浏览器                                │
│                    https://clawmatch.xyz                        │
└────────────────────┬────────────────────────────────────────────┘
                     │
                     │ DNS 解析
                     ↓
┌─────────────────────────────────────────────────────────────────┐
│                      GitHub Pages                               │
│                  (alexinai/clawmatch)                          │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  • index.html (主页面)                                     │  │
│  │  • favicon-*.png (网站图标)                                │  │
│  │  • 静态资源 (CSS/JS 内嵌在 HTML 中)                        │  │
│  └──────────────────────────────────────────────────────────┘  │
└────────────────────┬────────────────────────────────────────────┘
                     │
                     │ 前端调用
                     ↓
┌─────────────────────────────────────────────────────────────────┐
│                    Supabase 云服务                               │
│              (yrbmpkqybdtocbhbpvwg.supabase.co)                │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │              PostgreSQL 数据库                           │   │
│  │  • observatory_profiles (用户评价数据)                   │   │
│  │  • registrations (活动报名数据)                          │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │              Edge Functions (Deno)                       │   │
│  │  • personality-analysis (性格分析)                       │   │
│  │  • score-twitter-profile (Observatory 评分)             │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │              Storage (文件存储)                          │   │
│  │  • 用户头像、图片等资源                                   │   │
│  └─────────────────────────────────────────────────────────┘   │
└────────────────────┬────────────────────────────────────────────┘
                     │
                     │ API 调用
                     ↓
┌─────────────────────────────────────────────────────────────────┐
│                    DeepSeek LLM API                             │
│                 https://api.deepseek.com                        │
│  • 性格分析生成                                                  │
│  • 小龙虾点评生成                                                │
│  • 性倾向雷达推测                                                │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🏗️ 架构组成部分

### 1. 前端托管：GitHub Pages

**服务：** GitHub Pages
**仓库：** https://github.com/alexinai/clawmatch
**分支：** main
**域名：** https://clawmatch.xyz

**技术栈：**
- 纯静态网站（单个 `index.html` 文件）
- CSS 和 JavaScript 内嵌在 HTML 中
- 使用 Supabase JavaScript SDK

**部署流程：**
```
本地修改 → git push → GitHub 自动部署 → 网站更新
```

**优点：**
- ✅ 完全免费
- ✅ 自动 HTTPS
- ✅ 全球 CDN 加速
- ✅ 推送即部署（1-2分钟）
- ✅ 版本控制

---

### 2. 后端服务：Supabase

**项目 ID：** yrbmpkqybdtocbhbpvwg
**区域：** 自动选择最近区域
**URL：** https://yrbmpkqybdtocbhbpvwg.supabase.co

#### 2.1 数据库 (PostgreSQL)

**表结构：**

**`observatory_profiles`** - Observatory 用户评价
| 字段 | 类型 | 说明 |
|------|------|------|
| id | UUID | 主键 |
| twitter_username | TEXT | Twitter 用户名（唯一） |
| twitter_name | TEXT | 显示名 |
| profile_image_url | TEXT | 头像 URL |
| agent_score | INTEGER | Agent 吸引力分数 (0-100) |
| human_score | INTEGER | Human 吸引力分数 (0-100) |
| tags | TEXT[] | 标签数组 |
| lobster_comment | TEXT | 小龙虾点评（含性倾向雷达） |
| status | TEXT | 状态 (completed) |
| created_at | TIMESTAMP | 创建时间 |
| updated_at | TIMESTAMP | 更新时间 |

**`registrations`** - 31BJ 活动报名
| 字段 | 类型 | 说明 |
|------|------|------|
| id | UUID | 主键 |
| twitter_username | TEXT | Twitter 用户名 |
| agent_attract_score | INTEGER | Agent 吸引力分数 |
| human_attract_score | INTEGER | Human 吸引力分数 |
| created_at | TIMESTAMP | 报名时间 |

**RLS (Row Level Security)：**
- 所有人可读（SELECT）
- 仅 service_role 可写（INSERT/UPDATE）

#### 2.2 Edge Functions (Serverless)

**`personality-analysis`**
- **语言：** Deno (TypeScript)
- **功能：** 性格分析实验室
- **输入：** username, bio
- **输出：** agentScore, humanScore, bigFive, tags, lobsterComment, intimacy 分析
- **调用 API：** DeepSeek LLM

**`score-twitter-profile`** ⭐ 最新版
- **语言：** Deno (TypeScript)
- **功能：** Observatory 用户评价
- **输入：** twitterUsername, twitterName, profileImageUrl
- **输出：** agentScore, humanScore, tags, lobsterComment (含性倾向雷达)
- **调用 API：** DeepSeek LLM
- **新特性：**
  - 🦞 小龙虾性格（毒舌可爱）
  - 🌈 性倾向雷达（幽默尊重）
  - 📊 多维度分析（用户名+显示名+头像）
  - 🎨 6种点评风格随机切换
  - 🔥 Temperature 0.9（高创意度）

**环境变量：**
- `DEEPSEEK_API_KEY` - DeepSeek API 密钥
- `SUPABASE_URL` - Supabase 项目 URL（自动注入）
- `SUPABASE_SERVICE_ROLE_KEY` - 服务密钥（自动注入）

---

### 3. AI 服务：DeepSeek LLM

**API 端点：** https://api.deepseek.com/v1/chat/completions
**模型：** deepseek-chat
**用途：**
- 性格分析
- 小龙虾点评生成
- 性倾向推测

**定价：**
- 输入：¥1/1M tokens
- 输出：¥2/1M tokens
- **单次成本：约 ¥0.002-0.003**（非常便宜）

**参数配置：**
- Temperature: 0.9（高创意度，多样化输出）
- Max tokens: 1000-1500
- 平均响应时间：10-15秒

---

### 4. DNS 和域名

**域名：** clawmatch.xyz
**DNS 记录：** 指向 GitHub Pages
**HTTPS：** 由 GitHub Pages 自动提供

**CNAME 文件内容：**
```
clawmatch.xyz
```

---

## 🔄 完整数据流

### 场景 1：用户访问网站

```
用户输入 clawmatch.xyz
    ↓
DNS 解析到 GitHub Pages
    ↓
加载 index.html
    ↓
浏览器渲染页面
    ↓
加载 Supabase SDK
    ↓
连接到 Supabase (yrbmpkqybdtocbhbpvwg)
```

### 场景 2：Observatory 提交评价

```
用户输入 @username
    ↓
前端调用 Supabase Edge Function
    POST /functions/v1/score-twitter-profile
    Body: { twitterUsername, twitterName, profileImageUrl }
    ↓
Edge Function 检查数据库缓存
    ↓ (未找到)
Edge Function 调用 DeepSeek API
    POST https://api.deepseek.com/v1/chat/completions
    ↓
DeepSeek 返回分析结果
    { agentScore, humanScore, tags, lobsterComment, orientationGuess }
    ↓
Edge Function 合并点评和性倾向雷达
    fullComment = lobsterComment + "\n\n🦞 性倾向雷达：" + orientationGuess
    ↓
Edge Function 保存到数据库
    INSERT INTO observatory_profiles
    ↓
返回结果到前端
    ↓
前端渲染显示
```

### 场景 3：性格分析实验室

```
用户输入用户名和 bio
    ↓
前端调用 personality-analysis Edge Function
    ↓
Edge Function 调用 DeepSeek API
    ↓
返回完整性格分析（Big Five + 双评分 + 亲密关系分析）
    ↓
前端渲染结果
```

---

## 📈 性能和扩展性

### 当前性能：

**前端（GitHub Pages）：**
- ⚡ 加载速度：< 1 秒（全球 CDN）
- 🌍 可用性：99.9%
- 💰 成本：免费
- 📊 带宽：无限

**后端（Supabase）：**
- ⚡ API 响应：< 200ms（数据库查询）
- ⚡ Edge Function：10-15秒（含 LLM 调用）
- 💾 数据库：PostgreSQL (免费层 500MB)
- 🔥 并发：中等（免费层限制）

**AI 服务（DeepSeek）：**
- ⚡ 响应速度：8-12秒
- 💰 成本：¥0.003/次分析
- 📊 月成本（1000次）：约 ¥3

### 性能优化（已实施）：

**Observatory 加载优化：**
- ✅ LocalStorage 缓存（5分钟）
- ✅ 分页加载（每页 20 条）
- ✅ 无限滚动
- ✅ 数据库查询优化（只查询必要字段）

**结果：**
- 首次加载：2-3秒
- 缓存命中：< 100ms
- 滚动加载：< 500ms

---

## 🔒 安全性

### API 密钥管理：

**前端（公开）：**
- ✅ Supabase Anon Key（仅允许读取和调用 Edge Functions）
- ✅ 受 RLS 策略保护

**后端（私密）：**
- 🔐 DEEPSEEK_API_KEY（存储在 Supabase Secrets）
- 🔐 SUPABASE_SERVICE_ROLE_KEY（自动注入）
- 🔐 不暴露给前端

### 数据保护：

- ✅ PostgreSQL RLS（行级安全）
- ✅ HTTPS 加密传输
- ✅ CORS 配置正确
- ✅ API Rate Limiting（Supabase 自动）

---

## 💰 成本分析

### 月成本估算（假设 1000 次分析）：

| 服务 | 套餐 | 月成本 |
|------|------|--------|
| **GitHub Pages** | 免费 | ¥0 |
| **Supabase** | 免费层 | ¥0 |
| **DeepSeek API** | 按量付费 | ¥3 |
| **域名** | .xyz | 约 ¥60/年 = ¥5/月 |
| **总计** | - | **¥8/月** |

**非常便宜！** 🎉

### 升级方案（如需要）：

**Supabase Pro ($25/月)：**
- 无限 Edge Function 调用
- 8GB 数据库
- 更高并发
- 更好支持

**当前免费层限制：**
- ✅ 500MB 数据库（足够 50万+ 用户评价）
- ✅ 500k Edge Function 调用/月
- ✅ 2GB 文件存储
- ✅ 50GB 带宽/月

**结论：暂时不需要升级！**

---

## 🚀 部署流程

### 开发 → 生产

```bash
# 1. 本地开发
vim index.html

# 2. 测试
open index.html  # 本地浏览器测试

# 3. 提交
git add index.html
git commit -m "✨ 新功能"

# 4. 推送
git push origin main

# 5. 自动部署（1-2分钟）
# GitHub Pages 自动检测推送并部署

# 6. 验证
curl https://clawmatch.xyz
```

### Edge Function 部署

```bash
# 方式 1: Supabase Dashboard（推荐）
# 1. 访问 https://supabase.com/dashboard/project/yrbmpkqybdtocbhbpvwg/functions
# 2. 编辑函数代码
# 3. 点击 "Deploy"

# 方式 2: Supabase CLI
supabase functions deploy score-twitter-profile
```

---

## 📊 监控和日志

### 前端监控：

- GitHub Pages 状态：https://www.githubstatus.com/
- 访问统计：可接入 Google Analytics

### 后端监控：

- Supabase Dashboard：https://supabase.com/dashboard/project/yrbmpkqybdtocbhbpvwg
- Edge Function Logs：实时查看调用日志
- Database Metrics：查询性能、存储使用

### 日志查看：

```bash
# Edge Function 日志
# Dashboard → Functions → score-twitter-profile → Logs

# 数据库查询日志
# Dashboard → Database → Logs
```

---

## 🔧 技术栈总结

| 层级 | 技术 | 版本/服务 |
|------|------|-----------|
| **前端框架** | 原生 HTML/CSS/JS | - |
| **托管** | GitHub Pages | - |
| **后端** | Supabase | PostgreSQL + Edge Functions |
| **Runtime** | Deno | 用于 Edge Functions |
| **数据库** | PostgreSQL | Supabase 托管 |
| **AI** | DeepSeek LLM | deepseek-chat |
| **域名** | clawmatch.xyz | - |
| **CDN** | GitHub Pages CDN | 全球加速 |
| **SSL** | Let's Encrypt | 自动 HTTPS |

---

## 🎯 架构优势

### ✅ 优点

1. **极低成本** - 月成本仅 ¥8（包含域名）
2. **高可用性** - GitHub Pages 99.9% SLA
3. **全球加速** - CDN 分发，访问速度快
4. **易于维护** - 单文件架构，推送即部署
5. **安全可靠** - HTTPS + RLS + API 密钥隔离
6. **可扩展** - Supabase 免费层足够支撑初期增长

### ⚠️ 限制

1. **无服务端渲染** - 纯静态，SEO 依赖前端渲染
2. **Supabase 免费层限制** - 月 500k Edge Function 调用
3. **DeepSeek API 依赖** - 如果服务中断，LLM 功能不可用

### 🚀 未来优化方向

1. **CDN 优化** - 考虑 Cloudflare CDN（更快）
2. **SSR/SSG** - 迁移到 Next.js/Nuxt（更好的 SEO）
3. **数据库优化** - 添加缓存层（Redis）
4. **监控** - 接入 Sentry / DataDog

---

## 📞 关键配置信息

### GitHub

- **仓库：** https://github.com/alexinai/clawmatch
- **分支：** main
- **访问令牌：** 已配置（`.git/config`）

### Supabase

- **项目 ID：** yrbmpkqybdtocbhbpvwg
- **URL：** https://yrbmpkqybdtocbhbpvwg.supabase.co
- **Dashboard：** https://supabase.com/dashboard/project/yrbmpkqybdtocbhbpvwg

### DeepSeek

- **API Endpoint：** https://api.deepseek.com/v1/chat/completions
- **Model：** deepseek-chat
- **API Key：** 存储在 Supabase Secrets

### 域名

- **主域名：** clawmatch.xyz
- **DNS：** 指向 GitHub Pages

---

**文档创建日期：** 2026-03-04
**架构版本：** v2.0 (小龙虾增强版)
**维护者：** ClawMatch Team + Claude Code
