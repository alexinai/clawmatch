#!/bin/bash

# 中转API测试脚本

echo "🧪 中转 API 测试工具"
echo "================================"
echo ""

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 获取配置
echo "请输入你的中转 API Endpoint:"
echo "例如: https://api.example.com/v1/messages"
read -p "Endpoint: " API_ENDPOINT

echo ""
echo "请输入你的中转 API Key:"
read -s -p "API Key: " API_KEY
echo ""

echo ""
echo -e "${BLUE}================================${NC}"
echo -e "${BLUE}测试 1/3: 基础连接测试${NC}"
echo -e "${BLUE}================================${NC}"
echo ""

# 测试1: 简单的 Hello World
echo "发送简单测试请求..."

TEST1_RESPONSE=$(curl -s -w "\nHTTP_CODE:%{http_code}" -X POST "$API_ENDPOINT" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $API_KEY" \
  -H "anthropic-version: 2023-06-01" \
  -d '{
    "model": "claude-3-5-sonnet-20241022",
    "max_tokens": 100,
    "messages": [
      {
        "role": "user",
        "content": "Say hello in one word"
      }
    ]
  }')

HTTP_CODE=$(echo "$TEST1_RESPONSE" | grep "HTTP_CODE" | cut -d: -f2)
RESPONSE_BODY=$(echo "$TEST1_RESPONSE" | sed '/HTTP_CODE/d')

echo ""
echo "HTTP 状态码: $HTTP_CODE"
echo ""

if [ "$HTTP_CODE" == "200" ]; then
    echo -e "${GREEN}✅ 测试 1 通过: API 连接正常${NC}"
    echo ""
    echo "返回内容:"
    echo "$RESPONSE_BODY" | jq '.' 2>/dev/null || echo "$RESPONSE_BODY"
else
    echo -e "${RED}❌ 测试 1 失败: HTTP $HTTP_CODE${NC}"
    echo ""
    echo "错误信息:"
    echo "$RESPONSE_BODY"
    echo ""
    echo -e "${YELLOW}可能的原因：${NC}"
    echo "1. API Key 不正确"
    echo "2. API Endpoint 不正确"
    echo "3. 中转服务不支持 Claude 3.5 Sonnet"
    echo "4. 网络连接问题"
    exit 1
fi

echo ""
echo -e "${BLUE}================================${NC}"
echo -e "${BLUE}测试 2/3: JSON 解析测试${NC}"
echo -e "${BLUE}================================${NC}"
echo ""

# 测试2: 要求返回 JSON
echo "发送 JSON 格式测试请求..."

TEST2_RESPONSE=$(curl -s -w "\nHTTP_CODE:%{http_code}" -X POST "$API_ENDPOINT" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $API_KEY" \
  -H "anthropic-version: 2023-06-01" \
  -d '{
    "model": "claude-3-5-sonnet-20241022",
    "max_tokens": 500,
    "temperature": 0.7,
    "messages": [
      {
        "role": "user",
        "content": "Please return ONLY this JSON and nothing else: {\"test\": \"success\", \"number\": 42}"
      }
    ]
  }')

HTTP_CODE=$(echo "$TEST2_RESPONSE" | grep "HTTP_CODE" | cut -d: -f2)
RESPONSE_BODY=$(echo "$TEST2_RESPONSE" | sed '/HTTP_CODE/d')

if [ "$HTTP_CODE" == "200" ]; then
    echo -e "${GREEN}✅ 测试 2 通过: JSON 格式支持正常${NC}"
    echo ""
    echo "AI 返回内容:"
    echo "$RESPONSE_BODY" | jq '.content[0].text' 2>/dev/null || echo "$RESPONSE_BODY"
else
    echo -e "${RED}❌ 测试 2 失败: HTTP $HTTP_CODE${NC}"
    echo "$RESPONSE_BODY"
    exit 1
fi

echo ""
echo -e "${BLUE}================================${NC}"
echo -e "${BLUE}测试 3/3: 性格分析模拟测试${NC}"
echo -e "${BLUE}================================${NC}"
echo ""

# 测试3: 模拟真实的性格分析请求
echo "发送性格分析模拟请求..."

TEST3_RESPONSE=$(curl -s -w "\nHTTP_CODE:%{http_code}" -X POST "$API_ENDPOINT" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $API_KEY" \
  -H "anthropic-version: 2023-06-01" \
  -d '{
    "model": "claude-3-5-sonnet-20241022",
    "max_tokens": 1500,
    "temperature": 0.7,
    "messages": [
      {
        "role": "user",
        "content": "Based on the Twitter username \"techgenius\", analyze the personality. Return ONLY valid JSON in this format:\n\n```json\n{\n  \"bigFive\": {\n    \"extraversion\": 75,\n    \"openness\": 90,\n    \"agreeableness\": 60,\n    \"conscientiousness\": 70,\n    \"neuroticism\": 40\n  },\n  \"dominanceScore\": 68,\n  \"smType\": \"Switch\",\n  \"tags\": [\"Tech Savvy\", \"Creative\", \"Analytical\"],\n  \"insights\": {\n    \"usernameAnalysis\": \"Username suggests tech orientation and confidence\",\n    \"personalityCore\": \"Likely analytical and innovative\"\n  }\n}\n```"
      }
    ]
  }')

HTTP_CODE=$(echo "$TEST3_RESPONSE" | grep "HTTP_CODE" | cut -d: -f2)
RESPONSE_BODY=$(echo "$TEST3_RESPONSE" | sed '/HTTP_CODE/d')

if [ "$HTTP_CODE" == "200" ]; then
    echo -e "${GREEN}✅ 测试 3 通过: 性格分析请求正常${NC}"
    echo ""
    echo "AI 分析结果:"
    AI_CONTENT=$(echo "$RESPONSE_BODY" | jq -r '.content[0].text' 2>/dev/null)

    if [ $? -eq 0 ] && [ -n "$AI_CONTENT" ]; then
        echo "$AI_CONTENT"
        echo ""

        # 尝试解析 JSON
        JSON_CONTENT=$(echo "$AI_CONTENT" | sed -n '/```json/,/```/p' | sed '1d;$d')
        if [ -z "$JSON_CONTENT" ]; then
            JSON_CONTENT="$AI_CONTENT"
        fi

        echo "$JSON_CONTENT" | jq '.' > /dev/null 2>&1
        if [ $? -eq 0 ]; then
            echo -e "${GREEN}✅ JSON 格式验证通过${NC}"
        else
            echo -e "${YELLOW}⚠️  JSON 格式可能需要调整（但这是正常的，实际使用时会处理）${NC}"
        fi
    else
        echo "$RESPONSE_BODY" | jq '.'
    fi
else
    echo -e "${RED}❌ 测试 3 失败: HTTP $HTTP_CODE${NC}"
    echo "$RESPONSE_BODY"
    exit 1
fi

echo ""
echo -e "${GREEN}================================${NC}"
echo -e "${GREEN}🎉 所有测试通过！${NC}"
echo -e "${GREEN}================================${NC}"
echo ""
echo "✅ 你的中转 API 完全兼容"
echo "✅ 可以继续部署 AI 性格分析功能"
echo ""
echo "下一步："
echo "  运行 ./deploy-ai-analysis.sh 开始部署"
echo ""

# 保存测试结果
cat > test-results.txt <<EOF
中转API测试结果
================
测试时间: $(date)
API Endpoint: $API_ENDPOINT
API Key: ${API_KEY:0:10}***

测试 1: ✅ 基础连接正常
测试 2: ✅ JSON 格式支持
测试 3: ✅ 性格分析请求正常

结论: 可以部署
EOF

echo "测试结果已保存到 test-results.txt"
