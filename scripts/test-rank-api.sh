#!/bin/bash

# 测试排名查询 API

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🧪 测试排名查询 API"
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

# 测试 1: 查询分数 1500 的全平台排名（不传 platform）
echo "2️⃣ 测试 1: 查询分数 1500 的全平台排名"
echo "请求: GET /api/leaderboards/$GAME_ID/rank?score=1500"
echo ""

RESPONSE=$(curl -s "http://localhost:3000/api/leaderboards/$GAME_ID/rank?score=1500")
echo "响应:"
echo $RESPONSE | jq '.' 2>/dev/null || echo $RESPONSE
RANK=$(echo $RESPONSE | jq -r '.data.rank' 2>/dev/null)
echo "排名: $RANK"
echo ""

# 测试 2: 查询特定平台的排名（传入 platform）
echo "3️⃣ 测试 2: 查询微信平台分数 1500 的排名"
echo "请求: GET /api/leaderboards/$GAME_ID/rank?score=1500&platform=WECHAT"
echo ""

RESPONSE=$(curl -s "http://localhost:3000/api/leaderboards/$GAME_ID/rank?score=1500&platform=WECHAT")
echo "响应:"
echo $RESPONSE | jq '.' 2>/dev/null || echo $RESPONSE
RANK=$(echo $RESPONSE | jq -r '.data.rank' 2>/dev/null)
echo "排名: $RANK"
echo ""

# 测试 3: 查询 iOS 平台的排名
echo "4️⃣ 测试 3: 查询 iOS 平台分数 2000 的排名"
echo "请求: GET /api/leaderboards/$GAME_ID/rank?score=2000&platform=IOS_APP"
echo ""

RESPONSE=$(curl -s "http://localhost:3000/api/leaderboards/$GAME_ID/rank?score=2000&platform=IOS_APP")
echo "响应:"
echo $RESPONSE | jq '.' 2>/dev/null || echo $RESPONSE
RANK=$(echo $RESPONSE | jq -r '.data.rank' 2>/dev/null)
echo "排名: $RANK"
echo ""

# 测试 4: 查询很高的分数（应该排名第1）
echo "5️⃣ 测试 4: 查询高分 9999 的全平台排名"
echo "请求: GET /api/leaderboards/$GAME_ID/rank?score=9999"
echo ""

RESPONSE=$(curl -s "http://localhost:3000/api/leaderboards/$GAME_ID/rank?score=9999")
RANK=$(echo $RESPONSE | jq -r '.data.rank' 2>/dev/null)

if [ "$RANK" = "1" ]; then
    echo "✅ 测试通过：高分排名第1"
else
    echo "⚠️  排名: $RANK"
fi
echo "响应: $RESPONSE"
echo ""

# 测试 5: 查询很低的分数（应该排名最后）
echo "6️⃣ 测试 5: 查询低分 0 的全平台排名"
echo "请求: GET /api/leaderboards/$GAME_ID/rank?score=0"
echo ""

RESPONSE=$(curl -s "http://localhost:3000/api/leaderboards/$GAME_ID/rank?score=0")
RANK=$(echo $RESPONSE | jq -r '.data.rank' 2>/dev/null)
echo "✅ 低分排名: $RANK"
echo "响应: $RESPONSE"
echo ""

# 测试 6: 参数验证（缺少 score）
echo "7️⃣ 测试 6: 参数验证（缺少 score 参数）"
echo "请求: GET /api/leaderboards/$GAME_ID/rank"
echo ""

RESPONSE=$(curl -s "http://localhost:3000/api/leaderboards/$GAME_ID/rank")
ERROR_CODE=$(echo $RESPONSE | jq -r '.error.code' 2>/dev/null)

if [ "$ERROR_CODE" = "VALIDATION_ERROR" ]; then
    echo "✅ 测试通过：正确返回验证错误"
else
    echo "⚠️  响应: $RESPONSE"
fi
echo ""

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ 测试完成！"
echo ""
echo "API 端点: GET /api/leaderboards/{gameId}/rank"
echo "参数: score (必需), platform (可选)"
echo ""
echo "详细文档: cat RANK_API_GUIDE.md"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
