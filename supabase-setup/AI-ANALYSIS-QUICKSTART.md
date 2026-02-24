# 🚀 AI 性格分析 - 快速部署指南

使用你的**中转 API Key** 快速部署 AI 驱动的性格分析功能！

## 📋 准备工作

### 1. 你需要的信息

✅ **中转 API Key**（你已经有了）
✅ **中转 API Endpoint**（例如：`https://api.example.com/v1/messages`）
✅ **Supabase Project Reference**（在 Supabase Dashboard 找到）

### 2. 检查中转 API 兼容性

确认你的中转服务支持：
- ✅ Claude 3.5 Sonnet (`claude-3-5-sonnet-20241022`)
- ✅ Messages API 格式（Anthropic 标准）
- ✅ 返回 JSON 格式

## 🚀 一键部署

### 方式一：使用部署脚本（推荐）

```bash
cd openclaw-workspace/supabase-setup
./deploy-ai-analysis.sh
```

按提示输入：
1. 中转 API Key
2. 中转 API Endpoint
3. Supabase Project Reference

### 方式二：手动部署

#### Step 1: 设置环境变量

```bash
# 替换成你的实际值
supabase secrets set PROXY_API_KEY="your-proxy-key-here" --project-ref your-project-ref
supabase secrets set PROXY_API_ENDPOINT="https://your-proxy.com/v1/messages" --project-ref your-project-ref
```

#### Step 2: 创建数据库表

在 Supabase Dashboard -> SQL Editor 中执行：
```sql
-- 复制 migrations/create_personality_cache.sql 中的内容
```

#### Step 3: 部署函数

```bash
cd openclaw-workspace/supabase-setup
supabase functions deploy ai-personality-analysis --project-ref your-project-ref
```

## 🧪 测试部署

```bash
# 替换成你的 project-ref
curl -X POST https://your-project-ref.supabase.co/functions/v1/ai-personality-analysis \
  -H "Content-Type: application/json" \
  -d '{"username": "elonmusk"}'
```

**期望返回**：
```json
{
  "success": true,
  "username": "elonmusk",
  "avatarUrl": "https://unavatar.io/twitter/elonmusk",
  "analysis": {
    "bigFive": {
      "extraversion": 85,
      "openness": 90,
      ...
    },
    "dominanceScore": 75,
    "smType": "S",
    "tags": ["Creative", "Tech Savvy", "Confident"],
    "insights": {...}
  }
}
```

## 🎨 更新前端

### 1. 找到 API 端点

```javascript
const AI_API_URL = 'https://your-project-ref.supabase.co/functions/v1/ai-personality-analysis'
```

### 2. 修改 `runPersonalityTest()` 函数

在 `index.html` 中找到第 ~3300 行，替换为：

```javascript
async function runPersonalityTest() {
    const input = document.getElementById('test-username-input');
    const status = document.getElementById('test-status');
    const results = document.getElementById('test-results');

    let username = input.value.trim();
    if (!username) {
        status.innerHTML = '<span style="color: var(--pink);">❌ 请输入 Twitter 用户名</span>';
        return;
    }

    username = username.replace('@', '').replace('https://twitter.com/', '').replace('https://x.com/', '');
    status.innerHTML = '<span style="color: var(--claw-blue);">🔍 正在获取用户信息...</span>';
    results.style.display = 'none';

    try {
        // 🆕 调用 AI 分析 API
        status.innerHTML = '<span style="color: var(--purple);">🤖 AI 深度分析中（这可能需要几秒钟）...</span>';

        const response = await fetch('YOUR_API_ENDPOINT_HERE', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username })
        });

        if (!response.ok) {
            throw new Error('AI分析失败，请稍后重试');
        }

        const data = await response.json();

        if (!data.success) {
            throw new Error(data.error || 'AI分析失败');
        }

        // 使用 AI 返回的结果
        const userData = {
            username: data.username,
            name: data.username.charAt(0).toUpperCase() + data.username.slice(1),
            profileImageUrl: data.avatarUrl
        };

        // 构造分析结果
        const aiAnalysis = data.analysis;
        const usernameAnalysis = { style: 'ai_analyzed' };
        const avatarAnalysis = { type: 'real_photo' };

        const analysisResults = {
            scores: {
                agentScore: Math.round((aiAnalysis.bigFive.openness + aiAnalysis.bigFive.extraversion) / 2),
                humanScore: Math.round((aiAnalysis.bigFive.extraversion + aiAnalysis.bigFive.agreeableness) / 2),
                breakdown: { bigFive: aiAnalysis.bigFive }
            },
            tags: aiAnalysis.tags || generateTags({ breakdown: { bigFive: aiAnalysis.bigFive } }),
            lobsterTake: aiAnalysis.insights?.intimacyStyle || generateLobsterTake(username, userData.name, usernameAnalysis, avatarAnalysis, { breakdown: { bigFive: aiAnalysis.bigFive } }),
            intimacyAnalysis: analyzeIntimacy({ breakdown: { bigFive: aiAnalysis.bigFive } }, usernameAnalysis, avatarAnalysis),
            matePreferenceAnalysis: analyzeMatePreference({ breakdown: { bigFive: aiAnalysis.bigFive } }, usernameAnalysis, avatarAnalysis),
            interestsAnalysis: analyzeInterests({ breakdown: { bigFive: aiAnalysis.bigFive } }, usernameAnalysis, avatarAnalysis)
        };

        displayResults(userData, analysisResults);

        status.innerHTML = data.cached
            ? '<span style="color: #4ade80;">✅ AI 分析完成！（使用缓存）</span>'
            : '<span style="color: #4ade80;">✅ AI 分析完成！</span>';

        results.style.display = 'block';

        setTimeout(() => {
            results.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 100);

    } catch (error) {
        console.error('Analysis error:', error);
        status.innerHTML = '<span style="color: var(--pink);">❌ 分析失败: ' + error.message + '</span>';
    }
}
```

### 3. 替换 API 端点

把 `YOUR_API_ENDPOINT_HERE` 替换成你的实际端点。

## 💰 成本预估

使用中转 API 的成本取决于你的中转服务定价。

**典型消耗**：
- 每次分析：~1200 tokens（input + output）
- 缓存命中率：80%（24小时内重复查询使用缓存）

**估算**（假设中转价格为官方价格）：
- 无缓存：每次 ~¥0.1
- 有缓存：每次 ~¥0.02
- 每月 3000 次：约 ¥60

## ⚡ 优化建议

### 1. 启用缓存（已实现）
- 同一用户名 24 小时内重复查询使用缓存
- 可将缓存时间调整为 7 天（修改 SQL 中的 INTERVAL）

### 2. 速率限制（已实现）
- 每 IP 每分钟限制 5 次请求
- 防止恶意刷量

### 3. 失败降级
添加降级逻辑，AI 失败时使用本地规则：

```javascript
catch (error) {
    console.warn('AI analysis failed, using fallback');
    // 使用原来的本地分析逻辑
    const analysisResults = analyzePersonality(userData);
    displayResults(userData, analysisResults);
}
```

## 🔧 故障排查

### 问题 1: API 调用失败

**检查清单**：
- ✅ 中转 API Key 是否正确
- ✅ 中转 API Endpoint 是否正确
- ✅ 中转服务是否支持 Claude 3.5 Sonnet
- ✅ 网络是否能访问中转服务

**测试方法**：
```bash
curl -X POST YOUR_PROXY_ENDPOINT \
  -H "Authorization: Bearer YOUR_PROXY_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "claude-3-5-sonnet-20241022",
    "max_tokens": 100,
    "messages": [{"role": "user", "content": "Hello"}]
  }'
```

### 问题 2: 数据库错误

**检查**：
- ✅ 数据库表是否创建成功
- ✅ RLS 策略是否正确设置

**修复**：重新执行 `migrations/create_personality_cache.sql`

### 问题 3: CORS 错误

**修复**：确保 Edge Function 中的 `corsHeaders` 包含你的域名。

## 📊 监控

### 查看调用日志

```bash
supabase functions logs ai-personality-analysis --project-ref your-project-ref
```

### 查看缓存命中率

在 Supabase Dashboard -> SQL Editor 执行：

```sql
SELECT
  COUNT(*) as total_cached,
  COUNT(*) FILTER (WHERE created_at > NOW() - INTERVAL '24 hours') as last_24h
FROM personality_analysis_cache;
```

## 🎉 完成！

现在访问 `https://clawmatch.xyz/#personality-test` 测试你的 AI 分析功能！

## 📞 需要帮助？

- 查看日志：`supabase functions logs ai-personality-analysis`
- 检查数据库：Supabase Dashboard -> Table Editor
- 测试 API：使用上面的 curl 命令

---

**提示**：部署完成后记得：
1. ✅ 测试 API 是否正常
2. ✅ 检查缓存是否工作
3. ✅ 更新前端代码
4. ✅ 清除浏览器缓存测试
