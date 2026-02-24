# Twitter 真实头像抓取功能 - 更新指南

## 📋 功能说明

更新后的 Edge Function 能够：
- ✅ 自动抓取 Twitter 用户的真实头像
- ✅ 保存到数据库的 `profile_image_url` 字段
- ✅ 多重备用方案确保成功获取
- ✅ 在页面上显示真实头像而不是卡通头像

## 🔧 更新步骤

### 步骤 1: 更新 Edge Function 代码

1. **打开 Supabase Dashboard**
   ```
   https://supabase.com/dashboard/project/yrbmpkqybdtocbhbpvwg
   ```

2. **进入 Edge Functions**
   - 左侧菜单 → **Edge Functions**
   - 找到 `score-twitter-profile` 函数
   - 点击进入编辑

3. **替换代码**
   - 删除旧代码
   - 复制 `edge-function-score-profile-v2.ts` 的完整内容
   - 粘贴到编辑器
   - 点击 **Deploy** 部署

### 步骤 2: 测试功能

1. **访问 Observatory**
   ```
   https://clawmatch.xyz/#observatory
   ```

2. **提交测试用户**
   - 输入一个真实的 Twitter 用户名，例如：`elonmusk`
   - 点击"提交评价 Submit"
   - 等待 5 秒

3. **验证头像**
   - 刷新页面
   - 新评价应该显示该用户的真实 Twitter 头像
   - 而不是之前的卡通头像

### 步骤 3: 验证数据库

在 Supabase SQL Editor 执行：

```sql
SELECT
  twitter_username,
  twitter_name,
  profile_image_url,
  created_at
FROM observatory_profiles
ORDER BY created_at DESC
LIMIT 5;
```

应该看到 `profile_image_url` 字段包含真实的 Twitter 头像 URL。

---

## 🎯 头像获取策略

### 优先级 1: Twitter API v2（最准确）

**需要配置**：
- 在 Edge Function 设置中添加环境变量
- `TWITTER_BEARER_TOKEN` = `你的 Twitter API Bearer Token`

**优点**：
- ✅ 官方 API，最准确
- ✅ 获取高清头像（400x400）
- ✅ 同时获取关注者数、简介等信息

**缺点**：
- ❌ 需要申请 Twitter Developer 账号
- ❌ 免费版有请求限制

**如何获取 Bearer Token**：
1. 访问 https://developer.twitter.com/
2. 创建 App
3. 在 Keys and tokens 页面生成 Bearer Token

---

### 优先级 2: unavatar.io（推荐，默认使用）

**无需配置**，开箱即用！

**URL 格式**：
```
https://unavatar.io/twitter/{username}
```

**优点**：
- ✅ 完全免费
- ✅ 无需 API key
- ✅ 稳定可靠
- ✅ 自动获取最新头像

**缺点**：
- ❌ 图片质量略低于官方 API

---

### 优先级 3: dicebear（最后备用）

如果前两种方法都失败，使用卡通头像：
```
https://api.dicebear.com/7.x/avataaars/svg?seed={username}
```

---

## 📊 更新前 vs 更新后

### 更新前（卡通头像）
```
profile_image_url: "https://api.dicebear.com/7.x/avataaars/svg?seed=elonmusk"
```
显示效果：🧑‍🦲 随机生成的卡通头像

### 更新后（真实头像）
```
profile_image_url: "https://unavatar.io/twitter/elonmusk"
```
显示效果：🖼️ Elon Musk 的真实 Twitter 头像

---

## 🧪 测试建议

**推荐测试用户**（真实账号）：
- `elonmusk` - Elon Musk
- `OpenAI` - OpenAI 官方
- `AnthropicAI` - Anthropic 官方
- `sama` - Sam Altman
- `karpathy` - Andrej Karpathy

提交这些用户名后，应该能看到他们的真实头像。

---

## 🔍 故障排除

### 问题 1: 头像仍然是卡通的

**可能原因**：
- Edge Function 代码还没更新
- 缓存问题

**解决方法**：
1. 确认 Edge Function 已重新部署
2. 清除浏览器缓存（Cmd/Ctrl + Shift + R）
3. 等待 3-5 秒让 Edge Function 完成处理

### 问题 2: 头像显示不出来

**可能原因**：
- Twitter 用户名不存在
- 网络问题

**解决方法**：
1. 确认用户名拼写正确
2. 检查 Edge Function 日志：
   - Supabase Dashboard → Edge Functions
   - 点击 `score-twitter-profile`
   - 查看 Logs 标签

### 问题 3: 想使用 Twitter API 获取更详细信息

**配置步骤**：

1. **获取 Twitter Bearer Token**
   - 访问 https://developer.twitter.com/
   - 创建项目和 App
   - 在 Keys and tokens 生成 Bearer Token
   - 复制 Bearer Token（格式：`AAAAAAAAAAAAAAAAAAAAAxxxxxxxxxx...`）

2. **在 Supabase 配置环境变量**
   - Supabase Dashboard → Edge Functions
   - 点击 `score-twitter-profile`
   - 找到 **Secrets** 或 **Environment Variables**
   - 添加：`TWITTER_BEARER_TOKEN` = `你的token`
   - 保存并重新部署

3. **测试**
   - 提交新用户
   - 现在会使用 Twitter API 获取信息
   - 能看到真实的关注者数量

---

## 📈 数据结构更新

数据库中保存的头像字段：

```typescript
{
  twitter_username: "elonmusk",
  twitter_name: "Elon Musk",  // 真实姓名
  profile_image_url: "https://pbs.twimg.com/profile_images/...",  // 真实头像 URL
  details: {
    followers: "165,234,567",  // 真实关注者数（如果配置了 Twitter API）
    ...
  }
}
```

---

## ✅ 完成检查清单

- [ ] 1. 已更新 Edge Function 代码
- [ ] 2. Edge Function 已重新部署
- [ ] 3. 测试提交真实 Twitter 用户
- [ ] 4. 看到真实头像显示
- [ ] 5. 数据库中保存了真实头像 URL

---

## 🚀 后续优化建议

### Phase 2: 头像缓存优化
- 将头像下载到 Supabase Storage
- 避免依赖第三方服务
- 提升加载速度

### Phase 3: 更多社交媒体支持
- Instagram 头像
- GitHub 头像
- LinkedIn 头像

---

**创建时间**: 2026-02-24
**作者**: Claude (AI Assistant)
**版本**: v2.0 - Twitter 真实头像支持
