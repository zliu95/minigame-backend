# HTTPS 重定向问题修复说明

## 问题描述

### 症状
1. **本地开发**：访问 `http://localhost:3000` 自动跳转到 `https://localhost:3000`，显示 "This site can't provide a secure connection"
2. **线上环境**：显示 301 timeout 错误

### 根本原因
`next.config.ts` 中配置了强制 HTTPS 重定向到硬编码的域名 `https://your-domain.com`

## 已修复内容

### 1. 修改 `next.config.ts`

**修改前：**
```typescript
async redirects() {
  return [
    ...(process.env.NODE_ENV === 'production' ? [{
      source: '/(.*)',
      destination: 'https://your-domain.com/$1',  // ❌ 硬编码域名
      permanent: true,
    }] : []),
  ];
}
```

**修改后：**
```typescript
async redirects() {
  return [
    // 注释掉强制重定向，改为在 Nginx 层面处理
  ];
}
```

### 2. 创建 `.env.local` 模板

为本地开发提供正确的配置：

```env
NODE_ENV=development
NEXTAUTH_URL="http://localhost:3000"  # HTTP 而不是 HTTPS
FORCE_HTTPS=false
```

### 3. 更新文档

- ✅ 添加 `QUICK_START.md` - 快速启动指南
- ✅ 更新 `TROUBLESHOOTING.md` - 添加 HTTPS 问题排查
- ✅ 创建 `HTTPS_FIX.md` - 本文档

## 如何使用

### 本地开发

1. **复制环境变量文件：**
   ```bash
   cp .env.example .env.local
   ```

2. **确保配置正确：**
   ```env
   NEXTAUTH_URL="http://localhost:3000"  # 使用 HTTP
   ```

3. **清除浏览器缓存：**
   - Chrome: 开发者工具 > Network > 勾选 "Disable cache"
   - 或使用隐私模式/无痕模式

4. **重新构建并启动：**
   ```bash
   npm run build
   npm run dev
   ```

### 生产环境

**推荐方案：在 Nginx/负载均衡器层面处理 HTTPS**

#### Nginx 配置示例

```nginx
# HTTP 重定向到 HTTPS
server {
    listen 80;
    server_name your-actual-domain.com;
    return 301 https://$server_name$request_uri;
}

# HTTPS 服务器
server {
    listen 443 ssl http2;
    server_name your-actual-domain.com;
    
    # SSL 证书配置
    ssl_certificate /path/to/your/cert.pem;
    ssl_certificate_key /path/to/your/key.pem;
    
    # 反向代理到 Next.js
    location / {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

#### 如果必须在应用层处理 HTTPS

取消 `next.config.ts` 中的注释并配置：

```typescript
async redirects() {
  return [
    ...(process.env.NODE_ENV === 'production' && process.env.FORCE_HTTPS === 'true' ? [{
      source: '/(.*)',
      has: [
        {
          type: 'header' as const,
          key: 'x-forwarded-proto',
          value: 'http',
        },
      ],
      destination: 'https://your-actual-domain.com/$1',  // 替换为实际域名
      permanent: true,
    }] : []),
  ];
}
```

然后在 `.env.production` 中设置：
```env
FORCE_HTTPS=true
```

## 验证修复

### 1. 本地开发验证

```bash
# 启动开发服务器
npm run dev

# 在浏览器访问（应该不会重定向）
http://localhost:3000

# 检查健康端点
curl http://localhost:3000/api/health
```

### 2. 生产环境验证

```bash
# 检查 HTTP 响应头
curl -I http://your-domain.com

# 应该看到 301 重定向（如果配置了 Nginx）
# 或者 200 OK（如果没有配置 HTTPS）
```

## 最佳实践

1. ✅ **在反向代理层面处理 HTTPS**（Nginx、Cloudflare、AWS ALB 等）
2. ✅ **应用层保持简单**，不要硬编码域名
3. ✅ **使用环境变量**控制行为
4. ✅ **本地开发使用 HTTP**，避免证书问题
5. ✅ **生产环境使用 HTTPS**，但在基础设施层面配置

## 相关文档

- [QUICK_START.md](./QUICK_START.md) - 快速启动指南
- [TROUBLESHOOTING.md](./TROUBLESHOOTING.md) - 故障排除
- [DEPLOYMENT.md](./DEPLOYMENT.md) - 部署指南
- [nginx/nginx.conf](./nginx/nginx.conf) - Nginx 配置示例

## 总结

问题已修复！现在：
- ✅ 本地开发可以正常使用 HTTP
- ✅ 不会强制重定向到错误的域名
- ✅ HTTPS 配置灵活可控
- ✅ 推荐在基础设施层面处理 HTTPS
