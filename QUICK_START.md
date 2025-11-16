# 快速启动指南

## 本地开发环境快速启动

### 1. 安装依赖

```bash
npm install
```

### 2. 配置环境变量

复制示例配置文件：

```bash
cp .env.example .env.local
```

编辑 `.env.local`，最少需要配置：

```env
# 数据库连接（必需）
DATABASE_URL="postgresql://username:password@localhost:5432/game_leaderboard_admin?schema=public"

# 认证密钥（必需）
NEXTAUTH_SECRET="your-secret-key-here"
NEXTAUTH_URL="http://localhost:3000"

# Redis（可选，不配置也能运行）
# REDIS_URL="redis://localhost:6379"
```

### 3. 初始化数据库

```bash
# 生成 Prisma Client
npx prisma generate

# 运行数据库迁移
npx prisma migrate dev

# 创建初始管理员账号（可选）
npm run db:seed
```

默认管理员账号：
- 用户名: `admin`
- 密码: `admin123`

### 4. 启动开发服务器

```bash
npm run dev
```

访问 http://localhost:3000

### 5. 验证安装

访问健康检查端点：

```bash
curl http://localhost:3000/api/health
```

预期响应：
```json
{
  "status": "ok",
  "checks": {
    "database": "healthy",
    "redis": "not_configured"
  }
}
```

## 常见问题

### Q: 启动时提示 HTTPS 错误？

A: 确保 `.env.local` 中设置：
```env
NODE_ENV=development
NEXTAUTH_URL="http://localhost:3000"  # 注意是 http 不是 https
```

清除浏览器缓存后重试。

### Q: 数据库连接失败？

A: 检查：
1. PostgreSQL 是否已启动
2. 数据库是否已创建
3. 用户名密码是否正确
4. 端口是否正确（默认 5432）

### Q: Redis 未配置会影响使用吗？

A: 不会。Redis 是可选的性能优化项，不配置也能正常运行，只是没有缓存加速。

### Q: 如何创建新的管理员账号？

A: 运行种子脚本或直接操作数据库：

```bash
# 方法1：使用种子脚本
npm run db:seed

# 方法2：使用 Prisma Studio
npx prisma studio
```

## 生产环境部署

参考 [DEPLOYMENT.md](./DEPLOYMENT.md) 获取详细的生产环境部署指南。

## 下一步

- 📖 阅读 [README.md](./README.md) 了解完整功能
- 🔧 查看 [TROUBLESHOOTING.md](./TROUBLESHOOTING.md) 解决常见问题
- 🔒 阅读 [SECURITY.md](./SECURITY.md) 了解安全最佳实践
- 📝 查看 [ENVIRONMENT_VARIABLES.md](./ENVIRONMENT_VARIABLES.md) 了解所有配置选项
