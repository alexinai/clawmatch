# AI 驱动的性格分析 - 部署指南

## 🤖 方案概述

使用 **Claude API** 智能分析用户性格，替代写死的规则，获得更准确、更个性化的分析结果。

## 📋 架构图

```
用户输入 @username
    ↓
前端调用 Supabase Edge Function
    ↓
Edge Function 调用 Claude API
    ↓
Claude 分析用户名 + 头像
    ↓
返回结构化 JSON 结果
    ↓
前端渲染个性化分析
```

## 🚀 部署步骤

### 1. 获取 Anthropic API Key

访问：https://console.anthropic.com/
- 注册账号
- 创建 API Key
- 记录你的 key（形如 `sk-ant-...`）

### 2. 配置 Supabase 环境变量

```bash
# 在 Supabase Dashboard 设置 Edge Function 的环境变量
ANTHROPIC_API_KEY=your-api-key-here
```

或使用命令行：

```bash
supabase secrets set ANTHROPIC_API_KEY=your-api-key-here
```

### 3. 部署 Edge Function

```bash
cd openclaw-workspace/supabase-setup

# 部署函数
supabase functions deploy ai-personality-analysis \
  --project-ref your-project-ref

# 测试函数
curl -X POST https://your-project.supabase.co/functions/v1/ai-personality-analysis \
  -H "Content-Type: application/json" \
  -d '{"username": "elonmusk"}'
```

### 4. 更新前端代码

在 `index.html` 中修改 `runPersonalityTest()` 函数：

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
        status.innerHTML = '<span style="color: var(--claw-blue);">🤖 AI 正在深度分析性格特征...</span>';

        const response = await fetch('https://your-project.supabase.co/functions/v1/ai-personality-analysis', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ username })
        });

        if (!response.ok) {
            throw new Error('分析失败');
        }

        const data = await response.json();

        // 使用 AI 返回的结果
        const userData = {
            username: data.username,
            name: data.username.charAt(0).toUpperCase() + data.username.slice(1),
            profileImageUrl: data.avatarUrl
        };

        const analysisResults = {
            scores: {
                agentScore: Math.round((data.analysis.bigFive.openness + data.analysis.bigFive.extraversion) / 2),
                humanScore: Math.round((data.analysis.bigFive.extraversion + data.analysis.bigFive.agreeableness) / 2),
                breakdown: {
                    bigFive: data.analysis.bigFive
                }
            },
            tags: data.analysis.tags,
            lobsterTake: generateLobsterTakeFromAI(data.analysis),
            intimacyAnalysis: generateIntimacyFromAI(data.analysis),
            matePreferenceAnalysis: analyzeMatePreference(
                { breakdown: { bigFive: data.analysis.bigFive } },
                { style: 'ai_analyzed' },
                { type: 'real_photo' }
            ),
            interestsAnalysis: analyzeInterests(
                { breakdown: { bigFive: data.analysis.bigFive } },
                { style: 'ai_analyzed' },
                { type: 'real_photo' }
            )
        };

        displayResults(userData, analysisResults);
        status.innerHTML = '<span style="color: #4ade80;">✅ AI 分析完成！</span>';
        results.style.display = 'block';

        setTimeout(() => {
            results.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 100);

    } catch (error) {
        status.innerHTML = '<span style="color: var(--pink);">❌ 分析失败: ' + error.message + '</span>';
    }
}

// 新增：从 AI 分析生成小龙虾点评
function generateLobsterTakeFromAI(analysis) {
    return analysis.analysis.intimacyStyle || analysis.analysis.personalityOverview;
}

// 新增：从 AI 分析生成性癖分析
function generateIntimacyFromAI(analysis) {
    const dominanceScore = analysis.dominanceScore;
    const smType = analysis.smType;

    // 根据 AI 的分析结果，调用相应的展示逻辑
    // 这里可以复用现有的 analyzeIntimacy 函数
    // 或者让 AI 直接生成 HTML
    return analyzeIntimacy(
        { breakdown: { bigFive: analysis.bigFive } },
        { style: 'ai_analyzed' },
        { type: 'real_photo' }
    );
}
```

## 💰 成本估算

### Claude API 定价（Sonnet 3.5）

- Input: $3 / million tokens
- Output: $15 / million tokens

**每次分析成本**：
- Input: ~500 tokens (~$0.0015)
- Output: ~800 tokens (~$0.012)
- **总成本：约 $0.014 / 次 (约 ¥0.1 / 次)**

**每月成本估算**：
- 100 次分析/天 × 30 天 = 3,000 次/月
- **月成本：约 $42 (约 ¥300)**

### 优化方案：缓存

```javascript
// 在数据库中缓存结果，避免重复调用
CREATE TABLE personality_analysis_cache (
  username TEXT PRIMARY KEY,
  analysis_result JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

// 设置 24 小时过期
CREATE INDEX idx_cache_expiry ON personality_analysis_cache(created_at);
```

缓存命中率 80% 的情况下：
- **月成本降至：约 $8 (约 ¥60)**

## 🎨 增强功能

### 1. 集成真实 Twitter API

在 Edge Function 中添加：

```typescript
// Get real bio from Twitter API
const twitterResponse = await fetch(`https://api.twitter.com/2/users/by/username/${username}`, {
  headers: {
    'Authorization': `Bearer ${TWITTER_BEARER_TOKEN}`
  }
});

const twitterData = await twitterResponse.json();
const bio = twitterData.data?.description || '';
```

### 2. 让 AI 直接生成完整的 HTML

修改 prompt，让 Claude 直接输出分析的 HTML 格式：

```javascript
**输出格式：**
返回 JSON，其中包含 HTML 格式的分析内容：

{
  "bigFive": {...},
  "dominanceScore": 75,
  "smAnalysisHTML": "<div class='sm-badge s-badge'>...</div>...",
  "matePreferenceHTML": "<div class='mate-preference-container'>...</div>",
  "tags": [...],
  "lobsterTake": "小龙虾的幽默点评..."
}
```

这样前端可以直接渲染 AI 生成的内容。

## 🔄 替代方案

### 方案 A：使用开源模型（免费）

使用 Ollama + Llama 3 本地运行：

```bash
# 安装 Ollama
curl -fsSL https://ollama.com/install.sh | sh

# 下载模型
ollama pull llama3:8b

# 创建本地 API
ollama serve
```

优点：完全免费
缺点：需要自己部署服务器，质量略低于 Claude

### 方案 B：混合模式（推荐）

- 用户名分析：本地规则（免费）
- 头像分析：本地规则（免费）
- Bio/推文分析：Claude API（按需付费）
- 最终整合：Claude API

**成本降至：约 $0.005 / 次**

## 📊 效果对比

| 方案 | 准确度 | 成本 | 延迟 |
|------|--------|------|------|
| 当前规则 | ⭐⭐⭐ | 免费 | <100ms |
| AI 全分析 | ⭐⭐⭐⭐⭐ | ~¥0.1/次 | ~2s |
| 混合模式 | ⭐⭐⭐⭐ | ~¥0.04/次 | ~1.5s |

## ✅ 优势

1. **更准确**：AI 能理解细微的信号（如用户名的文化背景、emoji 的使用等）
2. **更个性化**：每个用户的分析都是独特的，不是模板
3. **更智能**：可以学习和改进
4. **更有趣**：AI 生成的内容更自然、更有趣

## 🚧 注意事项

1. **API Key 安全**：绝对不要在前端暴露 API Key
2. **Rate Limiting**：添加速率限制，防止滥用
3. **错误处理**：API 可能失败，需要 fallback 方案
4. **成本控制**：设置月度预算上限
5. **隐私**：不要存储敏感信息

## 🎯 下一步

你想要我现在就部署这个 AI 分析方案吗？

我可以：
1. ✅ 帮你部署 Edge Function
2. ✅ 更新前端代码调用 AI API
3. ✅ 设置缓存机制降低成本
4. ✅ 添加错误处理和降级方案
