#!/bin/bash

# 测试 iOS/Android 玩家认证（验证 nickname 是否正确保存）

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🧪 测试 iOS/Android 玩家认证"
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

# 测试 1: iOS 平台 - 传入自定义昵称
echo "2️⃣ 测试 1: iOS 平台 - 传入自定义昵称"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

CUSTOM_NICKNAME="测试iOS玩家_$(date +%s)"
PLAYER_ID="ios_test_$(date +%s)"

echo "传入昵称: $CUSTOM_NICKNAME"
echo "请求: POST /api/players/auth"
echo ""

IOS_RESPONSE=$(curl -s -X POST "http://localhost:3000/api/players/auth" \
  -H "Content-Type: application/json" \
  -H "X-Platform: IOS_APP" \
  -d "{
    \"gameId\": \"$GAME_ID\",
    \"playerId\": \"$PLAYER_ID\",
    \"platform\": \"IOS_APP\",
    \"nickname\": \"$CUSTOM_NICKNAME\",
    \"avatarUrl\": \"https://example.com/ios-avatar.jpg\"
  }")

echo "响应:"
echo $IOS_RESPONSE | jq '.' 2>/dev/null || echo $IOS_RESPONSE
echo ""

# 验证昵称是否正确
RETURNED_NICKNAME=$(echo $IOS_RESPONSE | jq -r '.data.player.nickname' 2>/dev/null)

if [ "$RETURNED_NICKNAME" = "$CUSTOM_NICKNAME" ]; then
    echo "✅ 测试通过：昵称正确保存"
    echo "   传入: $CUSTOM_NICKNAME"
    echo "   返回: $RETURNED_NICKNAME"
else
    echo "❌ 测试失败：昵称不匹配"
    echo "   传入: $CUSTOM_NICKNAME"
    echo "   返回: $RETURNED_NICKNAME"
fi

echo ""
echo ""

# 测试 2: Android 平台 - 传入自定义昵称
echo "3️⃣ 测试 2: Android 平台 - 传入自定义昵称"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

CUSTOM_NICKNAME="测试Android玩家_$(date +%s)"
PLAYER_ID="android_test_$(date +%s)"

echo "传入昵称: $CUSTOM_NICKNAME"
echo "请求: POST /api/players/auth"
echo ""

ANDROID_RESPONSE=$(curl -s -X POST "http://localhost:3000/api/players/auth" \
  -H "Content-Type: application/json" \
  -H "X-Platform: ANDROID_APP" \
  -d "{
    \"gameId\": \"$GAME_ID\",
    \"playerId\": \"$PLAYER_ID\",
    \"platform\": \"ANDROID_APP\",
    \"nickname\": \"$CUSTOM_NICKNAME\",
    \"avatarUrl\": \"https://example.com/android-avatar.jpg\"
  }")

echo "响应:"
echo $ANDROID_RESPONSE | jq '.' 2>/dev/null || echo $ANDROID_RESPONSE
echo ""

# 验证昵称是否正确
RETURNED_NICKNAME=$(echo $ANDROID_RESPONSE | jq -r '.data.player.nickname' 2>/dev/null)

if [ "$RETURNED_NICKNAME" = "$CUSTOM_NICKNAME" ]; then
    echo "✅ 测试通过：昵称正确保存"
    echo "   传入: $CUSTOM_NICKNAME"
    echo "   返回: $RETURNED_NICKNAME"
else
    echo "❌ 测试失败：昵称不匹配"
    echo "   传入: $CUSTOM_NICKNAME"
    echo "   返回: $RETURNED_NICKNAME"
fi

echo ""
echo ""

# 测试 3: iOS 平台 - 不传入昵称（测试默认值）
echo "4️⃣ 测试 3: iOS 平台 - 不传入昵称（测试默认值）"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

PLAYER_ID="ios_default_$(date +%s)"

echo "不传入昵称，应使用默认值"
echo "请求: POST /api/players/auth"
echo ""

DEFAULT_RESPONSE=$(curl -s -X POST "http://localhost:3000/api/players/auth" \
  -H "Content-Type: application/json" \
  -H "X-Platform: IOS_APP" \
  -d "{
    \"gameId\": \"$GAME_ID\",
    \"playerId\": \"$PLAYER_ID\",
    \"platform\": \"IOS_APP\"
  }")

echo "响应:"
echo $DEFAULT_RESPONSE | jq '.' 2>/dev/null || echo $DEFAULT_RESPONSE
echo ""

RETURNED_NICKNAME=$(echo $DEFAULT_RESPONSE | jq -r '.data.player.nickname' 2>/dev/null)

if [[ "$RETURNED_NICKNAME" =~ ^iOS玩家_ ]]; then
    echo "✅ 测试通过：使用了默认昵称"
    echo "   返回: $RETURNED_NICKNAME"
else
    echo "⚠️  昵称格式异常: $RETURNED_NICKNAME"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ 测试完成！"
echo ""
echo "详细文档: cat IOS_ANDROID_AUTH_FIX.md"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
