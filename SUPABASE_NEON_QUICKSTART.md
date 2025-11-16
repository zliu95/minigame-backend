# Supabase & Neon 快速配置指南

## 🚀 5 分钟快速开始

### 选项 A: Supabase（推荐新手）

#### 1. 创建项目（2 分钟）

1. 访问 https://supabase.com
2. 点击 "Start your project"
3. 使用 GitHub 登录
4. 点击 "New Project"
5. 填写：
   - Name: `game-leaderboard`
   - Database Password: `your-strong-password`（记住它！）
   - Region: 选择最近的（如 `Northeast Asia (Tokyo)`）
6. 点击 "Create new project"
7. 等待 ~2 分钟

#### 2. 获取连接字符串（1 分钟）

1. 项目创建完成后，点击左侧 "Settings" ⚙️
2. 点击 "Database"
3. 滚动到 "Connection string" 部分
4. 选择 "URI" 标签
5. 复制连接字符串（类似这样）：
   ```
   postgresql://postgres.xxxxxxxxxxxxx:your-password@aws-0-ap-northeast-1.pooler.supabase.com:5432/postgres
   ```

#### 3. 配置项目（1 分钟）

在项目根目录创建 `.env` 文件：

```bash
# 复制模板
cp .env.example .env

# 编辑 .env 文件
nano .env  # 或使用你喜欢的编辑器
```

添加以下内容（替换为你的实际值）：

```env
# Supabase 数据库
DATABASE_URL="postgresql://postgres.xxxxx:your-password@aws-0-ap-northeast-1.pooler.supabase.com:5432/postgres?pgbouncer=true&connection_limit=1"

# 直连（用于迁移）
DIRECT_URL="postgresql://postgres.xxxxx:your-password@aws-0-ap-northeast-1.pooler.supabase.com:6543/postgres"

# 其他必需配置
NEXTAUTH_SECRET="your-random-secret-key-here"
NEXTAUTH_URL="http://localhost:3000"
```

**重要提示：**
- Pooled connection (端口 5432): 用于应用运行
- Direct connection (端口 6543): 用于数据库迁移

#### 4. 设置数据库（1 分钟）

```bash
# 一键设置
npm run db:setup
```

这个命令会：
- ✅ 生成 Prisma Client
- ✅ 创建所有表结构
- ✅ 创建默认管理员账号
- ✅ 验证连接

#### 5. 启动应用

```bash
npm run dev
```

访问 http://localhost:3000/login
- 用户名: `admin`
- 密码: `admin123`

---

### 选项 B: Neon（推荐进阶用户）

#### 1. 创建项目（1 分钟）

1. 访问 https://neon.tech
2. 点击 "Sign up" 使用 GitHub 登录
3. 点击 "Create a project"
4. 填写：
   - Project name: `game-leaderboard`
   - Region: 选择最近的
   - PostgreSQL version: 16（推荐）
5. 点击 "Create project"
6. 立即创建完成！

#### 2. 获取连接字符串（30 秒）

1. 项目创建后，自动显示连接信息
2. 或点击 "Connection Details"
3. 复制两个连接字符串：

**Pooled connection** (用于应用):
```
postgresql://username:password@ep-xxx-xxx.us-east-2.aws.neon.tech/neondb?sslmode=require
```

**Direct connection** (用于迁移):
```
postgresql://username:password@ep-xxx-xxx.us-east-2.aws.neon.tech/neondb?sslmode=require&options=endpoint%3Dep-xxx-xxx
```

#### 3. 配置项目（1 分钟）

创建 `.env` 文件：

```env
# Neon 数据库（Pooled）
DATABASE_URL="postgresql://username:password@ep-xxx.us-east-2.aws.neon.tech/neondb?sslmode=require&pgbouncer=true&connect_timeout=15"

# Neon 直连（用于迁移）
DIRECT_URL="postgresql://username:password@ep-xxx.us-east-2.aws.neon.tech/neondb?sslmode=require"

# 其他配置
NEXTAUTH_SECRET="your-random-secret-key-here"
NEXTAUTH_URL="http://localhost:3000"
```

#### 4. 设置数据库（1 分钟）

```bash
npm run db:setup
```

#### 5. 启动应用

```bash
npm run dev
```

---

## 📊 对比：Supabase vs Neon

| 特性 | Supabase | Neon |
|------|----------|------|
| **免费额度** | 500MB 数据库 | 512MB 存储 |
| | 2GB 带宽 | 3 个项目 |
| | 无限 API 请求 | 自动休眠 |
| **启动速度** | ~2 分钟 | 即时 |
| **额外功能** | 认证、存储、实时 | 专注数据库 |
| **自动扩展** | 手动升级 | 自动扩展 |
| **价格** | $25/月起 | $19/月起 |
| **适合** | 全栈应用 | 纯数据库需求 |

**推荐：**
- 🆕 新手 → Supabase（功能丰富，文档完善）
- 💰 预算有限 → Neon（按使用付费）
- 🚀 需要快速扩展 → Neon（自动扩展）
- 🔐 需要认证等功能 → Supabase（内置功能）

---

## 🔍 验证设置

### 1. 检查数据库连接

```bash
# 测试连接
npx prisma db execute --stdin <<EOF
SELECT version();
EOF
```

### 2. 查看创建的表

```bash
# 打开 Prisma Studio
npx prisma studio
```

或者：

**Supabase:**
1. 访问项目仪表板
2. 点击 "Table Editor"
3. 查看 `Admin`, `Game`, `Player` 表

**Neon:**
1. 访问项目控制台
2. 点击 "SQL Editor"
3. 运行：`SELECT * FROM "Admin";`

### 3. 测试应用

```bash
# 启动
npm run dev

# 测试健康检查
curl http://localhost:3000/api/health

# 应该返回：
# {"status":"ok","checks":{"database":"healthy",...}}
```

---

## 🛠️ 常用命令

```bash
# 设置数据库（首次）
npm run db:setup

# 查看数据
npx prisma studio

# 重置数据库（警告：删除所有数据）
npm run db:reset

# 创建新迁移
npx prisma migrate dev --name your_change

# 生产环境迁移
npm run db:migrate:production
```

---

## ❓ 常见问题

### Q: 连接超时怎么办？

**Supabase:**
```env
# 确保使用 pooler 端口和参数
DATABASE_URL="...?pgbouncer=true&connection_limit=1"
```

**Neon:**
```env
# 添加超时参数
DATABASE_URL="...?connect_timeout=15"
```

### Q: 迁移失败？

**原因：** 使用了连接池（pooled connection）

**解决：** 确保设置了 `DIRECT_URL`

```env
# Supabase - 使用端口 6543
DIRECT_URL="postgresql://...@...supabase.com:6543/postgres"

# Neon - 使用 direct connection
DIRECT_URL="postgresql://...?sslmode=require"
```

### Q: 如何查看日志？

**Supabase:**
1. 项目仪表板 → Logs
2. 选择 "Postgres Logs"

**Neon:**
1. 项目控制台 → Monitoring
2. 查看查询统计

### Q: 如何备份数据？

**Supabase:**
- 自动备份（Pro 计划）
- 手动：Database → Backups → Create backup

**Neon:**
- 自动备份（所有计划）
- 恢复：Branches → Restore from backup

---

## 🎯 下一步

1. ✅ 数据库已设置
2. ✅ 应用可以运行
3. 🔐 修改默认管理员密码
4. 📝 阅读 [API 文档](./README.md#api-接口)
5. 🚀 开始开发！

---

## 📚 更多资源

- [DATABASE_SETUP.md](./DATABASE_SETUP.md) - 详细设置指南
- [QUICK_START.md](./QUICK_START.md) - 应用快速启动
- [Supabase 文档](https://supabase.com/docs)
- [Neon 文档](https://neon.tech/docs)
- [Prisma 文档](https://www.prisma.io/docs)

---

## 💡 提示

- 🔒 不要提交 `.env` 文件到 Git
- 🔑 生产环境使用强密码
- 📊 定期备份数据库
- 🚀 生产环境使用 `DIRECT_URL` 进行迁移
- 💰 监控使用量避免超出免费额度
