#!/bin/bash

# 测试生产构建脚本

echo "🧪 测试生产构建..."
echo ""

# 检查是否已构建
if [ ! -d ".next" ]; then
    echo "❌ 未找到 .next 目录"
    echo "请先运行: npm run build"
    exit 1
fi

echo "✅ 找到构建目录"
echo ""

# 检查环境变量
echo "📋 检查环境变量..."
if [ -f ".env.production" ]; then
    echo "✅ 找到 .env.production"
    
    # 检查 FORCE_HTTPS 设置
    if grep -q "FORCE_HTTPS.*true" .env.production; then
        echo "⚠️  警告: FORCE_HTTPS 设置为 true"
        echo "   这会导致强制 HTTPS 重定向"
    else
        echo "✅ FORCE_HTTPS 未启用或设置为 false"
    fi
else
    echo "⚠️  未找到 .env.production，将使用默认设置"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📝 测试说明"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "1. 启动生产服务器:"
echo "   npm start"
echo ""
echo "2. 在另一个终端测试:"
echo "   curl -I http://localhost:3000/api/health"
echo ""
echo "3. 检查响应头:"
echo "   - 应该返回 200 OK"
echo "   - 不应该有 301/302 重定向"
echo "   - 如果 FORCE_HTTPS=false，不应该有 Strict-Transport-Security 头"
echo ""
echo "4. 浏览器测试（隐私模式）:"
echo "   http://localhost:3000/test"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
