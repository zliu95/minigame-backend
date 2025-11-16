# 故障排除指南

本文档提供了游戏排行榜管理后台常见问题的诊断和解决方案。

## 目录

- [快速诊断](#快速诊断)
- [HTTPS 重定向问题](#https-重定向问题)
- [启动问题](#启动问题)
- [数据库问题](#数据库问题)
- [认证问题](#认证问题)
- [API 问题](#api-问题)
- [性能问题](#性能问题)
- [部署问题](#部署问题)
- [监控和日志](#监控和日志)

## HTTPS 重定向问题

### 问题：本地开发时强制跳转 HTTPS

**症状：**
- 访问 `http://localhost:3000` 时自动跳转到 `https://localhost:3000`
- 浏览器显示 "This site can't provide a secure connection"
- 线上显示 301 timeout 错误

**原因：**
`next.config.ts` 中配置了强制 HTTPS 重定向

**解决方案：**

1. **已修复**：最新版本已经注释掉了强制 HTTPS 重定向
2. **清除浏览器缓存**：301 重定向会被浏览器缓存
   ```bash
   # Chrome: 打开开发者工具 > Network > 勾选 "Disable cache"
   # 或者使用隐私模式/无痕模式测试
   ```

3. **确认环境变量**：
   ```bash
   # 检查 .env.local 或 .env
   FORCE_HTTPS=false  # 确保设置为 false 或不设置
   NODE_ENV=development  # 开发环境
   ```

4. **重启开发服务器**：
   ```bash
   # 停止当前服务器
   # 重新启动
   npm run dev
   ```

5. **如果问题持续**：
   - 清除浏览器所有缓存和 Cookie
   - 尝试使用不同的浏览器
   - 检查 `next.config.ts` 中的 `redirects()` 函数是否返回空数组

### 问题：生产环境 HTTPS 配置

**推荐方案：**
在 Nginx/负载均衡器层面处理 HTTPS，而不是在应用层

**Nginx 配置示例：**
```nginx
# 参考 nginx/nginx.conf
server {
    listen 80;
    server_name your-domain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name your-domain.com;
    
    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;
    
    location / {
        proxy_pass http://localhost:3000;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

## 快速诊断

### 健康检查

首先运行健康检查来快速了解系统状态：

```bash
# 检查应用健康状态
curl -s http://localhost:3000/api/health | jq

# 预期响应
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

### 系统状态检查

```bash
# 检查进程状态
ps aux | grep node

# 检查端口占用
sudo netstat -tlnp | grep :3000

# 检查系统资源
free -h
df -h
```

## 启动问题

### 问题 1: 应用无法启动

#### 症状
```
Error: Cannot find module '@prisma/client'
```

#### 解决方案
```bash
# 重新生成 Prisma 客户端
npx prisma generate

# 重新安装依赖
rm -rf node_modules package-lock.json
npm install
```

### 问题 2: 端口被占用

#### 症状
```
Error: listen EADDRINUSE: address already in use :::3000
```

#### 解决方案
```bash
# 查找占用端口的进程
sudo lsof -i :3000

# 杀死占用进程
sudo kill -9 <PID>

# 或者使用不同端口
PORT=3001 npm start
```

### 问题 3: 环境变量缺失

#### 症状
```
Error: Missing required environment variable: DATABASE_URL
```

#### 解决方案
```bash
# 检查环境变量文件
ls -la .env*

# 复制环境变量模板
cp .env.example .env.local

# 验证必需的环境变量
node -e "
const required = ['DATABASE_URL', 'NEXTAUTH_SECRET', 'NEXTAUTH_URL'];
const missing = required.filter(v => !process.env[v]);
if (missing.length) {
  console.error('Missing:', missing);
} else {
  console.log('All required variables set');
}
"
```

### 问题 4: TypeScript 编译错误

#### 症状
```
Type error: Cannot find module '@/lib/db' or its corresponding type declarations
```

#### 解决方案
```bash
# 检查 TypeScript 配置
npx tsc --noEmit

# 重新构建
npm run build

# 检查路径映射
cat tsconfig.json | grep -A 5 "paths"
```

## 数据库问题

### 问题 1: 数据库连接失败

#### 症状
```
Error: P1001: Can't reach database server at `localhost:5432`
```

#### 诊断步骤
```bash
# 1. 检查数据库服务状态
sudo systemctl status postgresql

# 2. 检查数据库连接
psql $DATABASE_URL -c "SELECT version();"

# 3. 检查网络连接
telnet localhost 5432

# 4. 检查防火墙
sudo ufw status
```

#### 解决方案
```bash
# 启动 PostgreSQL 服务
sudo systemctl start postgresql
sudo systemctl enable postgresql

# 检查 PostgreSQL 配置
sudo nano /etc/postgresql/*/main/postgresql.conf
# 确保: listen_addresses = '*'

sudo nano /etc/postgresql/*/main/pg_hba.conf
# 添加: host all all 0.0.0.0/0 md5

# 重启服务
sudo systemctl restart postgresql
```

### 问题 2: 数据库迁移失败

#### 症状
```
Error: P3009: migrate found failed migration
```

#### 解决方案
```bash
# 查看迁移状态
npx prisma migrate status

# 重置迁移（开发环境）
npx prisma migrate reset

# 手动解决迁移冲突（生产环境）
npx prisma migrate resolve --applied "20241031000000_init"
npx prisma migrate deploy
```

### 问题 3: 数据库权限问题

#### 症状
```
Error: permission denied for table games
```

#### 解决方案
```sql
-- 连接到数据库
psql $DATABASE_URL

-- 检查用户权限
\du

-- 授予权限
GRANT ALL PRIVILEGES ON DATABASE game_leaderboard_admin TO your_user;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO your_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO your_user;
```

### 问题 4: 数据库性能问题

#### 症状
- 查询响应缓慢
- 连接超时

#### 诊断
```sql
-- 查看活跃连接
SELECT count(*) as active_connections 
FROM pg_stat_activity 
WHERE state = 'active';

-- 查看慢查询
SELECT query, mean_time, calls 
FROM pg_stat_statements 
ORDER BY mean_time DESC 
LIMIT 10;

-- 查看锁等待
SELECT * FROM pg_locks WHERE NOT granted;
```

#### 解决方案
```sql
-- 优化查询
EXPLAIN ANALYZE SELECT * FROM players WHERE game_id = 'xxx' ORDER BY score DESC;

-- 创建索引
CREATE INDEX CONCURRENTLY idx_players_game_score ON players(game_id, score DESC);

-- 更新统计信息
ANALYZE;
```

## 认证问题

### 问题 1: 登录失败

#### 症状
- 用户无法登录
- 显示"Invalid credentials"

#### 诊断步骤
```bash
# 1. 检查管理员账户
psql $DATABASE_URL -c "SELECT username FROM admins;"

# 2. 检查密码哈希
psql $DATABASE_URL -c "SELECT username, length(password) FROM admins;"

# 3. 测试密码验证
node -e "
const bcrypt = require('bcryptjs');
const hash = 'your_password_hash';
console.log(bcrypt.compareSync('your_password', hash));
"
```

#### 解决方案
```bash
# 重置管理员密码
node -e "
const bcrypt = require('bcryptjs');
const newPassword = 'NewPassword123!';
const hash = bcrypt.hashSync(newPassword, 12);
console.log('UPDATE admins SET password = \'' + hash + '\' WHERE username = \'admin\';');
" | psql $DATABASE_URL
```

### 问题 2: JWT 令牌问题

#### 症状
```
Error: JsonWebTokenError: invalid signature
```

#### 解决方案
```bash
# 检查 NEXTAUTH_SECRET
echo $NEXTAUTH_SECRET | wc -c  # 应该 >= 32

# 重新生成密钥
openssl rand -base64 32

# 清除浏览器 cookies
# 或者重启应用程序
```

### 问题 3: 会话过期

#### 症状
- 用户频繁被登出
- 会话无法保持

#### 解决方案
```javascript
// 检查 NextAuth 配置 (lib/auth.ts)
export const authOptions = {
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 天
  },
  jwt: {
    maxAge: 30 * 24 * 60 * 60, // 30 天
  },
}
```

## API 问题

### 问题 1: 外部 API 调用失败

#### 症状
```
Error: Request failed with status code 401
```

#### 诊断步骤
```bash
# 1. 检查 API 密钥
echo $WECHAT_APP_ID
echo $WECHAT_APP_SECRET

# 2. 测试网络连接
curl -I https://api.weixin.qq.com/sns/jscode2session

# 3. 测试 API 调用
curl -X GET "https://api.weixin.qq.com/sns/jscode2session?appid=$WECHAT_APP_ID&secret=$WECHAT_APP_SECRET&js_code=test&grant_type=authorization_code"
```

#### 解决方案
```bash
# 验证 API 密钥
# 1. 登录微信公众平台
# 2. 检查 App ID 和 App Secret
# 3. 确认 IP 白名单设置
# 4. 检查 API 权限
```

### 问题 2: CORS 错误

#### 症状
```
Access to fetch at 'http://localhost:3000/api/games' from origin 'http://localhost:3001' has been blocked by CORS policy
```

#### 解决方案
```bash
# 更新 ALLOWED_ORIGINS 环境变量
export ALLOWED_ORIGINS="http://localhost:3000,http://localhost:3001,https://your-domain.com"

# 或者在 middleware.ts 中配置
```

### 问题 3: 速率限制触发

#### 症状
```
Error: Too Many Requests (429)
```

#### 解决方案
```bash
# 检查速率限制配置
echo $RATE_LIMIT_MAX_REQUESTS
echo $RATE_LIMIT_WINDOW_MS

# 临时增加限制（开发环境）
export RATE_LIMIT_MAX_REQUESTS=1000

# 检查 Redis 中的限制记录
redis-cli -u $REDIS_URL
> KEYS rate_limit:*
> TTL rate_limit:your_ip
```

## 性能问题

### 问题 1: 响应时间慢

#### 诊断步骤
```bash
# 1. 检查系统资源
top
htop
iostat 1

# 2. 检查数据库性能
psql $DATABASE_URL -c "
SELECT schemaname,tablename,attname,n_distinct,correlation 
FROM pg_stats 
WHERE tablename = 'players';
"

# 3. 检查 Redis 性能
redis-cli -u $REDIS_URL --latency

# 4. 分析应用日志
grep "slow" logs/app.log
```

#### 解决方案
```bash
# 1. 优化数据库查询
# 添加索引
psql $DATABASE_URL -c "
CREATE INDEX CONCURRENTLY idx_players_game_platform_score 
ON players(game_id, platform, score DESC);
"

# 2. 启用查询缓存
# 在应用中实现 Redis 缓存

# 3. 优化 Node.js 性能
# 增加内存限制
node --max-old-space-size=4096 server.js
```

### 问题 2: 内存泄漏

#### 症状
- 内存使用持续增长
- 应用程序崩溃

#### 诊断
```bash
# 监控内存使用
while true; do
  ps aux | grep node | grep -v grep
  sleep 10
done

# 使用 Node.js 内存分析
node --inspect server.js
# 然后在 Chrome 中打开 chrome://inspect
```

#### 解决方案
```javascript
// 检查数据库连接是否正确关闭
// 在 API 路由中确保使用 try/finally
try {
  const result = await prisma.game.findMany();
  return result;
} finally {
  // Prisma 会自动管理连接
}

// 检查 Redis 连接
// 确保正确关闭连接
```

### 问题 3: 高 CPU 使用率

#### 诊断
```bash
# 查看 CPU 使用情况
top -p $(pgrep node)

# 使用 Node.js 性能分析
node --prof server.js
# 生成性能报告
node --prof-process isolate-*.log > profile.txt
```

## 部署问题

### 问题 1: Docker 构建失败

#### 症状
```
ERROR [builder 6/8] RUN npm run build
```

#### 解决方案
```bash
# 检查 Dockerfile
cat Dockerfile

# 本地测试构建
docker build -t game-leaderboard-admin .

# 查看构建日志
docker build --no-cache -t game-leaderboard-admin . 2>&1 | tee build.log
```

### 问题 2: 容器启动失败

#### 症状
```
Error: Container exits immediately
```

#### 诊断
```bash
# 查看容器日志
docker logs container_name

# 进入容器调试
docker run -it --entrypoint /bin/sh game-leaderboard-admin

# 检查环境变量
docker exec container_name env
```

### 问题 3: 负载均衡器健康检查失败

#### 症状
- 负载均衡器显示实例不健康
- 流量无法到达应用

#### 解决方案
```bash
# 检查健康检查端点
curl -f http://localhost:3000/api/health

# 检查防火墙规则
sudo ufw status

# 检查应用监听地址
netstat -tlnp | grep :3000
```

## 监控和日志

### 日志分析

#### 应用日志位置
```bash
# Docker 部署
docker-compose logs -f app

# 直接部署
tail -f logs/app.log

# PM2 部署
pm2 logs
```

#### 重要日志模式
```bash
# 错误日志
grep "ERROR" logs/app.log

# 数据库错误
grep "P[0-9][0-9][0-9][0-9]" logs/app.log

# API 错误
grep "API.*error" logs/app.log

# 认证错误
grep "auth.*fail" logs/app.log
```

### 性能监控

#### 系统监控脚本
```bash
#!/bin/bash
# monitor.sh

while true; do
    echo "=== $(date) ==="
    
    # CPU 和内存
    echo "CPU and Memory:"
    ps aux | grep node | grep -v grep | awk '{print $3, $4, $11}'
    
    # 数据库连接
    echo "Database connections:"
    psql $DATABASE_URL -c "SELECT count(*) FROM pg_stat_activity WHERE state = 'active';" -t
    
    # Redis 内存
    echo "Redis memory:"
    redis-cli -u $REDIS_URL info memory | grep used_memory_human
    
    echo "---"
    sleep 60
done
```

### 告警设置

#### 基本告警脚本
```bash
#!/bin/bash
# alerts.sh

# 检查应用是否运行
if ! curl -f http://localhost:3000/api/health > /dev/null 2>&1; then
    echo "ALERT: Application health check failed" | mail -s "App Down" admin@example.com
fi

# 检查磁盘空间
DISK_USAGE=$(df / | tail -1 | awk '{print $5}' | sed 's/%//')
if [ $DISK_USAGE -gt 80 ]; then
    echo "ALERT: Disk usage is ${DISK_USAGE}%" | mail -s "Disk Space" admin@example.com
fi

# 检查内存使用
MEMORY_USAGE=$(free | grep Mem | awk '{printf "%.0f", $3/$2 * 100.0}')
if [ $MEMORY_USAGE -gt 90 ]; then
    echo "ALERT: Memory usage is ${MEMORY_USAGE}%" | mail -s "Memory Usage" admin@example.com
fi
```

## 紧急恢复程序

### 应用恢复

```bash
#!/bin/bash
# emergency-recovery.sh

echo "🚨 Starting emergency recovery..."

# 1. 停止应用
docker-compose -f docker-compose.production.yml down || pm2 stop all

# 2. 检查系统资源
df -h
free -h

# 3. 清理临时文件
rm -rf /tmp/*
docker system prune -f

# 4. 恢复数据库（如果需要）
if [ -f "/backups/latest.sql" ]; then
    echo "Restoring database from backup..."
    psql $DATABASE_URL < /backups/latest.sql
fi

# 5. 重启应用
docker-compose -f docker-compose.production.yml up -d || pm2 start all

# 6. 验证恢复
sleep 30
curl -f http://localhost:3000/api/health || echo "❌ Recovery failed"

echo "✅ Emergency recovery completed"
```

### 数据恢复

```bash
#!/bin/bash
# data-recovery.sh

BACKUP_DIR="/backups"
LATEST_BACKUP=$(ls -t $BACKUP_DIR/*.sql | head -1)

echo "🔄 Restoring from: $LATEST_BACKUP"

# 1. 创建当前状态备份
pg_dump $DATABASE_URL > "$BACKUP_DIR/pre_recovery_$(date +%Y%m%d_%H%M%S).sql"

# 2. 恢复数据
psql $DATABASE_URL < "$LATEST_BACKUP"

# 3. 运行迁移
npm run db:migrate:production

echo "✅ Data recovery completed"
```

## 获取帮助

### 收集诊断信息

运行以下脚本收集系统信息：

```bash
#!/bin/bash
# collect-info.sh

echo "=== System Information ==="
uname -a
cat /etc/os-release

echo "=== Node.js Version ==="
node --version
npm --version

echo "=== Application Status ==="
curl -s http://localhost:3000/api/health | jq

echo "=== Environment Variables ==="
env | grep -E "(NODE_ENV|DATABASE_URL|REDIS_URL)" | sed 's/=.*/=***/'

echo "=== System Resources ==="
free -h
df -h

echo "=== Network ==="
netstat -tlnp | grep :3000

echo "=== Recent Logs ==="
tail -50 logs/app.log

echo "=== Database Status ==="
psql $DATABASE_URL -c "SELECT version();" 2>&1

echo "=== Redis Status ==="
redis-cli -u $REDIS_URL ping 2>&1
```

### 联系支持

在联系技术支持时，请提供：

1. 错误消息的完整文本
2. 系统诊断信息（运行上述脚本）
3. 重现问题的步骤
4. 环境信息（开发/测试/生产）
5. 最近的配置变更

---

**提示**: 定期运行健康检查和监控脚本可以帮助提前发现问题，避免严重故障。