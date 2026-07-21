#!/bin/bash

# 漫剧工作流 API 测试脚本

BASE_URL="http://localhost:8000/api/v1"

echo "=== 漫剧工作流 API 测试 ==="
echo ""

# 1. 登录获取 token（需要先有用户）
echo "1. 登录获取 token..."
LOGIN_RESPONSE=$(curl -s -X POST "$BASE_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}')

TOKEN=$(echo $LOGIN_RESPONSE | grep -o '"access_token":"[^"]*' | cut -d'"' -f4)

if [ -z "$TOKEN" ]; then
  echo "❌ 登录失败，请先创建测试用户"
  echo "Response: $LOGIN_RESPONSE"
  exit 1
fi

echo "✅ 登录成功，Token: ${TOKEN:0:20}..."
echo ""

# 2. 创建项目
echo "2. 创建漫剧项目..."
CREATE_RESPONSE=$(curl -s -X POST "$BASE_URL/comic/projects" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"title":"测试漫剧项目","description":"这是一个测试项目"}')

PROJECT_ID=$(echo $CREATE_RESPONSE | grep -o '"project_id":"[^"]*' | cut -d'"' -f4)

if [ -z "$PROJECT_ID" ]; then
  echo "❌ 创建项目失败"
  echo "Response: $CREATE_RESPONSE"
  exit 1
fi

echo "✅ 项目创建成功，ID: $PROJECT_ID"
echo ""

# 3. 设置配置
echo "3. 设置项目配置..."
CONFIG_RESPONSE=$(curl -s -X PUT "$BASE_URL/comic/projects/$PROJECT_ID/config" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "config": {
      "aspect_ratio": "16:9",
      "creation_mode": "AI辅助",
      "script_mode": "自动生成",
      "style": "日系动漫"
    }
  }')

echo "✅ 配置设置成功"
echo "Response: $CONFIG_RESPONSE"
echo ""

# 4. 触发生成剧本
echo "4. 触发生成剧本..."
GENERATE_RESPONSE=$(curl -s -X POST "$BASE_URL/comic/projects/$PROJECT_ID/generate" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"original_content":"一个年轻的冒险家在城市中遇到了一位神秘的导师"}')

TASK_ID=$(echo $GENERATE_RESPONSE | grep -o '"task_id":"[^"]*' | cut -d'"' -f4)

echo "✅ 生成任务已启动，Task ID: $TASK_ID"
echo ""

# 5. 轮询查询状态
echo "5. 轮询查询生成状态..."
for i in {1..5}; do
  echo "   查询第 $i 次..."
  STATUS_RESPONSE=$(curl -s -X GET "$BASE_URL/comic/projects/$PROJECT_ID" \
    -H "Authorization: Bearer $TOKEN")

  STATUS=$(echo $STATUS_RESPONSE | grep -o '"status":"[^"]*' | cut -d'"' -f4)
  echo "   当前状态: $STATUS"

  if [ "$STATUS" = "COMPLETED" ]; then
    echo "✅ 生成完成！"
    echo ""
    echo "项目详情:"
    echo $STATUS_RESPONSE | python3 -m json.tool
    break
  elif [ "$STATUS" = "FAILED" ]; then
    echo "❌ 生成失败"
    echo $STATUS_RESPONSE | python3 -m json.tool
    break
  fi

  sleep 1
done
echo ""

# 6. 获取项目列表
echo "6. 获取项目列表..."
LIST_RESPONSE=$(curl -s -X GET "$BASE_URL/comic/projects?limit=10&offset=0" \
  -H "Authorization: Bearer $TOKEN")

echo "✅ 项目列表:"
echo $LIST_RESPONSE | python3 -m json.tool
echo ""

echo "=== 测试完成 ==="
