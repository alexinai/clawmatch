#!/bin/bash

# AI性格分析 - 一键部署脚本

echo "🚀 AI性格分析功能部署脚本"
echo "================================"
echo ""

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 检查是否已登录 Supabase
echo "📋 步骤 1/5: 检查 Supabase CLI..."
if ! command -v supabase &> /dev/null; then
    echo -e "${RED}❌ Supabase CLI 未安装${NC}"
    echo "请访问: https://supabase.com/docs/guides/cli"
    exit 1
fi
echo -e "${GREEN}✅ Supabase CLI 已安装${NC}"
echo ""

# 获取配置信息
echo "📝 步骤 2/5: 配置 API 信息"
echo ""
echo "请输入你的中转 API Key:"
read -p "API Key: " PROXY_API_KEY

echo ""
echo "请输入你的中转 API Endpoint:"
echo "例如: https://api.example.com/v1/messages"
read -p "Endpoint: " PROXY_API_ENDPOINT

echo ""
echo "请输入你的 Supabase Project Reference:"
echo "可在 Supabase Dashboard 的 Settings -> General 中找到"
read -p "Project Ref: " SUPABASE_PROJECT_REF

echo ""
echo -e "${YELLOW}确认信息：${NC}"
echo "API Endpoint: $PROXY_API_ENDPOINT"
echo "API Key: ${PROXY_API_KEY:0:10}***"
echo "Project Ref: $SUPABASE_PROJECT_REF"
echo ""
read -p "确认无误？(y/n): " confirm

if [ "$confirm" != "y" ]; then
    echo "已取消部署"
    exit 0
fi

# 设置环境变量
echo ""
echo "🔐 步骤 3/5: 设置环境变量..."
supabase secrets set PROXY_API_KEY="$PROXY_API_KEY" --project-ref "$SUPABASE_PROJECT_REF"
supabase secrets set PROXY_API_ENDPOINT="$PROXY_API_ENDPOINT" --project-ref "$SUPABASE_PROJECT_REF"
echo -e "${GREEN}✅ 环境变量已设置${NC}"

# 创建数据库表
echo ""
echo "🗄️  步骤 4/5: 创建数据库表..."
echo "请在 Supabase Dashboard -> SQL Editor 中执行以下SQL："
echo ""
cat migrations/create_personality_cache.sql
echo ""
read -p "执行完毕后按回车继续..."
echo -e "${GREEN}✅ 数据库表已创建${NC}"

# 部署 Edge Function
echo ""
echo "🚢 步骤 5/5: 部署 Edge Function..."
supabase functions deploy ai-personality-analysis --project-ref "$SUPABASE_PROJECT_REF"

if [ $? -eq 0 ]; then
    echo ""
    echo -e "${GREEN}================================${NC}"
    echo -e "${GREEN}✅ 部署成功！${NC}"
    echo -e "${GREEN}================================${NC}"
    echo ""
    echo "📡 API 端点："
    echo "https://${SUPABASE_PROJECT_REF}.supabase.co/functions/v1/ai-personality-analysis"
    echo ""
    echo "🧪 测试命令："
    echo "curl -X POST https://${SUPABASE_PROJECT_REF}.supabase.co/functions/v1/ai-personality-analysis \\"
    echo "  -H 'Content-Type: application/json' \\"
    echo "  -d '{\"username\": \"elonmusk\"}'"
    echo ""
else
    echo -e "${RED}❌ 部署失败${NC}"
    echo "请查看错误信息"
    exit 1
fi
