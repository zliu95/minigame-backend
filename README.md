# 游戏排行榜管理后台

一个基于 Next.js 14 的全栈游戏排行榜管理系统，支持多平台玩家认证和实时排行榜管理。

## 🚀 功能特性

- **🔐 管理员认证**: 安全的登录系统和会话管理
- **🎮 游戏管理**: 创建、编辑和管理游戏信息
- **📊 排行榜管理**: 实时排行榜数据查看和管理
- **🌐 多平台支持**: 支持微信小程序、抖音小程序、iOS App
- **⚡ 高性能**: Redis 缓存和数据库优化
- **🛡️ 安全加固**: 完整的安全措施和数据保护
- **📈 数据分析**: 用户统计和平台分布分析

## 🛠️ 技术栈

- **前端**: Next.js 14, React 18, TypeScript, Tailwind CSS
- **后端**: Next.js API Routes, Prisma ORM
- **数据库**: PostgreSQL
- **缓存**: Redis
- **认证**: NextAuth.js
- **部署**: Docker, Docker Compose

## 📋 系统要求

- Node.js 18.0.0+
- PostgreSQL 13.0+
- Redis 6.0+
- 2GB+ RAM (推荐 8GB)
- 10GB+ 存储空间

## 🚀 快速开始

### 1. 克隆项目

```bash
git clone <repository-url>
cd game-leaderboard-admin
```

### 2. 安装依赖

```bash
npm install
```

### 3. 环境配置

```bash
# 复制环境变量模板
cp .env.example .env.local

# 编辑环境变量
nano .env.local
```

必需的环境变量：
- `DATABASE_URL`: PostgreSQL 连接字符串
- `NEXTAUTH_SECRET`: NextAuth.js 密钥 (32+ 字符)
- `NEXTAUTH_URL`: 应用程序 URL
- `WECHAT_APP_ID` / `WECHAT_APP_SECRET`: 微信小程序配置
- `DOUYIN_APP_ID` / `DOUYIN_APP_SECRET`: 抖音小程序配置
- `REDIS_URL`: Redis 连接字符串
- `ENCRYPTION_KEY`: 数据加密密钥 (32 字符)

### 4. 数据库设置

```bash
# 生成 Prisma 客户端
npx prisma generate

# 运行数据库迁移
npx prisma migrate dev

# 运行种子数据
npm run db:seed
```

### 5. 启动开发服务器

```bash
npm run dev
```

访问 [http://localhost:3000](http://localhost:3000) 查看应用。

默认管理员账户：
- 用户名: `admin`
- 密码: `admin123`

## 📚 文档

- [📖 部署指南](./DEPLOYMENT.md) - 完整的部署说明
- [🔧 环境变量配置](./ENVIRONMENT_VARIABLES.md) - 详细的环境变量说明
- [🔍 故障排除](./TROUBLESHOOTING.md) - 常见问题和解决方案
- [🛡️ 安全说明](./SECURITY.md) - 安全配置和最佳实践

## 🐳 Docker 部署

### 开发环境

```bash
docker-compose up -d
```

### 生产环境

```bash
# 配置生产环境变量
cp .env.production .env.local

# 启动生产环境
docker-compose -f docker-compose.production.yml up -d

# 运行数据库迁移
docker-compose -f docker-compose.production.yml exec app npm run db:migrate:production
```

## 📊 API 文档

### 认证 API

- `POST /api/auth/login` - 管理员登录
- `POST /api/players/auth` - 玩家身份验证

### 游戏管理 API

- `GET /api/games` - 获取游戏列表
- `POST /api/games` - 创建游戏
- `PUT /api/games/[id]` - 更新游戏
- `DELETE /api/games/[id]` - 删除游戏

### 排行榜 API

- `GET /api/leaderboards/[gameId]` - 获取排行榜
- `POST /api/players/score` - 更新玩家分数

### 分析 API

- `GET /api/analytics/overview` - 获取统计概览
- `GET /api/admin/db-stats` - 数据库统计

## 🔧 开发脚本

```bash
# 开发
npm run dev                    # 启动开发服务器
npm run build                  # 构建生产版本
npm run start                  # 启动生产服务器

# 代码质量
npm run lint                   # 运行 ESLint
npm run lint:fix              # 修复 ESLint 错误
npm run format                 # 格式化代码
npm run type-check            # TypeScript 类型检查

# 数据库
npm run db:migrate            # 运行数据库迁移
npm run db:seed               # 运行种子数据
npm run db:studio             # 打开 Prisma Studio
npm run db:reset              # 重置数据库

# 生产部署
npm run build:production      # 生产环境构建
npm run start:production      # 生产环境启动
npm run db:migrate:production # 生产环境数据库迁移
npm run deploy:check          # 部署前检查
```

## 🏗️ 项目结构

```
game-leaderboard-admin/
├── app/                      # Next.js App Router
│   ├── (auth)/              # 认证路由组
│   ├── (dashboard)/         # 管理面板路由组
│   ├── api/                 # API 路由
│   └── globals.css          # 全局样式
├── components/              # React 组件
│   ├── ui/                  # 基础 UI 组件
│   ├── forms/               # 表单组件
│   └── charts/              # 图表组件
├── lib/                     # 工具库
│   ├── auth.ts              # 认证配置
│   ├── db.ts                # 数据库连接
│   └── validations.ts       # 数据验证
├── prisma/                  # Prisma 配置
│   ├── schema.prisma        # 数据库模式
│   └── migrations/          # 数据库迁移
├── scripts/                 # 部署脚本
├── types/                   # TypeScript 类型
└── middleware.ts            # Next.js 中间件
```

## 🔒 安全特性

- JWT 令牌认证
- 密码哈希加密
- CSRF 保护
- XSS 防护
- 速率限制
- 输入验证
- 安全头部
- 数据加密

## 📈 性能优化

- Redis 缓存
- 数据库索引优化
- 查询优化
- 图片优化
- 代码分割
- 静态资源缓存

## 🧪 测试

```bash
# 运行测试
npm test

# 运行测试覆盖率
npm run test:coverage

# 运行 E2E 测试
npm run test:e2e
```

## 📊 监控

### 健康检查

```bash
curl http://localhost:3000/api/health
```

### 日志查看

```bash
# Docker 部署
docker-compose logs -f app

# 直接部署
tail -f logs/app.log
```

## 🤝 贡献指南

1. Fork 项目
2. 创建功能分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 打开 Pull Request

## 📄 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情。

## 🆘 获取帮助

- 📖 查看 [故障排除指南](./TROUBLESHOOTING.md)
- 🐛 [报告问题](https://github.com/your-repo/issues)
- 💬 [讨论区](https://github.com/your-repo/discussions)

## 🔄 更新日志

查看 [CHANGELOG.md](CHANGELOG.md) 了解版本更新信息。

---

**注意**: 这是一个生产就绪的应用程序。在部署到生产环境之前，请确保：

1. ✅ 更改所有默认密码和密钥
2. ✅ 配置适当的环境变量
3. ✅ 设置数据库备份
4. ✅ 配置监控和日志
5. ✅ 进行安全审计
