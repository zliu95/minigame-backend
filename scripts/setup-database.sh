#!/bin/bash

# 数据库设置脚本
# 用于快速设置 Supabase/Neon/本地 PostgreSQL 数据库

set -e

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🗄️  数据库设置向导"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# 检查是否在正确的目录
if [ ! -f "package.json" ]; then
    echo "❌ 错误: 请在项目根目录运行此脚本"
    exit 1
fi

# 检查环境变量
if [ -z "$DATABASE_URL" ]; then
    echo "❌ 错误: DATABASE_URL 未设置"
    echo ""
    echo "请先配置数据库连接："
    echo ""
    echo "1. 复制环境变量模板："
    echo "   cp .env.example .env"
    echo ""
    echo "2. 编辑 .env 文件，设置 DATABASE_URL："
    echo "   # Supabase"
    echo "   DATABASE_URL=\"postgresql://postgres:password@db.xxx.supabase.co:5432/postgres?pgbouncer=true\""
    echo "   DIRECT_URL=\"postgresql://postgres:password@db.xxx.supabase.co:5432/postgres\""
    echo ""
    echo "   # Neon"
    echo "   DATABASE_URL=\"postgresql://user:pass@ep-xxx.neon.tech/neondb?sslmode=require&pgbouncer=true\""
    echo "   DIRECT_URL=\"postgresql://user:pass@ep-xxx.neon.tech/neondb?sslmode=require\""
    echo ""
    echo "   # 本地"
    echo "   DATABASE_URL=\"postgresql://user:pass@localhost:5432/game_leaderboard_admin\""
    echo ""
    echo "3. 重新运行此脚本"
    echo ""
    exit 1
fi

echo "✅ 找到 DATABASE_URL"
echo ""

# 显示数据库信息（隐藏密码）
DB_INFO=$(echo $DATABASE_URL | sed 's/:\/\/[^:]*:[^@]*@/:\/\/***:***@/')
echo "📍 数据库: $DB_INFO"
echo ""

# 询问是否继续
read -p "是否继续设置数据库？(y/n) " -n 1 -r
echo ""
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "❌ 已取消"
    exit 0
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "开始设置..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# 1. 生成 Prisma Client
echo "1️⃣  生成 Prisma Client..."
if npx prisma generate; then
    echo "   ✅ Prisma Client 生成成功"
else
    echo "   ❌ Prisma Client 生成失败"
    exit 1
fi
echo ""

# 2. 运行迁移
echo "2️⃣  运行数据库迁移..."
echo "   创建表结构..."

if npx prisma migrate deploy; then
    echo "   ✅ 数据库迁移成功"
else
    echo "   ❌ 数据库迁移失败"
    echo ""
    echo "可能的原因："
    echo "  1. 数据库连接失败 - 检查 DATABASE_URL"
    echo "  2. 权限不足 - 确保数据库用户有创建表的权限"
    echo "  3. 使用了连接池 - 迁移需要使用 DIRECT_URL"
    echo ""
    exit 1
fi
echo ""

# 3. 创建初始数据
echo "3️⃣  创建初始管理员账号..."
if npm run db:seed; then
    echo "   ✅ 初始数据创建成功"
else
    echo "   ⚠️  初始数据创建失败（可能已存在）"
fi
echo ""

# 4. 验证数据库连接
echo "4️⃣  验证数据库连接..."
if npx prisma db execute --stdin <<EOF > /dev/null 2>&1
SELECT 1;
EOF
then
    echo "   ✅ 数据库连接正常"
else
    echo "   ⚠️  数据库连接验证失败"
fi
echo ""

# 5. 显示表信息
echo "5️⃣  检查创建的表..."
echo ""
npx prisma db execute --stdin <<EOF
SELECT 
    schemaname as schema,
    tablename as table,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size
FROM pg_tables 
WHERE schemaname = 'public'
ORDER BY tablename;
EOF
echo ""

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ 数据库设置完成！"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📊 数据库信息："
echo "  • 表: Admin, Game, Player"
echo "  • 索引: 已创建性能优化索引"
echo "  • 初始数据: 已创建默认管理员"
echo ""
echo "🔐 默认管理员账号："
echo "  用户名: admin"
echo "  密码: admin123"
echo "  ⚠️  请在生产环境修改密码！"
echo ""
echo "🚀 下一步："
echo "  1. 启动开发服务器:"
echo "     npm run dev"
echo ""
echo "  2. 访问登录页面:"
echo "     http://localhost:3000/login"
echo ""
echo "  3. 使用默认账号登录"
echo ""
echo "🔍 查看数据："
echo "  • Prisma Studio: npx prisma studio"
echo "  • Supabase: 访问项目仪表板 → Table Editor"
echo "  • Neon: 访问项目控制台 → SQL Editor"
echo ""
echo "📚 更多信息："
echo "  查看 DATABASE_SETUP.md 获取详细文档"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
