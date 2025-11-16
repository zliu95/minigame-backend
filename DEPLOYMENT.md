# 游戏排行榜管理后台 - 部署指南

本文档提供了游戏排行榜管理后台的完整部署指南，包括开发环境、测试环境和生产环境的部署说明。

## 目录

- [系统要求](#系统要求)
- [环境变量配置](#环境变量配置)
- [数据库设置](#数据库设置)
- [部署方式](#部署方式)
- [监控和维护](#监控和维护)
- [故障排除](#故障排除)
- [安全注意事项](#安全注意事项)

## 系统要求

### 最低系统要求

- **Node.js**: 18.0.0 或更高版本
- **PostgreSQL**: 13.0 或更高版本
- **Redis**: 6.0 或更高版本
- **内存**: 最少 2GB RAM
- **存储**: 最少 10GB 可用空间

### 推荐生产环境配置

- **CPU**: 4 核心或更多
- **内存**: 8GB RAM 或更多
- **存储**: 50GB SSD 或更多
- **网络**: 稳定的互联网连接
- **操作系统**: Ubuntu 20.04 LTS 或 CentOS 8

## 环境变量配置

### 必需的环境变量

创建 `.env.local` 文件并配置以下变量：

```bash
# 数据库配置
DATABASE_URL="postgresql://username:password@host:5432/database_name"

# NextAuth.js 配置
NEXTAUTH_SECRET="your-secret-key-minimum-32-characters-long"
NEXTAUTH_URL="https://your-domain.com"

# 外部 API 配置
WECHAT_APP_ID="your-wechat-app-id"
WECHAT_APP_SECRET="your-wechat-app-secret"
DOUYIN_APP_ID="your-douyin-app-id"
DOUYIN_APP_SECRET="your-douyin-app-secret"

# Redis 配置
REDIS_URL="redis://host:6379"

# 安全配置
ENCRYPTION_KEY="your-32-character-encryption-key-here"
INTERNAL_API_KEY="your-internal-api-key"
GAME_CLIENT_API_KEY="your-game-client-api-key"
```

### 环境变量详细说明

| 变量名 | 描述 | 示例 | 必需 |
|--------|------|------|------|
| `DATABASE_URL` | PostgreSQL 数据库连接字符串 | `postgresql://user:pass@host:5432/db` | ✅ |
| `NEXTAUTH_SECRET` | NextAuth.js 加密密钥 | `your-secret-key-32-chars-minimum` | ✅ |
| `NEXTAUTH_URL` | 应用程序的完整 URL | `https://your-domain.com` | ✅ |
| `WECHAT_APP_ID` | 微信小程序 App ID | `wx1234567890abcdef` | ✅ |
| `WECHAT_APP_SECRET` | 微信小程序 App Secret | `abcdef1234567890` | ✅ |
| `DOUYIN_APP_ID` | 抖音小程序 App ID | `tt1234567890abcdef` | ✅ |
| `DOUYIN_APP_SECRET` | 抖音小程序 App Secret | `abcdef1234567890` | ✅ |
| `REDIS_URL` | Redis 连接字符串 | `redis://localhost:6379` | ✅ |
| `ENCRYPTION_KEY` | 数据加密密钥（32字符） | `your-32-char-encryption-key-here` | ✅ |
| `INTERNAL_API_KEY` | 内部 API 调用密钥 | `your-internal-api-key` | ✅ |
| `GAME_CLIENT_API_KEY` | 游戏客户端 API 密钥 | `your-game-client-api-key` | ✅ |
| `RATE_LIMIT_WINDOW_MS` | 速率限制时间窗口（毫秒） | `900000` | ❌ |
| `RATE_LIMIT_MAX_REQUESTS` | 速率限制最大请求数 | `1000` | ❌ |
| `LOG_LEVEL` | 日志级别 | `info` | ❌ |
| `NODE_ENV` | 运行环境 | `production` | ✅ |

## 数据库设置

### PostgreSQL 安装和配置

#### Ubuntu/Debian

```bash
# 安装 PostgreSQL
sudo apt update
sudo apt install postgresql postgresql-contrib

# 启动服务
sudo systemctl start postgresql
sudo systemctl enable postgresql

# 创建数据库和用户
sudo -u postgres psql
CREATE DATABASE game_leaderboard_admin;
CREATE USER your_username WITH PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE game_leaderboard_admin TO your_username;
\q
```

#### CentOS/RHEL

```bash
# 安装 PostgreSQL
sudo dnf install postgresql postgresql-server postgresql-contrib

# 初始化数据库
sudo postgresql-setup --initdb

# 启动服务
sudo systemctl start postgresql
sudo systemctl enable postgresql
```

### Redis 安装和配置

#### Ubuntu/Debian

```bash
# 安装 Redis
sudo apt update
sudo apt install redis-server

# 配置 Redis
sudo nano /etc/redis/redis.conf
# 设置密码: requirepass your_password

# 重启服务
sudo systemctl restart redis-server
sudo systemctl enable redis-server
```

### 数据库迁移

```bash
# 生成 Prisma 客户端
npx prisma generate

# 运行数据库迁移
npm run db:migrate:production

# 运行生产环境种子数据（可选）
npm run db:seed:production
```

## 部署方式

### 方式一：Docker 部署（推荐）

#### 1. 准备环境文件

```bash
# 复制环境变量模板
cp .env.production .env.local

# 编辑环境变量
nano .env.local
```

#### 2. 构建和运行

```bash
# 使用 Docker Compose 部署
docker-compose -f docker-compose.production.yml up -d

# 查看服务状态
docker-compose -f docker-compose.production.yml ps

# 查看日志
docker-compose -f docker-compose.production.yml logs -f app
```

#### 3. 运行数据库迁移

```bash
# 进入应用容器
docker-compose -f docker-compose.production.yml exec app sh

# 运行迁移
npm run db:migrate:production
```

### 方式二：直接部署

#### 1. 安装依赖

```bash
# 安装 Node.js 依赖
npm ci --only=production

# 生成 Prisma 客户端
npx prisma generate
```

#### 2. 构建应用

```bash
# 构建生产版本
npm run build:production
```

#### 3. 运行数据库迁移

```bash
# 运行迁移脚本
npm run db:migrate:production
```

#### 4. 启动应用

```bash
# 启动生产服务器
npm run start:production
```

### 方式三：使用部署脚本

```bash
# 设置环境变量
export NODE_ENV=production
export DATABASE_URL="your-database-url"
export NEXTAUTH_SECRET="your-secret"

# 运行部署脚本
./scripts/deploy-production.sh
```

## 监控和维护

### 健康检查

应用提供了健康检查端点：

```bash
# 检查应用健康状态
curl http://localhost:3000/api/health

# 响应示例
{
  "status": "ok",
  "timestamp": "2024-11-01T12:00:00.000Z",
  "uptime": 3600,
  "environment": "production",
  "version": "1.0.0",
  "checks": {
    "database": "healthy",
    "redis": "healthy"
  }
}
```

### 日志管理

#### 查看应用日志

```bash
# Docker 部署
docker-compose -f docker-compose.production.yml logs -f app

# 直接部署
tail -f logs/app.log
```

#### 日志轮转配置

创建 `/etc/logrotate.d/game-leaderboard-admin`：

```
/path/to/app/logs/*.log {
    daily
    missingok
    rotate 30
    compress
    delaycompress
    notifempty
    create 644 nodejs nodejs
    postrotate
        systemctl reload game-leaderboard-admin
    endscript
}
```

### 数据库维护

#### 定期备份

```bash
# 创建备份脚本
cat > /usr/local/bin/backup-db.sh << 'EOF'
#!/bin/bash
BACKUP_DIR="/backups"
DATE=$(date +%Y%m%d_%H%M%S)
pg_dump $DATABASE_URL > "$BACKUP_DIR/backup_$DATE.sql"
# 保留最近 30 天的备份
find $BACKUP_DIR -name "backup_*.sql" -mtime +30 -delete
EOF

chmod +x /usr/local/bin/backup-db.sh

# 添加到 crontab
echo "0 2 * * * /usr/local/bin/backup-db.sh" | crontab -
```

#### 性能监控

```bash
# 监控数据库连接
SELECT count(*) as active_connections 
FROM pg_stat_activity 
WHERE state = 'active';

# 监控慢查询
SELECT query, mean_time, calls 
FROM pg_stat_statements 
ORDER BY mean_time DESC 
LIMIT 10;
```

### 系统监控

#### 使用 PM2（非 Docker 部署）

```bash
# 安装 PM2
npm install -g pm2

# 创建 PM2 配置文件
cat > ecosystem.config.js << 'EOF'
module.exports = {
  apps: [{
    name: 'game-leaderboard-admin',
    script: 'npm',
    args: 'run start:production',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production'
    },
    error_file: './logs/pm2-error.log',
    out_file: './logs/pm2-out.log',
    log_file: './logs/pm2-combined.log',
    time: true
  }]
};
EOF

# 启动应用
pm2 start ecosystem.config.js

# 保存 PM2 配置
pm2 save
pm2 startup
```

## 故障排除

### 常见问题和解决方案

#### 1. 数据库连接失败

**症状**: 应用启动时报数据库连接错误

**解决方案**:
```bash
# 检查数据库服务状态
sudo systemctl status postgresql

# 检查数据库连接
psql $DATABASE_URL -c "SELECT 1;"

# 检查防火墙设置
sudo ufw status
```

#### 2. Redis 连接失败

**症状**: 缓存功能不工作，Redis 相关错误

**解决方案**:
```bash
# 检查 Redis 服务状态
sudo systemctl status redis-server

# 测试 Redis 连接
redis-cli -u $REDIS_URL ping

# 检查 Redis 配置
sudo nano /etc/redis/redis.conf
```

#### 3. 应用启动失败

**症状**: 应用无法启动或立即退出

**解决方案**:
```bash
# 检查环境变量
env | grep -E "(DATABASE_URL|NEXTAUTH_SECRET|NODE_ENV)"

# 检查端口占用
sudo netstat -tlnp | grep :3000

# 查看详细错误日志
npm run start:production 2>&1 | tee debug.log
```

#### 4. 外部 API 调用失败

**症状**: 微信/抖音登录不工作

**解决方案**:
```bash
# 测试网络连接
curl -I https://api.weixin.qq.com
curl -I https://developer.toutiao.com

# 检查 API 密钥配置
echo $WECHAT_APP_ID
echo $DOUYIN_APP_ID

# 查看 API 调用日志
grep "external-api" logs/app.log
```

#### 5. 性能问题

**症状**: 应用响应缓慢

**解决方案**:
```bash
# 检查系统资源
top
free -h
df -h

# 检查数据库性能
SELECT * FROM pg_stat_activity WHERE state = 'active';

# 检查 Redis 内存使用
redis-cli info memory

# 分析慢查询
SELECT query, mean_time FROM pg_stat_statements ORDER BY mean_time DESC LIMIT 5;
```

### 日志分析

#### 应用日志位置

- Docker 部署: `docker-compose logs app`
- 直接部署: `./logs/app.log`
- PM2 部署: `./logs/pm2-combined.log`

#### 重要日志关键词

- `ERROR`: 错误信息
- `WARN`: 警告信息
- `DATABASE`: 数据库相关
- `AUTH`: 认证相关
- `API`: API 调用相关

### 紧急恢复程序

#### 1. 应用回滚

```bash
# Docker 部署回滚
docker-compose -f docker-compose.production.yml down
docker-compose -f docker-compose.production.yml up -d --force-recreate

# 直接部署回滚
git checkout previous-stable-tag
npm run build:production
pm2 restart all
```

#### 2. 数据库恢复

```bash
# 从备份恢复数据库
psql $DATABASE_URL < /backups/backup_YYYYMMDD_HHMMSS.sql

# 重新运行迁移
npm run db:migrate:production
```

## 安全注意事项

### 1. 环境变量安全

- ✅ 使用强密码和随机密钥
- ✅ 定期轮换 API 密钥
- ✅ 不要在代码中硬编码敏感信息
- ✅ 使用环境变量管理工具（如 HashiCorp Vault）

### 2. 网络安全

- ✅ 使用 HTTPS（SSL/TLS）
- ✅ 配置防火墙规则
- ✅ 启用速率限制
- ✅ 使用 CDN 和 DDoS 防护

### 3. 数据库安全

- ✅ 使用强密码
- ✅ 限制数据库访问权限
- ✅ 启用数据库审计日志
- ✅ 定期更新数据库软件

### 4. 应用安全

- ✅ 定期更新依赖包
- ✅ 启用安全头部
- ✅ 实施输入验证
- ✅ 使用 CSRF 保护

### 5. 监控和审计

- ✅ 启用访问日志
- ✅ 监控异常活动
- ✅ 设置安全告警
- ✅ 定期安全审计

## 性能优化建议

### 1. 数据库优化

```sql
-- 创建必要的索引
CREATE INDEX CONCURRENTLY idx_players_game_score ON players(game_id, score DESC);
CREATE INDEX CONCURRENTLY idx_players_platform_score ON players(game_id, platform, score DESC);

-- 配置连接池
-- 在 DATABASE_URL 中添加: ?connection_limit=20&pool_timeout=10
```

### 2. Redis 缓存优化

```bash
# Redis 配置优化
maxmemory 2gb
maxmemory-policy allkeys-lru
save 900 1
save 300 10
save 60 10000
```

### 3. 应用优化

- 启用 gzip 压缩
- 使用 CDN 加速静态资源
- 实施数据库查询缓存
- 优化图片和静态资源

## 联系支持

如果遇到部署问题，请：

1. 查看本文档的故障排除部分
2. 检查应用日志文件
3. 收集相关错误信息和系统环境信息
4. 联系技术支持团队

---

**注意**: 本文档会随着应用更新而更新，请确保使用最新版本的部署文档。