# 环境变量配置指南

本文档详细说明了游戏排行榜管理后台所需的所有环境变量配置。

## 环境变量分类

### 🔐 必需的安全变量

这些变量对于应用程序的安全运行至关重要，必须在所有环境中正确配置。

#### `NEXTAUTH_SECRET`
- **描述**: NextAuth.js 用于加密 JWT 令牌和会话的密钥
- **类型**: 字符串
- **要求**: 最少 32 个字符的随机字符串
- **示例**: `"your-secret-key-minimum-32-characters-long"`
- **生成方法**: 
  ```bash
  openssl rand -base64 32
  ```

#### `ENCRYPTION_KEY`
- **描述**: 用于加密敏感数据的密钥
- **类型**: 字符串
- **要求**: 恰好 32 个字符
- **示例**: `"your-32-character-encryption-key"`
- **生成方法**:
  ```bash
  openssl rand -hex 16
  ```

#### `INTERNAL_API_KEY`
- **描述**: 服务器内部 API 调用的认证密钥
- **类型**: 字符串
- **要求**: 强随机字符串
- **示例**: `"internal-api-key-for-server-calls"`

#### `GAME_CLIENT_API_KEY`
- **描述**: 游戏客户端调用 API 的认证密钥
- **类型**: 字符串
- **要求**: 强随机字符串
- **示例**: `"game-client-api-key-for-games"`

### 🗄️ 数据库配置

#### `DATABASE_URL`
- **描述**: PostgreSQL 数据库连接字符串
- **类型**: 连接字符串
- **格式**: `postgresql://username:password@host:port/database?options`
- **示例**: 
  ```
  postgresql://admin:password@localhost:5432/game_leaderboard_admin?schema=public&connection_limit=20&pool_timeout=10
  ```
- **参数说明**:
  - `connection_limit`: 连接池大小（推荐 10-20）
  - `pool_timeout`: 连接超时时间（秒）
  - `schema`: 数据库模式（通常为 public）

#### `DB_MAX_CONNECTIONS`
- **描述**: 数据库最大连接数
- **类型**: 数字
- **默认值**: `10`
- **生产环境推荐**: `20`

#### `DB_CONNECTION_TIMEOUT`
- **描述**: 数据库连接超时时间（毫秒）
- **类型**: 数字
- **默认值**: `5000`
- **生产环境推荐**: `3000`

#### `DB_POOL_TIMEOUT`
- **描述**: 连接池超时时间（毫秒）
- **类型**: 数字
- **默认值**: `10000`
- **生产环境推荐**: `5000`

### 🔗 外部 API 配置

#### 微信小程序配置

##### `WECHAT_APP_ID`
- **描述**: 微信小程序的 App ID
- **类型**: 字符串
- **格式**: `wx` 开头的字符串
- **示例**: `"wx1234567890abcdef"`
- **获取方式**: 微信公众平台 -> 开发 -> 开发设置

##### `WECHAT_APP_SECRET`
- **描述**: 微信小程序的 App Secret
- **类型**: 字符串
- **示例**: `"abcdef1234567890abcdef1234567890"`
- **获取方式**: 微信公众平台 -> 开发 -> 开发设置

#### 抖音小程序配置

##### `DOUYIN_APP_ID`
- **描述**: 抖音小程序的 App ID
- **类型**: 字符串
- **格式**: `tt` 开头的字符串
- **示例**: `"tt1234567890abcdef"`
- **获取方式**: 抖音开放平台 -> 应用管理

##### `DOUYIN_APP_SECRET`
- **描述**: 抖音小程序的 App Secret
- **类型**: 字符串
- **示例**: `"abcdef1234567890abcdef1234567890"`
- **获取方式**: 抖音开放平台 -> 应用管理

### 🚀 应用配置

#### `NEXTAUTH_URL`
- **描述**: 应用程序的完整 URL
- **类型**: URL 字符串
- **开发环境**: `"http://localhost:3000"`
- **生产环境**: `"https://your-domain.com"`

#### `NODE_ENV`
- **描述**: 运行环境标识
- **类型**: 枚举字符串
- **可选值**: `development`, `production`, `test`
- **默认值**: `development`

#### `PORT`
- **描述**: 应用程序监听端口
- **类型**: 数字
- **默认值**: `3000`

### 📦 缓存配置

#### `REDIS_URL`
- **描述**: Redis 连接字符串
- **类型**: 连接字符串
- **格式**: `redis://[username:password@]host:port[/database]`
- **示例**:
  ```
  # 无密码
  redis://localhost:6379
  
  # 有密码
  redis://username:password@localhost:6379
  
  # 指定数据库
  redis://localhost:6379/0
  ```

### 🛡️ 安全配置

#### `ALLOWED_ORIGINS`
- **描述**: 允许的 CORS 来源
- **类型**: 逗号分隔的 URL 列表
- **示例**: `"https://your-domain.com,https://cdn.your-domain.com"`

#### `FORCE_HTTPS`
- **描述**: 是否强制使用 HTTPS
- **类型**: 布尔字符串
- **开发环境**: `"false"`
- **生产环境**: `"true"`

#### `CSP_REPORT_URI`
- **描述**: 内容安全策略报告 URI
- **类型**: URL 字符串
- **示例**: `"https://your-domain.com/api/csp-report"`

### 🚦 速率限制配置

#### `RATE_LIMIT_WINDOW_MS`
- **描述**: 速率限制时间窗口（毫秒）
- **类型**: 数字
- **默认值**: `900000` (15 分钟)
- **生产环境推荐**: `900000`

#### `RATE_LIMIT_MAX_REQUESTS`
- **描述**: 时间窗口内最大请求数
- **类型**: 数字
- **默认值**: `100`
- **生产环境推荐**: `1000`

### 📝 日志配置

#### `LOG_LEVEL`
- **描述**: 日志级别
- **类型**: 枚举字符串
- **可选值**: `error`, `warn`, `info`, `debug`
- **开发环境**: `"debug"`
- **生产环境**: `"warn"`

#### `LOG_FILE_PATH`
- **描述**: 日志文件路径
- **类型**: 文件路径字符串
- **开发环境**: `"./logs/app.log"`
- **生产环境**: `"/var/log/game-leaderboard-admin/app.log"`

### 🏥 健康检查配置

#### `HEALTH_CHECK_TOKEN`
- **描述**: 健康检查端点的访问令牌
- **类型**: 字符串
- **用途**: 用于负载均衡器或监控系统的健康检查
- **示例**: `"your-health-check-token"`

## 环境特定配置

### 开发环境 (.env.development)

```bash
# 数据库
DATABASE_URL="postgresql://postgres:password@localhost:5432/game_leaderboard_admin_dev"

# NextAuth
NEXTAUTH_SECRET="development-secret-key-32-chars-min"
NEXTAUTH_URL="http://localhost:3000"

# 外部 API（使用测试环境）
WECHAT_APP_ID="wx_test_app_id"
WECHAT_APP_SECRET="test_app_secret"
DOUYIN_APP_ID="tt_test_app_id"
DOUYIN_APP_SECRET="test_app_secret"

# Redis
REDIS_URL="redis://localhost:6379"

# 安全
ENCRYPTION_KEY="dev-32-character-encryption-key"
INTERNAL_API_KEY="dev-internal-api-key"
GAME_CLIENT_API_KEY="dev-game-client-api-key"

# 其他
NODE_ENV="development"
LOG_LEVEL="debug"
FORCE_HTTPS="false"
```

### 测试环境 (.env.test)

```bash
# 数据库（使用测试数据库）
DATABASE_URL="postgresql://postgres:password@localhost:5432/game_leaderboard_admin_test"

# NextAuth
NEXTAUTH_SECRET="test-secret-key-32-chars-minimum"
NEXTAUTH_URL="http://localhost:3000"

# 外部 API（使用 mock 或测试 API）
WECHAT_APP_ID="wx_test_app_id"
WECHAT_APP_SECRET="test_app_secret"
DOUYIN_APP_ID="tt_test_app_id"
DOUYIN_APP_SECRET="test_app_secret"

# Redis（使用不同的数据库）
REDIS_URL="redis://localhost:6379/1"

# 安全
ENCRYPTION_KEY="test-32-character-encryption-key"
INTERNAL_API_KEY="test-internal-api-key"
GAME_CLIENT_API_KEY="test-game-client-api-key"

# 其他
NODE_ENV="test"
LOG_LEVEL="error"
```

### 生产环境 (.env.production)

```bash
# 数据库（生产数据库）
DATABASE_URL="postgresql://prod_user:strong_password@prod-db-host:5432/game_leaderboard_admin"
DB_MAX_CONNECTIONS=20
DB_CONNECTION_TIMEOUT=3000

# NextAuth
NEXTAUTH_SECRET="production-secret-key-very-strong-32-chars-minimum"
NEXTAUTH_URL="https://your-production-domain.com"

# 外部 API（生产 API）
WECHAT_APP_ID="wx_production_app_id"
WECHAT_APP_SECRET="production_app_secret"
DOUYIN_APP_ID="tt_production_app_id"
DOUYIN_APP_SECRET="production_app_secret"

# Redis（生产 Redis）
REDIS_URL="redis://username:password@prod-redis-host:6379"

# 安全（强密钥）
ENCRYPTION_KEY="prod-32-char-very-strong-encrypt-key"
INTERNAL_API_KEY="production-internal-api-key-very-strong"
GAME_CLIENT_API_KEY="production-game-client-api-key-strong"

# 速率限制（生产级别）
RATE_LIMIT_MAX_REQUESTS=1000

# 安全
ALLOWED_ORIGINS="https://your-domain.com,https://cdn.your-domain.com"
FORCE_HTTPS="true"

# 日志
LOG_LEVEL="warn"
LOG_FILE_PATH="/var/log/game-leaderboard-admin/app.log"

# 其他
NODE_ENV="production"
```

## 环境变量验证

应用程序启动时会验证必需的环境变量。如果缺少必需变量，应用程序将拒绝启动并显示错误消息。

### 验证规则

1. **必需变量检查**: 确保所有标记为必需的变量都已设置
2. **格式验证**: 验证 URL、数字等格式是否正确
3. **长度验证**: 确保密钥满足最小长度要求
4. **连接测试**: 验证数据库和 Redis 连接是否可用

### 验证脚本

```bash
# 运行环境变量验证
npm run validate:env

# 或者手动检查
node -e "
const requiredVars = [
  'DATABASE_URL',
  'NEXTAUTH_SECRET',
  'NEXTAUTH_URL',
  'WECHAT_APP_ID',
  'WECHAT_APP_SECRET',
  'DOUYIN_APP_ID',
  'DOUYIN_APP_SECRET',
  'REDIS_URL',
  'ENCRYPTION_KEY',
  'INTERNAL_API_KEY',
  'GAME_CLIENT_API_KEY'
];

const missing = requiredVars.filter(v => !process.env[v]);
if (missing.length > 0) {
  console.error('Missing required environment variables:', missing);
  process.exit(1);
} else {
  console.log('All required environment variables are set');
}
"
```

## 安全最佳实践

### 1. 密钥管理

- ✅ 使用强随机密钥
- ✅ 定期轮换密钥
- ✅ 不同环境使用不同密钥
- ✅ 使用密钥管理服务（如 AWS Secrets Manager）

### 2. 环境隔离

- ✅ 开发、测试、生产环境完全隔离
- ✅ 使用不同的数据库和 Redis 实例
- ✅ 不同环境使用不同的外部 API 密钥

### 3. 访问控制

- ✅ 限制环境变量文件的访问权限
- ✅ 使用 `.gitignore` 防止敏感文件提交
- ✅ 在 CI/CD 中安全地管理环境变量

### 4. 监控和审计

- ✅ 监控环境变量的使用情况
- ✅ 记录配置变更
- ✅ 定期审计密钥和权限

## 故障排除

### 常见问题

#### 1. 数据库连接失败

```bash
# 检查 DATABASE_URL 格式
echo $DATABASE_URL

# 测试数据库连接
psql $DATABASE_URL -c "SELECT 1;"
```

#### 2. Redis 连接失败

```bash
# 检查 REDIS_URL 格式
echo $REDIS_URL

# 测试 Redis 连接
redis-cli -u $REDIS_URL ping
```

#### 3. 外部 API 调用失败

```bash
# 检查 API 密钥
echo $WECHAT_APP_ID
echo $DOUYIN_APP_ID

# 测试网络连接
curl -I https://api.weixin.qq.com
```

#### 4. 密钥长度不足

```bash
# 检查密钥长度
echo -n $NEXTAUTH_SECRET | wc -c
echo -n $ENCRYPTION_KEY | wc -c
```

### 调试技巧

```bash
# 显示所有环境变量（注意安全）
env | grep -E "(DATABASE|NEXTAUTH|WECHAT|DOUYIN|REDIS)"

# 验证环境变量是否正确加载
node -e "console.log(process.env.NODE_ENV)"

# 检查应用程序配置
npm run config:check
```

---

**重要提醒**: 
- 🔒 永远不要在代码仓库中提交包含真实密钥的环境变量文件
- 🔄 定期轮换生产环境的密钥和密码
- 📋 保持环境变量文档的更新
- 🛡️ 使用专业的密钥管理服务来管理生产环境的敏感信息