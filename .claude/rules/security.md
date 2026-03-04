# 安全规则

## 核心原则

ClawMatch 项目必须保护用户数据和系统安全。

## 安全清单

### 1. 输入验证

**前端验证（用户体验）：**
```javascript
function validateTwitterHandle(handle) {
    // 移除 @ 符号
    handle = handle.replace(/^@/, '');

    // 长度验证：1-15 字符
    if (handle.length < 1 || handle.length > 15) {
        return '用户名长度必须在 1-15 字符之间';
    }

    // 格式验证：只允许字母、数字、下划线
    if (!/^[a-zA-Z0-9_]+$/.test(handle)) {
        return '用户名只能包含字母、数字和下划线';
    }

    return null; // 验证通过
}

// 使用示例
const error = validateTwitterHandle(input.value);
if (error) {
    showError(error);
    return;
}
```

**后端验证（安全关键）：**
```typescript
// Edge Function 中必须再次验证
function validateInput(handle: string): boolean {
    if (!handle || typeof handle !== 'string') {
        return false;
    }

    handle = handle.trim().replace(/^@/, '');

    // 长度和格式验证
    return handle.length >= 1 &&
           handle.length <= 15 &&
           /^[a-zA-Z0-9_]+$/.test(handle);
}

// 在 Edge Function 开始就验证
if (!validateInput(twitterHandle)) {
    return new Response(
        JSON.stringify({ error: '无效的用户名' }),
        { status: 400 }
    );
}
```

### 2. SQL 注入防护

**使用 Supabase 参数化查询：**
```javascript
// ✅ 正确：参数化查询（自动转义）
const { data } = await supabase
    .from('observatory_profiles')
    .select('*')
    .eq('twitter_handle', userInput); // 自动转义

// ❌ 错误：字符串拼接（SQL 注入风险）
const query = `SELECT * FROM observatory_profiles WHERE twitter_handle = '${userInput}'`;
// 如果 userInput = "' OR '1'='1"，会返回所有数据！
```

**Edge Function 中使用 Supabase Admin Client：**
```typescript
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
);

// 自动参数化查询
const { data, error } = await supabase
    .from('observatory_profiles')
    .insert({
        twitter_handle: handle, // 自动转义
        agent_score: score,
        lobster_comment: comment
    });
```

### 3. XSS 防护

**转义用户输入：**
```javascript
function escapeHtml(text) {
    const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    };
    return text.replace(/[&<>"']/g, m => map[m]);
}

// 使用示例
const safeComment = escapeHtml(userComment);
element.innerHTML = safeComment;
```

**使用 textContent 而不是 innerHTML：**
```javascript
// ✅ 正确：textContent（自动转义）
element.textContent = userInput;

// ❌ 错误：innerHTML（XSS 风险）
element.innerHTML = userInput;
// 如果 userInput = "<script>alert('XSS')</script>"，会执行脚本！
```

**DOMPurify 清理（如果需要富文本）：**
```html
<script src="https://cdn.jsdelivr.net/npm/dompurify@3.0.6/dist/purify.min.js"></script>
<script>
    const clean = DOMPurify.sanitize(userInput);
    element.innerHTML = clean;
</script>
```

### 4. API 密钥保护

**前端：不暴露密钥**
```javascript
// ❌ 错误：API 密钥暴露在前端
const DEEPSEEK_API_KEY = 'sk-1234567890'; // 用户可以在浏览器看到！

// ✅ 正确：通过 Edge Function 调用
async function analyzeProfile(handle) {
    const response = await fetch(
        'https://yrbmpkqybdtocbhbpvwg.supabase.co/functions/v1/score-twitter-profile',
        {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${SUPABASE_ANON_KEY}` // 公开密钥，权限受限
            },
            body: JSON.stringify({ twitter_handle: handle })
        }
    );
}
```

**后端：环境变量**
```typescript
// Edge Function 中使用环境变量
const DEEPSEEK_API_KEY = Deno.env.get('DEEPSEEK_API_KEY');
if (!DEEPSEEK_API_KEY) {
    console.error('❌ DEEPSEEK_API_KEY 未配置');
    return new Response('服务配置错误', { status: 500 });
}
```

**Supabase Dashboard 配置：**
1. 进入 Supabase Dashboard
2. Settings → Edge Functions → Secrets
3. 添加 `DEEPSEEK_API_KEY` = `sk-...`
4. 重新部署 Edge Function

### 5. CORS 配置

**Edge Function CORS 头：**
```typescript
const corsHeaders = {
    'Access-Control-Allow-Origin': 'https://clawmatch.xyz', // 只允许自己的域名
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization'
};

// 处理 OPTIONS 预检请求
if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
}

// 所有响应都包含 CORS 头
return new Response(
    JSON.stringify(result),
    {
        headers: {
            ...corsHeaders,
            'Content-Type': 'application/json'
        }
    }
);
```

### 6. HTTPS 强制

**GitHub Pages 自动启用：**
- 所有流量自动重定向到 HTTPS
- Let's Encrypt 免费 SSL 证书
- 自动续期

**前端强制 HTTPS：**
```javascript
// 如果用户访问 HTTP，重定向到 HTTPS
if (location.protocol !== 'https:' && location.hostname !== 'localhost') {
    location.protocol = 'https:';
}
```

### 7. Row Level Security (RLS)

**Supabase RLS 策略：**
```sql
-- 允许所有人读取 Observatory 数据
CREATE POLICY "公开读取" ON observatory_profiles
    FOR SELECT
    USING (true);

-- 只允许通过 Edge Function 插入数据
CREATE POLICY "Edge Function 插入" ON observatory_profiles
    FOR INSERT
    WITH CHECK (auth.role() = 'service_role');

-- 禁止直接更新和删除
-- （没有 UPDATE/DELETE 策略，默认禁止）
```

**前端只读访问：**
```javascript
// 前端使用 Anon Key（只读权限）
const supabase = createClient(
    'https://yrbmpkqybdtocbhbpvwg.supabase.co',
    'eyJhbGci...Anon_Key' // 公开密钥，受 RLS 限制
);

// 可以读取
const { data } = await supabase
    .from('observatory_profiles')
    .select('*');

// 无法写入（RLS 阻止）
const { error } = await supabase
    .from('observatory_profiles')
    .insert({ twitter_handle: 'test' }); // 被拒绝
```

### 8. 速率限制

**前端防抖：**
```javascript
let lastSubmitTime = 0;
const RATE_LIMIT = 3000; // 3 秒内只能提交一次

button.addEventListener('click', async () => {
    const now = Date.now();
    if (now - lastSubmitTime < RATE_LIMIT) {
        showError('请勿频繁提交');
        return;
    }

    lastSubmitTime = now;
    await submitProfile();
});
```

**后端速率限制（Edge Function）：**
```typescript
// 简单的内存速率限制
const rateLimitMap = new Map<string, number>();
const RATE_LIMIT_WINDOW = 60000; // 1 分钟
const MAX_REQUESTS = 10; // 每分钟最多 10 次

function checkRateLimit(identifier: string): boolean {
    const now = Date.now();
    const lastRequest = rateLimitMap.get(identifier) || 0;

    if (now - lastRequest < RATE_LIMIT_WINDOW) {
        return false; // 超出速率限制
    }

    rateLimitMap.set(identifier, now);
    return true; // 允许请求
}

// 使用 IP 地址作为标识符
const clientIp = req.headers.get('x-forwarded-for') || 'unknown';
if (!checkRateLimit(clientIp)) {
    return new Response(
        JSON.stringify({ error: '请求过于频繁' }),
        { status: 429 }
    );
}
```

### 9. 错误处理

**不暴露敏感信息：**
```javascript
// ❌ 错误：暴露技术细节
catch (error) {
    alert(error.message); // 可能暴露数据库结构、API 密钥等
}

// ✅ 正确：友好的错误提示
catch (error) {
    console.error('详细错误:', error); // 只在控制台显示
    showError('操作失败，请稍后重试'); // 用户看到的提示
}
```

**Edge Function 错误日志：**
```typescript
try {
    const result = await analyzeProfile(handle);
    console.log('✅ 分析成功:', handle);
    return new Response(JSON.stringify(result));
} catch (error) {
    console.error('❌ 分析失败:', error);

    // 不要把详细错误返回给前端
    return new Response(
        JSON.stringify({ error: '分析失败，请稍后重试' }),
        { status: 500 }
    );
}
```

### 10. 依赖安全

**使用官方 CDN：**
```html
<!-- ✅ 使用官方 CDN + SRI 校验 -->
<script
    src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"
    integrity="sha384-..."
    crossorigin="anonymous">
</script>

<!-- ❌ 使用不可信的第三方 CDN -->
<script src="https://random-cdn.com/supabase.js"></script>
```

**定期更新依赖：**
- Supabase JS: 当前 v2.x，定期检查更新
- DeepSeek API: 关注官方公告
- 无其他依赖（单文件架构优势）

## 安全检查清单

在提交代码前，确认：

- [ ] 所有用户输入都经过前端和后端验证
- [ ] 使用 Supabase 参数化查询（防 SQL 注入）
- [ ] 使用 textContent 或转义 HTML（防 XSS）
- [ ] API 密钥在环境变量中，不暴露给前端
- [ ] CORS 正确配置，只允许自己的域名
- [ ] HTTPS 已启用
- [ ] RLS 策略正确配置
- [ ] 速率限制已实施
- [ ] 错误处理不暴露敏感信息
- [ ] 使用官方 CDN 和 SRI 校验

## 安全事件响应

### 如果发现安全漏洞

1. **立即：** 禁用相关功能
2. **修复：** 更新代码并测试
3. **部署：** 立即推送修复
4. **通知：** 如果用户数据受影响，通知用户
5. **复盘：** 分析原因，更新安全检查清单

### 报告安全问题

如果发现安全问题，请联系：
- Email: security@clawmatch.xyz
- 不要公开披露，等待修复后再公开

---

**版本：** 1.0
**创建日期：** 2026-03-04
