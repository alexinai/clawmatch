# Observatory 安全加固方案

## 🔒 安全功能概览

### 1. IP 速率限制（Rate Limiting）
防止单个 IP 地址快速提交垃圾数据。

**限制规则**：
- 每个 IP 每分钟最多 **3 次提交**
- 超过限制后返回 `429 Too Many Requests`
- 自动显示等待时间（Retry-After）

**实现方式**：
- 使用内存缓存（Map）存储 IP 和请求计数
- 时间窗口：60 秒
- 自动清理过期记录

**返回示例**：
```json
{
  "success": false,
  "message": "提交太频繁，请 45 秒后再试",
  "error": "RATE_LIMIT_EXCEEDED",
  "retryAfter": 45
}
```

---

### 2. 输入验证和清理（Input Validation & Sanitization）

#### 2.1 Twitter 用户名格式验证

**验证规则**：
- ✅ 长度：1-15 字符
- ✅ 只允许：字母（a-z, A-Z）、数字（0-9）、下划线（_）
- ✅ 自动移除 `@` 符号
- ✅ 自动去除前后空格

**示例**：
```javascript
// 有效输入
"elonmusk" ✅
"@elonmusk" ✅ (自动转为 "elonmusk")
"sama" ✅
"karpathy_" ✅

// 无效输入
"" ❌ (空字符串)
"this_is_too_long_username" ❌ (超过15字符)
"user@domain.com" ❌ (包含非法字符)
"<script>alert('xss')</script>" ❌ (XSS攻击)
```

#### 2.2 防注入攻击

**防御类型**：

| 攻击类型 | 检测模式 | 示例 |
|---------|---------|------|
| **XSS（跨站脚本）** | `<script>`, `onerror`, `onload` | `<script>alert(1)</script>` |
| **SQL 注入** | `'`, `--`, `#`, `%27` | `admin'--` |
| **路径遍历** | `..` | `../../etc/passwd` |
| **HTML 注入** | `<`, `>`, `"`, `'` | `<img src=x onerror=alert(1)>` |
| **控制字符** | `\x00-\x1F`, `\x7F` | NULL 字节攻击 |

**代码实现**：
```typescript
const dangerousPatterns = [
  /[<>'"]/,           // HTML/XSS
  /(\%27)|(\')|(\-\-)|(\%23)|(#)/i,  // SQL注入
  /(script|javascript|onerror|onload)/i,  // XSS
  /\.\./,             // 路径遍历
  /[\x00-\x1F\x7F]/   // 控制字符
]
```

---

## 🛡️ 安全层级

### 防御层级 1: 客户端（前端）
- 基本格式验证
- 用户友好的错误提示

### 防御层级 2: Edge Function（服务端）
- ✅ **IP 速率限制**
- ✅ **严格的输入验证**
- ✅ **注入攻击防御**
- ✅ **安全日志记录**

### 防御层级 3: 数据库
- ✅ **RLS 行级安全**
- ✅ **UNIQUE 约束**（防重复）
- ✅ **参数化查询**（Supabase 自动处理）

---

## 📊 安全日志

Edge Function 会记录以下安全事件：

```typescript
// 记录 IP 地址
console.log(`Request from IP: ${clientIP}`)

// 记录速率限制违规
console.warn(`Rate limit exceeded for IP: ${clientIP}`)

// 记录无效输入
console.warn(`Invalid username from IP ${clientIP}: ${twitterUsername}`)

// 记录成功提交
console.log(`Profile created for ${cleanUsername}, ID: ${profile.id}`)
```

**查看日志**：
Supabase Dashboard → Edge Functions → score-twitter-profile → Logs

---

## 🧪 安全测试

### 测试 1: 速率限制

**步骤**：
1. 访问 https://clawmatch.xyz/#observatory
2. 快速连续提交 4 次（任意用户名）
3. **预期结果**：第 4 次提交显示"提交太频繁"错误

**测试脚本**（浏览器控制台）：
```javascript
// 快速提交测试
for (let i = 0; i < 5; i++) {
  setTimeout(() => {
    console.log(`提交 ${i+1}`)
    // 执行提交操作
  }, i * 1000)
}
```

---

### 测试 2: 输入验证

**测试用例**：

| 输入 | 预期结果 |
|------|---------|
| `elonmusk` | ✅ 成功 |
| `@sama` | ✅ 成功（自动去除@） |
| `<script>alert(1)</script>` | ❌ 错误："Invalid characters detected" |
| `admin'--` | ❌ 错误："Invalid characters detected" |
| `this_is_a_very_long_username_that_exceeds_limit` | ❌ 错误："Invalid Twitter username format" |
| `user@domain.com` | ❌ 错误："Invalid Twitter username format" |
| `../../../etc/passwd` | ❌ 错误："Invalid characters detected" |

---

### 测试 3: XSS 防御

**恶意输入测试**：
```javascript
// 尝试 XSS 攻击
const maliciousInputs = [
  '<script>alert("XSS")</script>',
  '<img src=x onerror=alert(1)>',
  'javascript:alert(1)',
  '<iframe src="evil.com"></iframe>',
  'onerror=alert(1)',
]

maliciousInputs.forEach(input => {
  // 应该全部被拦截
  console.log(`Testing: ${input}`)
})
```

**预期**：所有输入都返回 "Invalid characters detected"

---

## 🔧 部署步骤

### 步骤 1: 更新 Edge Function

1. **打开 Supabase Dashboard**
   ```
   https://supabase.com/dashboard/project/yrbmpkqybdtocbhbpvwg/functions
   ```

2. **选择 `score-twitter-profile` 函数**

3. **完全替换代码**
   - 删除编辑器中的所有旧代码
   - 复制 `edge-function-score-profile-v3-secure.ts` 的完整内容
   - 粘贴到编辑器

4. **点击 Deploy 部署**

---

### 步骤 2: 验证部署

**立即测试**：

1. **正常提交测试**
   - 输入：`karpathy`
   - 预期：✅ 提交成功

2. **速率限制测试**
   - 连续提交 4 次
   - 预期：第 4 次显示"提交太频繁"

3. **无效输入测试**
   - 输入：`<script>test</script>`
   - 预期：❌ "Invalid characters detected"

4. **查看日志**
   - Supabase Dashboard → Edge Functions → Logs
   - 检查是否记录了 IP 和安全事件

---

## ⚡ 性能影响

### 速率限制性能
- **内存开销**：每个 IP 约 50 字节
- **清理策略**：每次请求自动清理过期记录
- **并发处理**：无锁设计，支持高并发

### 输入验证性能
- **验证耗时**：< 1ms
- **正则匹配**：6 个模式，顺序检查
- **CPU 开销**：极小

---

## 🔍 监控和告警

### 建议监控指标

1. **速率限制触发次数**
   - 正常：< 5次/小时
   - 异常：> 50次/小时（可能遭受攻击）

2. **无效输入次数**
   - 正常：< 10次/天
   - 异常：> 100次/天（可能遭受扫描）

3. **IP 地址分布**
   - 检查是否有单一 IP 占比过高

### 日志查询

在 Supabase Logs 中搜索：
- `Rate limit exceeded` - 速率限制事件
- `Invalid username` - 无效输入事件
- `Request from IP` - 所有请求

---

## 🚀 后续安全增强（可选）

### 短期（1-2天）
- [ ] 添加前端验证提示（实时反馈）
- [ ] 添加 Honeypot 字段（隐藏字段捕获机器人）

### 中期（1周）
- [ ] 集成 hCaptcha 或 reCAPTCHA
- [ ] IP 黑名单功能
- [ ] 数据库级速率限制表

### 长期（1个月）
- [ ] 机器学习异常检测
- [ ] 完整的审计日志系统
- [ ] 自动封禁恶意 IP

---

## 📋 安全检查清单

部署前确认：

- [ ] Edge Function 代码已更新
- [ ] 测试正常提交功能
- [ ] 测试速率限制（连续提交 4 次）
- [ ] 测试 XSS 输入（`<script>test</script>`）
- [ ] 测试 SQL 注入输入（`admin'--`）
- [ ] 查看 Logs 确认记录了 IP 和事件
- [ ] 确认错误消息对用户友好

---

**版本**: v3.0 - 安全加固版
**创建时间**: 2026-02-24
**状态**: 准备部署
