# 性能优化规则

## 核心原则

ClawMatch 项目必须保持快速响应和流畅体验。

## 性能目标

| 指标 | 目标 | 当前 | 状态 |
|------|------|------|------|
| 首次加载 | < 2秒 | ~1秒 | ✅ |
| Observatory 加载 | < 5秒 | 2-3秒 | ✅ |
| AI 分析响应 | < 30秒 | 10-15秒 | ✅ |
| 滚动流畅度 | 60 FPS | 60 FPS | ✅ |
| 交互响应 | < 100ms | < 50ms | ✅ |

## 优化策略

### 1. 首次加载优化

**关键资源优先：**
```html
<head>
    <!-- 预加载关键资源 -->
    <link rel="preconnect" href="https://yrbmpkqybdtocbhbpvwg.supabase.co">
    <link rel="dns-prefetch" href="https://api.deepseek.com">

    <!-- 关键 CSS 内联 -->
    <style>
        /* 首屏样式 */
        body { margin: 0; font-family: Arial; }
        .loading { /* ... */ }
    </style>
</head>
```

**延迟加载非关键内容：**
```javascript
// 首屏渲染后再加载 Observatory
window.addEventListener('load', () => {
    setTimeout(() => {
        loadObservatory();
    }, 100);
});
```

**代码压缩：**
- 移除未使用的 CSS（~50 KB → ~30 KB）
- 压缩 JavaScript（保留必要注释）
- 目标：index.html < 300 KB

### 2. 数据库查询优化

**索引策略：**
```sql
-- 为常用查询添加索引
CREATE INDEX idx_created_at ON observatory_profiles(created_at DESC);
CREATE INDEX idx_twitter_handle ON observatory_profiles(twitter_handle);
CREATE INDEX idx_agent_score ON observatory_profiles(agent_score DESC);
```

**避免 N+1 查询：**
```javascript
// ❌ 错误：N+1 查询
for (const profile of profiles) {
    const score = await getScore(profile.id); // N 次查询
}

// ✅ 正确：单次查询
const { data } = await supabase
    .from('observatory_profiles')
    .select('id, twitter_handle, agent_score, human_score')
    .in('id', profileIds); // 1 次查询
```

**分页查询：**
```javascript
const PAGE_SIZE = 20;

async function loadProfiles(page = 0) {
    const { data, error } = await supabase
        .from('observatory_profiles')
        .select('twitter_handle, agent_score, human_score, lobster_comment')
        .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1)
        .order('created_at', { ascending: false });

    return data;
}
```

### 3. 缓存策略

**LocalStorage 缓存：**
```javascript
const CACHE_KEY = 'observatory_profiles';
const CACHE_TTL = 5 * 60 * 1000; // 5 分钟

function getCachedProfiles() {
    const cached = localStorage.getItem(CACHE_KEY);
    if (!cached) return null;

    const { data, timestamp } = JSON.parse(cached);
    if (Date.now() - timestamp > CACHE_TTL) {
        localStorage.removeItem(CACHE_KEY);
        return null;
    }

    return data;
}

function setCacheProfiles(data) {
    localStorage.setItem(CACHE_KEY, JSON.stringify({
        data,
        timestamp: Date.now()
    }));
}
```

**缓存收益：**
- 减少 50% 数据库查询
- Observatory 加载从 3秒 → 0.5秒
- 节省 Supabase 带宽

### 4. 无限滚动优化

**虚拟滚动（未来考虑）：**
```javascript
// 当前：简单的分页加载
let currentPage = 0;

window.addEventListener('scroll', () => {
    if (window.innerHeight + window.scrollY >= document.body.offsetHeight - 500) {
        currentPage++;
        loadProfiles(currentPage);
    }
});
```

**防抖动：**
```javascript
let scrollTimer;
window.addEventListener('scroll', () => {
    clearTimeout(scrollTimer);
    scrollTimer = setTimeout(() => {
        checkLoadMore();
    }, 200); // 200ms 内多次滚动合并为一次
});
```

### 5. API 调用优化

**请求合并：**
```javascript
// ❌ 错误：多次独立请求
const profile1 = await analyzeProfile('user1');
const profile2 = await analyzeProfile('user2');
const profile3 = await analyzeProfile('user3');

// ✅ 正确：批量请求
const profiles = await analyzeProfiles(['user1', 'user2', 'user3']);
```

**并行请求：**
```javascript
// ❌ 错误：串行请求
const profiles = await getProfiles();
const scores = await getScores();

// ✅ 正确：并行请求
const [profiles, scores] = await Promise.all([
    getProfiles(),
    getScores()
]);
```

**请求取消：**
```javascript
let abortController = new AbortController();

async function analyzeProfile(handle) {
    // 取消之前的请求
    abortController.abort();
    abortController = new AbortController();

    const response = await fetch(API_URL, {
        signal: abortController.signal
    });

    return response.json();
}
```

### 6. 前端渲染优化

**DOM 批量更新：**
```javascript
// ❌ 错误：逐个添加（触发多次重排）
profiles.forEach(profile => {
    const div = document.createElement('div');
    div.textContent = profile.name;
    container.appendChild(div);
});

// ✅ 正确：批量添加（触发一次重排）
const fragment = document.createDocumentFragment();
profiles.forEach(profile => {
    const div = document.createElement('div');
    div.textContent = profile.name;
    fragment.appendChild(div);
});
container.appendChild(fragment);
```

**CSS 动画优化：**
```css
/* 使用 transform 和 opacity（GPU 加速） */
.card {
    transition: transform 0.3s, opacity 0.3s;
}

.card:hover {
    transform: translateY(-4px); /* ✅ GPU 加速 */
    /* 避免: top: -4px; ❌ 触发重排 */
}
```

**避免强制同步布局：**
```javascript
// ❌ 错误：读写交替（触发强制重排）
element.style.width = '100px';
const height = element.offsetHeight; // 强制重排
element.style.height = height + 'px';

// ✅ 正确：批量读取后批量写入
const height = element.offsetHeight; // 读取
element.style.width = '100px'; // 写入
element.style.height = height + 'px'; // 写入
```

### 7. 图片和资源优化

**Favicon 优化：**
- 使用多种尺寸（16x16, 32x32, 64x64）
- PNG 格式压缩（TinyPNG）
- 当前大小：~5 KB ✅

**未来考虑：**
- 用户头像懒加载
- Twitter 头像使用 CDN 缓存
- WebP 格式（Chrome, Edge 支持）

### 8. Loading 状态

**即时反馈：**
```javascript
button.addEventListener('click', async () => {
    // 立即显示 loading
    button.textContent = '分析中...';
    button.disabled = true;

    try {
        await analyzeProfile();
        button.textContent = '分析完成 ✓';
    } catch (error) {
        button.textContent = '分析失败';
    } finally {
        button.disabled = false;
    }
});
```

**骨架屏：**
```css
.skeleton {
    background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
    background-size: 200% 100%;
    animation: loading 1.5s infinite;
}

@keyframes loading {
    0% { background-position: 200% 0; }
    100% { background-position: -200% 0; }
}
```

## 性能监控

### 关键指标

**Core Web Vitals:**
- LCP (Largest Contentful Paint) < 2.5s
- FID (First Input Delay) < 100ms
- CLS (Cumulative Layout Shift) < 0.1

**自定义指标：**
```javascript
// 测量 API 响应时间
const start = performance.now();
await analyzeProfile();
const duration = performance.now() - start;
console.log(`分析耗时: ${duration}ms`);
```

### 性能预算

| 资源 | 预算 | 当前 |
|------|------|------|
| HTML | < 300 KB | ~250 KB ✅ |
| 总请求数 | < 10 | ~5 ✅ |
| 首次渲染 | < 1.5s | ~1s ✅ |
| 可交互时间 | < 2s | ~1.2s ✅ |

## 性能优化检查清单

在添加新功能前，确认：

- [ ] 是否会增加首次加载时间？
- [ ] 是否会增加不必要的 API 调用？
- [ ] 是否可以缓存数据？
- [ ] 是否有 loading 状态？
- [ ] 是否会触发不必要的重排？
- [ ] 是否符合性能预算？

## 违规示例

❌ **错误：无限制加载**
```javascript
const { data } = await supabase
    .from('observatory_profiles')
    .select('*'); // 可能加载 10,000+ 条
```

✅ **正确：分页加载**
```javascript
const { data } = await supabase
    .from('observatory_profiles')
    .select('*')
    .range(0, 19); // 每次 20 条
```

❌ **错误：无 loading 状态**
```javascript
button.onclick = () => analyzeProfile(); // 用户不知道是否在处理
```

✅ **正确：即时反馈**
```javascript
button.onclick = async () => {
    button.textContent = '分析中...';
    await analyzeProfile();
    button.textContent = '完成';
};
```

---

**版本：** 1.0
**创建日期：** 2026-03-04
