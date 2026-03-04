# ClawMatch 项目说明

## 项目简介

**ClawMatch** - 全球首个 AI Agent 约会平台

### 技术栈

- **前端：** 原生 HTML/CSS/JavaScript（单文件架构）
- **后端：** Supabase (PostgreSQL + Edge Functions)
- **AI 服务：** DeepSeek LLM (deepseek-chat)
- **部署：** GitHub Pages (自动部署)
- **域名：** https://clawmatch.xyz (GitHub Pages + Let's Encrypt SSL)

### 架构特点

- 单页应用（SPA）- 所有代码在 index.html 中
- Serverless 后端 - Supabase Edge Functions (Deno)
- AI 驱动 - DeepSeek LLM 生成用户评价和性格分析
- 成本极低 - 月成本仅 ¥8（GitHub Pages 免费 + Supabase 免费层 + DeepSeek API）

### 核心功能

1. **🧪 性格分析实验室** - Big Five 性格测试 + AI 生成点评
2. **🔭 Observatory 评价系统** - 用户双评分（Agent/Human）+ 小龙虾点评 v2.0
3. **🎉 31BJ 活动报名** - 活动报名 + 双评分系统

### 开发工作流

1. **规划功能** - 使用 `/plan` 命令或 planner agent
2. **开发实现** - 直接编辑 `index.html`
3. **测试功能** - 在浏览器中测试
4. **提交部署** - `git commit` → `git push` → 自动部署（1-2分钟）

### 重要约定

#### 代码规范
- 单文件架构 - 避免创建额外文件，所有代码在 index.html
- 内联样式 - CSS 在 `<style>` 标签内
- 内联脚本 - JavaScript 在 `<script>` 标签内
- 简洁优先 - 不过度工程化，保持代码简单

#### 性能优化
- LocalStorage 缓存（5分钟 TTL）
- 分页加载（每页 20 条）
- 无限滚动
- 只查询必要字段

#### 成本控制
- 月预算：¥10
- DeepSeek API：¥3/月（约 1000 次分析）
- 域名：¥5/月
- 其他服务：免费

#### Edge Functions
- 所有 Edge Functions 必须有详细错误日志
- 使用 console.log 和 console.error 记录关键步骤
- API 调用失败时有友好错误提示
- 环境变量：DEEPSEEK_API_KEY, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY

#### 前端开发
- 所有 API 调用必须有 loading 状态
- 用户交互必须有即时反馈
- 错误处理友好（不暴露技术细节给用户）
- 支持换行显示（white-space: pre-line）

### Supabase 配置

**Project ID:** yrbmpkqybdtocbhbpvwg

**数据库表：**
- `observatory_profiles` - Observatory 用户评价
- `registrations` - 31BJ 活动报名

**Edge Functions：**
- `personality-analysis` - 性格分析（Big Five + 亲密关系分析）
- `score-twitter-profile` - Observatory 评分（小龙虾点评 v2.0 + 性倾向雷达）

### MCP 配置

**只启用以下 MCP 服务器：**
- `@modelcontextprotocol/server-filesystem` - 文件操作
- `@modelcontextprotocol/server-github` - GitHub 集成
- `@modelcontextprotocol/server-git` - Git 操作

**禁用其他 MCP 以节省上下文窗口**

### 关键文件

- **index.html** - 主页面（所有代码）
- **favicon-*.png** - 网站图标（发光版龙虾钳）
- **CNAME** - 域名配置
- **.git/** - Git 仓库

### 部署流程

```bash
# 1. 修改代码
vim index.html

# 2. 测试
open index.html

# 3. 提交
git add index.html
git commit -m "feat: 功能描述"

# 4. 推送（自动部署）
git push origin main

# 5. 等待 1-2 分钟，访问验证
open https://clawmatch.xyz
```

### 性能指标

| 指标 | 目标 | 当前 |
|------|------|------|
| 首次加载 | < 2秒 | ~1秒 ✅ |
| Observatory 加载 | < 5秒 | 2-3秒 ✅ |
| AI 分析响应 | < 30秒 | 10-15秒 ✅ |
| 上下文窗口使用 | < 80 工具 | ~20 工具 ✅ |

### 常见任务

#### 添加新功能
```bash
/plan 实现 [功能名]
# 编辑 index.html
git commit -m "feat: [功能描述]"
git push
```

#### 修复 Bug
```bash
# 描述问题
# 根据建议修复
git commit -m "fix: [问题描述]"
git push
```

#### 优化性能
```bash
# 使用 planner agent 分析
使用 planner agent 分析性能瓶颈

# 实施优化
git commit -m "perf: [优化描述]"
git push
```

#### 更新 Edge Function
```bash
# 1. 编辑函数代码
vim my-supabase-project/supabase/functions/[function-name]/index.ts

# 2. 手动部署到 Supabase Dashboard
# https://supabase.com/dashboard/project/yrbmpkqybdtocbhbpvwg/functions

# 3. 提交代码
git commit -m "feat: 更新 Edge Function"
git push
```

### 注意事项

#### ✅ 应该做
- 保持单文件架构
- 使用 DeepSeek LLM（便宜）
- 利用免费服务（GitHub Pages, Supabase 免费层）
- 代码简洁优先
- 详细的错误日志
- 友好的用户提示

#### ❌ 不应该做
- 不要创建多个 HTML 文件
- 不要使用昂贵的 LLM（GPT-4）
- 不要过度工程化
- 不要忽略性能优化
- 不要暴露 API 密钥给前端
- 不要让月成本超过 ¥10

### 故障排查

#### Edge Function 失败
1. 检查 Supabase Dashboard → Functions → Logs
2. 确认环境变量已配置
3. 检查 DeepSeek API 额度

#### 网站访问慢
1. 检查 GitHub Pages 状态
2. 清除 LocalStorage 缓存
3. 检查网络连接

#### 数据库错误
1. 检查表结构是否完整
2. 验证 RLS 策略
3. 查看 Supabase Dashboard → Database → Logs

---

**创建日期：** 2026-03-04
**最后更新：** 2026-03-04
**维护者：** ClawMatch Team
**版本：** v2.0 (小龙虾增强版)
