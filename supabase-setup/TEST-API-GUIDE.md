# 🧪 中转API测试指南

## 📋 测试目的

在部署之前，先确认你的中转API：
- ✅ 能正常连接
- ✅ 支持 Claude 3.5 Sonnet
- ✅ 返回格式正确
- ✅ 能处理性格分析请求

## 🚀 快速测试

### 方式一：使用测试脚本（推荐）

```bash
cd openclaw-workspace/supabase-setup
./test-proxy-api.sh
```

**测试内容**：
1. ✅ 基础连接测试（Hello World）
2. ✅ JSON 解析测试
3. ✅ 性格分析模拟测试

**预期结果**：
- 所有测试通过 ✅
- 生成 `test-results.txt` 报告

### 方式二：手动测试

如果你想手动测试，使用以下命令：

```bash
# 替换成你的实际值
export API_ENDPOINT="https://your-proxy.com/v1/messages"
export API_KEY="your-api-key"

# 测试1: 基础连接
curl -X POST "$API_ENDPOINT" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $API_KEY" \
  -H "anthropic-version: 2023-06-01" \
  -d '{
    "model": "claude-3-5-sonnet-20241022",
    "max_tokens": 100,
    "messages": [{"role": "user", "content": "Say hello"}]
  }'
```

**期望返回**：
```json
{
  "id": "msg_xxx",
  "type": "message",
  "role": "assistant",
  "content": [
    {
      "type": "text",
      "text": "Hello!"
    }
  ],
  "model": "claude-3-5-sonnet-20241022",
  "stop_reason": "end_turn",
  "usage": {
    "input_tokens": 10,
    "output_tokens": 5
  }
}
```

## 🔍 常见问题诊断

### 问题1: 401 Unauthorized

**症状**：
```json
{"error": {"type": "authentication_error", "message": "Invalid API key"}}
```

**解决**：
- ✅ 检查 API Key 是否正确
- ✅ 检查 API Key 是否有效期内
- ✅ 检查是否需要在 Header 中添加其他字段

### 问题2: 404 Not Found

**症状**：
```
404 Not Found
```

**解决**：
- ✅ 检查 API Endpoint 是否正确
- ✅ 确认路径是 `/v1/messages` 还是其他
- ✅ 有些中转服务可能用 `/anthropic/v1/messages`

### 问题3: 模型不支持

**症状**：
```json
{"error": "model not found"}
```

**解决**：
- 尝试其他模型名称：
  - `claude-3-5-sonnet-20241022`（最新）
  - `claude-3-5-sonnet-20240620`（旧版）
  - `claude-3-sonnet-20240229`
- 联系中转服务商确认支持的模型

### 问题4: 返回格式不对

**症状**：
返回的 JSON 结构和 Anthropic 官方不一致

**解决**：
- 需要修改 Edge Function 代码适配你的中转格式
- 告诉我你的返回格式，我帮你调整

## 📊 测试结果判读

### ✅ 全部通过

```
✅ 测试 1 通过: API 连接正常
✅ 测试 2 通过: JSON 格式支持正常
✅ 测试 3 通过: 性格分析请求正常

🎉 所有测试通过！
```

**下一步**：运行 `./deploy-ai-analysis.sh` 部署

### ⚠️ 部分通过

如果测试 1、2 通过，但测试 3 失败：
- 可能是 token 限制问题
- 可能是 temperature 参数不支持
- 联系我，我会调整代码

### ❌ 全部失败

如果测试 1 就失败了：
1. 检查网络连接
2. 检查 API Key 和 Endpoint
3. 确认中转服务是否在线
4. 查看中转服务商的文档

## 🛠️ 调试技巧

### 查看详细请求

```bash
# 添加 -v 参数查看详细信息
curl -v -X POST "$API_ENDPOINT" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $API_KEY" \
  -d '{"model": "claude-3-5-sonnet-20241022", "max_tokens": 100, "messages": [{"role": "user", "content": "test"}]}'
```

### 检查返回格式

```bash
# 使用 jq 格式化 JSON
curl -s ... | jq '.'

# 检查特定字段
curl -s ... | jq '.content[0].text'
```

### 测试不同的模型

```bash
# 测试 Sonnet
curl ... -d '{"model": "claude-3-5-sonnet-20241022", ...}'

# 测试 Haiku（如果支持）
curl ... -d '{"model": "claude-3-haiku-20240307", ...}'
```

## 📝 测试报告示例

**成功的测试报告**：

```
中转API测试结果
================
测试时间: 2024-02-24 16:30:00
API Endpoint: https://api.example.com/v1/messages
API Key: sk-abc123***

测试 1: ✅ 基础连接正常
  HTTP 200 OK
  返回时间: 1.2s

测试 2: ✅ JSON 格式支持
  HTTP 200 OK
  AI 正确返回 JSON

测试 3: ✅ 性格分析请求正常
  HTTP 200 OK
  返回了完整的性格分析结果
  JSON 格式验证通过

结论: 可以部署 ✅
```

## 🔄 如果测试失败

### 1. 收集信息

运行测试后，请提供：
- HTTP 状态码
- 错误信息
- 你的中转服务商名称
- API 文档链接（如果有）

### 2. 我可以帮你

把以下信息告诉我：
```
1. API Endpoint: https://...
2. 错误信息: {...}
3. HTTP 状态码: 401/404/500...
4. 中转服务商: XXX
```

我会帮你：
- ✅ 分析问题原因
- ✅ 调整代码适配
- ✅ 提供解决方案

## 🎯 下一步

### 测试通过后

```bash
# 1. 运行部署脚本
./deploy-ai-analysis.sh

# 2. 或者告诉我你的配置，我帮你部署
```

### 测试失败后

把测试结果截图或复制给我，我会帮你排查问题。

---

**准备好了吗？** 运行 `./test-proxy-api.sh` 开始测试！
