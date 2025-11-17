#!/bin/bash

# 测试玩家认证 API

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🧪 测试玩家认证 API"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# 检查服务器是否运行
if ! curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/api/health | grep -q "200"; then
    echo "❌ 服务器未运行"
    echo "请先运行: npm run dev"
    exit 1
fi

echo "✅ 服务器正在运行"
echo ""

# 获取第一个游戏的 ID
echo "1️⃣ 获取游戏列表..."
GAME_RESPONSE=$(curl -s http://localhost:3000/api/games)
GAME_ID=$(echo $GAME_RESPONSE | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)

if [ -z "$GAME_ID" ]; then
    echo "❌ 未找到游戏"
    echo "请先运行: npm run db:seed"
    exit 1
fi

echo "✅ 找到游戏 ID: $GAME_ID"
echo ""

# 测试 1: iOS 平台玩家认证
echo "2️⃣ 测试 1: iOS 平台玩家认证"
echo "请求: POST /api/players/auth"
echo ""

PLAYER_ID="test_player_$(date +%s)"
RESPONSE=$(curl -s -X POST "http://localhost:3000/api/players/auth" \
  -H "Content-Type: application/json" \
  -H "X-Platform: IOS_APP" \
  -d "{
    \"gameId\": \"$GAME_ID\",
    \"playerId\": \"$PLAYER_ID\",
    \"platform\": \"IOS_APP\",
    \"nickname\": \"测试玩家\",
    \"avatarUrl\": \"https://example.com/avatar.jpg\"
  }")

echo "响应:"
echo $RESPONSE | jq '.' 2>/dev/null || echo $RESPONSE
echo ""

# 提取 token
TOKEN=$(echo $RESPONSE | jq -r '.data.token' 2>/dev/null)

if [ "$TOKEN" != "null" ] && [ -n "$TOKEN" ]; then
    echo "✅ 认证成功，获取到 token"
    echo ""
    
    # 测试 2: 使用 token 提交分数
    echo "3️⃣ 测试 2: 使用 token 提交分数"
    echo "请求: POST /api/players/score"
    echo ""
    
    SCORE_RESPONSE=$(curl -s -X POST "http://localhost:3000/api/players/score" \
      -H "Content-Type: application/json" \
      -H "X-Platform: IOS_APP" \
      -d "{
        \"token\": \"$TOKEN\",
        \"score\": 1500,
        \"duration\": 300,
        \"detailsJson\": {
          \"level\": 15,
          \"items_used\": {\"hint\": 3}
        }
      }")
    
    echo "响应:"
    echo $SCORE_RESPONSE | jq '.' 2>/dev/null || echo $SCORE_RESPONSE
    echo ""
    
    RANK=$(echo $SCORE_RESPONSE | jq -r '.data.currentRank' 2>/dev/null)
    if [ "$RANK" != "null" ] && [ -n "$RANK" ]; then
        echo "✅ 提交分数成功，当前排名: 第 $RANK 名"
    else
        echo "⚠️  提交分数失败"
    fi
else
    echo "❌ 认证失败"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ 测试完成！"
echo ""
echo "详细文档: cat API_INTEGRATION_GUIDE.md"
echo "H5 测试页面: http://localhost:3000/test-h5.html"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
