# 成本控制规则

## 核心原则

ClawMatch 项目月成本必须控制在 ¥10 以内。

## 成本预算

### 月度预算分配

| 服务 | 月成本 | 说明 |
|------|--------|------|
| GitHub Pages | ¥0 | 免费静态托管 |
| Supabase | ¥0 | 免费层足够 |
| DeepSeek API | ¥3-5 | 约 1000-2000 次分析 |
| 域名 (clawmatch.xyz) | ¥5 | 年付 ¥60 |
| **总计** | **¥8-10** | 符合预算 ✅ |

### 免费服务额度

**GitHub Pages:**
- 100 GB/月 带宽
- 无限制静态文件
- 自动 SSL 证书
- 当前使用：~5 GB/月 ✅

**Supabase 免费层:**
- 500 MB 数据库存储
- 50,000 月活用户
- 2 GB Edge Functions 调用
- 当前使用：~50 MB 数据库，~100 MB Edge Functions ✅

**DeepSeek LLM:**
- 输入：¥1/百万 tokens
- 输出：¥2/百万 tokens
- 每次分析约：500 tokens 输入 + 800 tokens 输出 = ¥0.003
- 1000 次分析 ≈ ¥3 ✅

## 成本控制策略

### 1. 优先使用免费服务

✅ **使用：**
- GitHub Pages（而不是 Vercel Pro, Netlify Pro）
- Supabase 免费层（而不是 Firebase Blaze, AWS RDS）
- DeepSeek LLM（而不是 GPT-4, Claude）

❌ **避免：**
- 付费 CDN（Cloudflare Pro）
- 付费数据库（MongoDB Atlas, PlanetScale）
- 昂贵的 LLM（GPT-4：¥0.015/1K tokens 输入）

### 2. 缓存策略

**LocalStorage 缓存:**
```javascript
const CACHE_TTL = 5 * 60 * 1000; // 5 分钟

function getCachedData(key) {
    const cached = localStorage.getItem(key);
    if (!cached) return null;

    const { data, timestamp } = JSON.parse(cached);
    if (Date.now() - timestamp > CACHE_TTL) {
        localStorage.removeItem(key);
        return null;
    }

    return data;
}
```

**缓存收益：**
- 减少 50% 的数据库查询
- 减少 30% 的 LLM API 调用
- 节省 ¥1-2/月

### 3. API 调用优化

**批量处理：**
```javascript
// ❌ 错误：逐个调用
for (const profile of profiles) {
    await analyzeProfile(profile); // 100 次 API 调用
}

// ✅ 正确：批量调用
const batch = profiles.slice(0, 20);
await analyzeProfiles(batch); // 1 次 API 调用
```

**懒加载：**
- Observatory 分页加载（每页 20 条）
- 滚动到底部才加载下一页
- 避免一次性加载全部数据

### 4. 数据库查询优化

**只查询必要字段：**
```javascript
// ❌ 错误：查询所有字段
const { data } = await supabase
    .from('observatory_profiles')
    .select('*'); // 浪费带宽

// ✅ 正确：只查询需要的字段
const { data } = await supabase
    .from('observatory_profiles')
    .select('twitter_handle, agent_score, human_score, lobster_comment');
```

**分页查询：**
```javascript
const { data } = await supabase
    .from('observatory_profiles')
    .select('*')
    .range(page * 20, (page + 1) * 20 - 1) // 每次 20 条
    .order('created_at', { ascending: false });
```

### 5. LLM API 调用限制

**防抖动：**
```javascript
let debounceTimer;
function analyzeWithDebounce(profile) {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
        analyzeProfile(profile);
    }, 1000); // 1 秒内多次调用合并为一次
}
```

**请求限流：**
```javascript
const REQUEST_LIMIT = 10; // 每分钟最多 10 次
let requestCount = 0;
let resetTime = Date.now() + 60000;

async function rateLimitedAnalyze(profile) {
    if (Date.now() > resetTime) {
        requestCount = 0;
        resetTime = Date.now() + 60000;
    }

    if (requestCount >= REQUEST_LIMIT) {
        throw new Error('请求过于频繁，请稍后再试');
    }

    requestCount++;
    return await analyzeProfile(profile);
}
```

### 6. 监控和告警

**成本监控：**
- Supabase Dashboard → Settings → Usage
- DeepSeek Dashboard → API Usage
- GitHub Pages → Settings → Pages → Usage

**告警阈值：**
- Supabase 数据库 > 400 MB（80% 免费额度）
- DeepSeek API > ¥8/月（80% 预算）
- GitHub Pages 带宽 > 80 GB/月（80% 免费额度）

## 成本优化检查清单

在添加新功能前，确认：

- [ ] 是否有免费替代方案？
- [ ] 是否可以缓存数据？
- [ ] 是否可以批量处理？
- [ ] 是否只查询必要数据？
- [ ] 是否会大幅增加 API 调用？
- [ ] 月成本是否仍在 ¥10 以内？

## 违规示例

❌ **错误：使用昂贵的 LLM**
```javascript
const response = await openai.chat.completions.create({
    model: 'gpt-4-turbo', // ¥0.01/1K tokens 输入
    // 成本是 DeepSeek 的 10 倍！
});
```

✅ **正确：使用便宜的 LLM**
```javascript
const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
    // DeepSeek: ¥0.001/1K tokens 输入
});
```

❌ **错误：无限制查询**
```javascript
const { data } = await supabase
    .from('observatory_profiles')
    .select('*'); // 可能返回 10,000+ 条记录
```

✅ **正确：分页查询**
```javascript
const { data } = await supabase
    .from('observatory_profiles')
    .select('*')
    .range(0, 19) // 只查询 20 条
    .order('created_at', { ascending: false });
```

## 应急预案

### 成本超支时

**如果月成本 > ¥10：**

1. **立即：** 暂停 DeepSeek API 调用
2. **短期：** 增加缓存时间（5 分钟 → 30 分钟）
3. **中期：** 限制用户提交频率（每人每天最多 3 次）
4. **长期：** 考虑引入付费会员（¥5/月无限制）

**如果 Supabase 接近免费额度：**

1. **数据库：** 清理 30 天前的数据
2. **Edge Functions：** 减少日志输出
3. **考虑：** 迁移到 Supabase Pro（¥25/月）

---

**版本：** 1.0
**创建日期：** 2026-03-04
