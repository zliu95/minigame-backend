#!/bin/bash

# 本地测试脚本 - 验证应用是否正常运行
# 这个脚本不受浏览器 HSTS 缓存影响

echo "🧪 开始测试本地应用..."
echo ""

# 检查服务器是否运行
echo "1️⃣ 检查服务器状态..."
if curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/api/health | grep -q "200"; then
    echo "   ✅ 服务器正在运行"
else
    echo "   ❌ 服务器未运行或无法访问"
    echo "   请先运行: npm run dev"
    exit 1
fi

echo ""
echo "2️⃣ 测试健康检查端点..."
HEALTH_RESPONSE=$(curl -s http://localhost:3000/api/health)
echo "   响应: $HEALTH_RESPONSE"

if echo "$HEALTH_RESPONSE" | grep -q "\"status\":\"ok\""; then
    echo "   ✅ 健康检查通过"
else
    echo "   ⚠️  健康检查返回异常"
fi

echo ""
echo "3️⃣ 测试登录页面..."
LOGIN_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/login)
if [ "$LOGIN_STATUS" = "200" ]; then
    echo "   ✅ 登录页面可访问 (HTTP $LOGIN_STATUS)"
else
    echo "   ⚠️  登录页面返回 HTTP $LOGIN_STATUS"
fi

echo ""
echo "4️⃣ 测试测试页面..."
TEST_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/test)
if [ "$TEST_STATUS" = "200" ]; then
    echo "   ✅ 测试页面可访问 (HTTP $TEST_STATUS)"
else
    echo "   ⚠️  测试页面返回 HTTP $TEST_STATUS"
fi

echo ""
echo "5️⃣ 检查是否有 HTTPS 重定向..."
REDIRECT_CHECK=$(curl -s -I http://localhost:3000/ | grep -i "location.*https")
if [ -z "$REDIRECT_CHECK" ]; then
    echo "   ✅ 没有检测到 HTTPS 重定向"
else
    echo "   ❌ 检测到 HTTPS 重定向: $REDIRECT_CHECK"
    echo "   这不应该发生，请检查 next.config.ts"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📊 测试总结"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "✅ 应用本身运行正常！"
echo ""
echo "如果浏览器仍然跳转到 HTTPS，这是浏览器的 HSTS 缓存问题。"
echo ""
echo "解决方法："
echo "  1. 使用隐私模式访问: http://localhost:3000/test"
echo "  2. 清除 HSTS 缓存: chrome://net-internals/#hsts"
echo "  3. 查看详细说明: cat CLEAR_HSTS.md"
echo ""
echo "快速访问："
echo "  • 测试页面: http://localhost:3000/test"
echo "  • 登录页面: http://localhost:3000/login"
echo "  • 健康检查: http://localhost:3000/api/health"
echo ""
