# 安全配置指南

## 概述

本文档描述了游戏排行榜管理系统的安全配置和最佳实践。

## 环境变量配置

### 必需的安全环境变量

```bash
# 加密密钥（必须是32字符）
ENCRYPTION_KEY="your-32-character-encryption-key-here-must-be-32-chars"

# API密钥
INTERNAL_API_KEY="your-internal-api-key-for-server-to-server-calls"
GAME_CLIENT_API_KEY="your-game-client-api-key-for-game-clients"

# NextAuth密钥
NEXTAUTH_SECRET="your-nextauth-secret-key-minimum-32-characters"
NEXTAUTH_URL="https://your-production-domain.com"

# 生产环境设置
NODE_ENV="production"
FORCE_HTTPS="true"
```

### 可选的安全配置

```bash
# 速率限制配置
RATE_LIMIT_WINDOW_MS=900000  # 15分钟窗口
RATE_LIMIT_MAX_REQUESTS=100  # 最大请求数

# CORS配置
ALLOWED_ORIGINS="https://your-domain.com,https://api.your-domain.com"

# 日志配置
LOG_LEVEL="warn"  # 生产环境建议使用warn或error
LOG_FILE_PATH="/var/log/app/game-admin.log"
```

## 安全功能

### 1. 速率限制

系统实现了基于IP的速率限制：

- **登录API**: 15分钟内最多5次尝试
- **玩家认证**: 1分钟内最多10次请求
- **分值更新**: 1分钟内最多30次请求
- **游戏管理**: 1分钟内最多20次请求
- **默认限制**: 15分钟内最多100次请求

### 2. 请求来源验证

- 验证Origin和Referer头部
- 检查User-Agent模式
- 支持API密钥认证
- 检测可疑请求模式

### 3. 输入验证和清理

- 使用Zod进行严格的数据验证
- 自动清理危险字符
- 防止XSS和注入攻击
- 限制请求体大小

### 4. 数据加密

- 敏感数据使用AES-256-GCM加密
- 支持JSON对象加密
- 安全的密钥派生
- 时序攻击防护

### 5. 安全头部

系统自动添加以下安全头部：

```
Content-Security-Policy: default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; ...
X-Frame-Options: DENY
X-Content-Type-Options: nosniff
X-XSS-Protection: 1; mode=block
Referrer-Policy: strict-origin-when-cross-origin
Strict-Transport-Security: max-age=31536000; includeSubDomains; preload
```

### 6. CORS配置

- 严格的来源验证
- 支持预检请求
- 可配置的允许方法和头部
- 凭据支持控制

## 部署安全检查清单

### 生产环境部署前

- [ ] 设置强密码的数据库连接
- [ ] 配置HTTPS证书
- [ ] 设置防火墙规则
- [ ] 配置环境变量
- [ ] 启用日志记录
- [ ] 设置监控和告警
- [ ] 配置备份策略

### 环境变量检查

- [ ] `ENCRYPTION_KEY` 已设置且为32字符
- [ ] `NEXTAUTH_SECRET` 已设置且足够复杂
- [ ] `DATABASE_URL` 使用强密码
- [ ] `NODE_ENV` 设置为 "production"
- [ ] API密钥已生成并配置

### 网络安全

- [ ] 启用HTTPS
- [ ] 配置HSTS头部
- [ ] 设置适当的CORS策略
- [ ] 配置CDN和DDoS防护
- [ ] 限制数据库访问

## 安全监控

### 日志记录

系统记录以下安全事件：

- 认证失败
- 速率限制触发
- 可疑请求检测
- 数据验证失败
- 加密/解密错误

### 监控指标

建议监控以下指标：

- 失败的登录尝试次数
- 速率限制触发频率
- 异常的请求模式
- 错误率和响应时间
- 数据库连接状态

### 告警配置

建议设置以下告警：

- 连续登录失败
- 大量速率限制触发
- 系统错误率过高
- 数据库连接失败
- 磁盘空间不足

## 安全最佳实践

### 1. 密码安全

- 使用强密码策略
- 定期更换密钥
- 使用密码管理器
- 启用双因素认证（如适用）

### 2. 数据保护

- 加密敏感数据
- 定期备份数据
- 限制数据访问权限
- 实施数据保留策略

### 3. 网络安全

- 使用VPN访问生产环境
- 限制管理端口访问
- 定期更新SSL证书
- 监控网络流量

### 4. 应用安全

- 定期更新依赖包
- 进行安全代码审查
- 实施漏洞扫描
- 制定事件响应计划

## 常见安全问题

### 1. 速率限制被绕过

**症状**: 大量请求绕过速率限制
**解决方案**: 
- 检查代理配置
- 验证IP获取逻辑
- 考虑使用Redis存储

### 2. CORS错误

**症状**: 浏览器CORS错误
**解决方案**:
- 检查ALLOWED_ORIGINS配置
- 验证请求头部
- 确认预检请求处理

### 3. 加密失败

**症状**: 数据加密/解密错误
**解决方案**:
- 验证ENCRYPTION_KEY长度
- 检查密钥格式
- 确认算法兼容性

## 联系信息

如发现安全问题，请联系：
- 安全团队邮箱: security@your-domain.com
- 紧急联系电话: +86-xxx-xxxx-xxxx

## 更新日志

- 2024-11-01: 初始版本
- 添加速率限制和请求验证
- 实施数据加密和安全头部