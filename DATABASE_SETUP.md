# 数据库设置指南

本指南介绍如何在 Supabase 或 Neon 中创建和配置数据库。

## 目录

- [Supabase 设置](#supabase-设置)
- [Neon 设置](#neon-设置)
- [本地 PostgreSQL 设置](#本地-postgresql-设置)
- [数据库迁移](#数据库迁移)
- [常见问题](#常见问题)

---

## Supabase 设置

### 1. 创建 Supabase 项目

1. 访问 [Supabase](https://supabase.com)
2. 注册/登录账号
3. 点击 "New Project"
4. 填写项目信息：
   - **Name**: `game-leaderboard-admin`
   - **Database Password**: 设置一个强密码（保存好！）
   - **Region**: 选择离你最近的区域
   - **Pricing Plan**: 选择 Free 或 Pro

5. 等待项目创建（约 2 分钟）

### 2. 获取数据库连接字符串

1. 在项目仪表板，点击左侧 "Settings" → "Database"
2. 找到 "Connection string" 部分
3. 选择 "URI" 标签
4. 复制连接字符串，格式如下：
   ```
   postgresql://postgres:[YOUR-PASSWORD]@db.xxxxx.supabase.co:5432/postgres
   ```
5. 将 `[YOUR-PASSWORD]` 替换为你设置的密码

### 3. 配置环境变量

在项目根目录创建或编辑 `.env` 文件：

```env
# Supabase 数据库连接
DATABASE_URL="postgresql://postgres:your-password@db.xxxxx.supabase.co:5432/postgres?pgbouncer=true&connection_limit=1"

# 用于迁移的直连（不通过连接池）
DIRECT_URL="postgresql://postgres:your-password@db.xxxxx.supabase.co:5432/postgres"
```

**重要提示：**
- `DATABASE_URL`: 用于应用运行时（通过 PgBouncer 连接池）
- `DIRECT_URL`: 用于 Prisma 迁移（直连数据库）

### 4. 更新 Prisma Schema

编辑 `prisma/schema.prisma`：

```prisma
datasource db {
  provider  = "postgresql"
  url       = env("DATABASE_URL")
  directUrl = env("DIRECT_URL")
}
```

### 5. 运行数据库迁移

```bash
# 生成 Prisma Client
npx prisma generate

# 运行迁移（创建表结构）
npx prisma migrate deploy

# 或者在开发环境
npx prisma migrate dev
```

### 6. 创建初始数据

```bash
# 运行种子脚本（创建管理员账号）
npm run db:seed
```

默认管理员账号：
- 用户名: `admin`
- 密码: `admin123`

### 7. 验证设置

```bash
# 打开 Prisma Studio 查看数据
npx prisma studio

# 或者在 Supabase 仪表板查看
# Table Editor → 查看创建的表
```

---

## Neon 设置

### 1. 创建 Neon 项目

1. 访问 [Neon](https://neon.tech)
2. 注册/登录账号
3. 点击 "Create a project"
4. 填写项目信息：
   - **Project name**: `game-leaderboard-admin`
   - **Region**: 选择离你最近的区域
   - **PostgreSQL version**: 选择最新版本（推荐 16）

5. 项目创建完成

### 2. 获取数据库连接字符串

1. 在项目仪表板，点击 "Connection Details"
2. 选择 "Pooled connection" 标签
3. 复制连接字符串，格式如下：
   ```
   postgresql://username:password@ep-xxx.region.aws.neon.tech/neondb?sslmode=require
   ```

### 3. 配置环境变量

在项目根目录创建或编辑 `.env` 文件：

```env
# Neon 数据库连接（Pooled - 用于应用）
DATABASE_URL="postgresql://username:password@ep-xxx.region.aws.neon.tech/neondb?sslmode=require&pgbouncer=true&connect_timeout=15"

# Neon 直连（用于迁移）
DIRECT_URL="postgresql://username:password@ep-xxx.region.aws.neon.tech/neondb?sslmode=require"
```

**提示：** Neon 提供两种连接方式：
- **Pooled connection**: 用于应用（通过连接池）
- **Direct connection**: 用于迁移和管理操作

### 4. 更新 Prisma Schema

编辑 `prisma/schema.prisma`：

```prisma
datasource db {
  provider  = "postgresql"
  url       = env("DATABASE_URL")
  directUrl = env("DIRECT_URL")
}
```

### 5. 运行数据库迁移

```bash
# 生成 Prisma Client
npx prisma generate

# 运行迁移
npx prisma migrate deploy

# 或者在开发环境
npx prisma migrate dev
```

### 6. 创建初始数据

```bash
# 运行种子脚本
npm run db:seed
```

### 7. 验证设置

```bash
# 打开 Prisma Studio
npx prisma studio

# 或者在 Neon 控制台
# SQL Editor → 运行查询查看表
```

---

## 本地 PostgreSQL 设置

### 1. 安装 PostgreSQL

**macOS (使用 Homebrew):**
```bash
brew install postgresql@16
brew services start postgresql@16
```

**Ubuntu/Debian:**
```bash
sudo apt update
sudo apt install postgresql postgresql-contrib
sudo systemctl start postgresql
```

**Windows:**
下载并安装 [PostgreSQL](https://www.postgresql.org/download/windows/)

### 2. 创建数据库

```bash
# 连接到 PostgreSQL
psql postgres

# 创建数据库
CREATE DATABASE game_leaderboard_admin;

# 创建用户（可选）
CREATE USER gameadmin WITH PASSWORD 'your-password';

# 授权
GRANT ALL PRIVILEGES ON DATABASE game_leaderboard_admin TO gameadmin;

# 退出
\q
```

### 3. 配置环境变量

```env
DATABASE_URL="postgresql://gameadmin:your-password@localhost:5432/game_leaderboard_admin?schema=public"
```

### 4. 运行迁移

```bash
npx prisma generate
npx prisma migrate dev
npm run db:seed
```

---

## 数据库迁移

### 查看当前数据库结构

项目使用 Prisma 管理数据库结构，定义在 `prisma/schema.prisma`：

```prisma
// 管理员表
model Admin {
  id        String   @id @default(cuid())
  username  String   @unique
  password  String
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}

// 游戏表
model Game {
  id        String   @id @default(cuid())
  name      String
  shortName String   @unique
  isActive  Boolean  @default(true)
  players   Player[]
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}

// 玩家表
model Player {
  id           String   @id @default(cuid())
  gameId       String
  game         Game     @relation(fields: [gameId], references: [id], onDelete: Cascade)
  openid       String
  nickname     String
  avatarUrl    String?
  score        Float    @default(0)
  duration     Int      @default(0)
  detailsJson  Json?
  platform     Platform
  location     String?
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt

  @@unique([gameId, openid, platform])
  @@index([gameId, score])
  @@index([gameId, platform, score])
}

enum Platform {
  WECHAT
  DOUYIN
  IOS_APP
  ANDROID_APP
}
```

### 常用迁移命令

```bash
# 查看迁移状态
npx prisma migrate status

# 创建新迁移（开发环境）
npx prisma migrate dev --name your_migration_name

# 应用迁移（生产环境）
npx prisma migrate deploy

# 重置数据库（警告：删除所有数据）
npx prisma migrate reset

# 查看数据库
npx prisma studio
```

### 生产环境迁移

```bash
# 1. 备份数据库（重要！）
# Supabase: 在仪表板 Database → Backups
# Neon: 自动备份，可在控制台恢复

# 2. 运行迁移
npm run db:migrate:production

# 3. 验证
npx prisma studio
```

---

## 快速设置脚本

创建 `scripts/setup-database.sh`：

```bash
#!/bin/bash

echo "🗄️  数据库设置向导"
echo ""

# 检查环境变量
if [ -z "$DATABASE_URL" ]; then
    echo "❌ 错误: DATABASE_URL 未设置"
    echo "请先在 .env 文件中配置 DATABASE_URL"
    exit 1
fi

echo "✅ 找到 DATABASE_URL"
echo ""

# 生成 Prisma Client
echo "1️⃣ 生成 Prisma Client..."
npx prisma generate
echo ""

# 运行迁移
echo "2️⃣ 运行数据库迁移..."
npx prisma migrate deploy
echo ""

# 创建初始数据
echo "3️⃣ 创建初始管理员账号..."
npm run db:seed
echo ""

# 验证
echo "4️⃣ 验证数据库连接..."
npx prisma db execute --stdin <<EOF
SELECT 'Database connection successful!' as message;
EOF
echo ""

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ 数据库设置完成！"
echo ""
echo "默认管理员账号："
echo "  用户名: admin"
echo "  密码: admin123"
echo ""
echo "下一步："
echo "  1. 运行 'npm run dev' 启动开发服务器"
echo "  2. 访问 http://localhost:3000/login"
echo "  3. 使用默认账号登录"
echo ""
echo "查看数据："
echo "  运行 'npx prisma studio'"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
```

使用方法：

```bash
chmod +x scripts/setup-database.sh
./scripts/setup-database.sh
```

---

## 常见问题

### Q: Supabase 连接超时？

**A:** 检查连接字符串是否包含 `pgbouncer=true`：
```env
DATABASE_URL="postgresql://...?pgbouncer=true&connection_limit=1"
```

### Q: Neon 迁移失败？

**A:** 确保使用 `DIRECT_URL` 而不是 pooled connection：
```env
DIRECT_URL="postgresql://...?sslmode=require"
```

### Q: 如何查看创建的表？

**A:** 三种方法：
1. `npx prisma studio` - 可视化界面
2. Supabase/Neon 控制台 - Table Editor
3. 命令行：`psql $DATABASE_URL -c "\dt"`

### Q: 如何重置数据库？

**A:** 
```bash
# 警告：这会删除所有数据！
npx prisma migrate reset

# 然后重新创建数据
npm run db:seed
```

### Q: 如何备份数据？

**A:** 
- **Supabase**: 仪表板 → Database → Backups
- **Neon**: 自动备份，可在控制台恢复
- **本地**: `pg_dump $DATABASE_URL > backup.sql`

### Q: 如何修改数据库结构？

**A:** 
1. 编辑 `prisma/schema.prisma`
2. 运行 `npx prisma migrate dev --name your_change`
3. Prisma 会自动生成迁移 SQL

---

## 推荐配置

### 开发环境
- **本地 PostgreSQL** 或 **Supabase Free**
- 快速迭代，无需担心成本

### 生产环境
- **Supabase Pro** - 功能丰富，包含认证、存储等
- **Neon** - 专注数据库，自动扩展，按使用付费

### 性能优化
```env
# 连接池配置
DATABASE_URL="postgresql://...?pgbouncer=true&connection_limit=1&pool_timeout=10"

# SSL 配置（生产环境）
DATABASE_URL="postgresql://...?sslmode=require"
```

---

## 下一步

1. ✅ 设置数据库（Supabase/Neon/本地）
2. ✅ 运行迁移创建表结构
3. ✅ 创建初始管理员账号
4. 🚀 启动应用：`npm run dev`
5. 🔐 登录测试：http://localhost:3000/login

## 相关文档

- [QUICK_START.md](./QUICK_START.md) - 快速启动指南
- [ENVIRONMENT_VARIABLES.md](./ENVIRONMENT_VARIABLES.md) - 环境变量说明
- [DEPLOYMENT.md](./DEPLOYMENT.md) - 部署指南
- [Prisma 文档](https://www.prisma.io/docs)
