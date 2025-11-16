# 生产构建 HTTPS 重定向问题修复

## 问题描述

**症状：**
- `npm run dev` 正常工作（HTTP）
- `npm run build && npm start` 后自动跳转到 HTTPS
- 导致本地测试生产构建时无法访问

## 根本原因

在 `lib/security-headers.ts` 中发现两个问题：

1. **HSTS 头部总是被设置**
   ```typescript
   'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload'
   ```
   这个头部告诉浏览器"永远使用 HTTPS"，即使在本地测试也会生效。

2. **`enforceHttps` 函数在生产环境强制重定向**
   ```typescript
   if (process.env.NODE_ENV === 'production' && !isSecureConnection(request)) {
     return NextResponse.redirect(url, { status: 301 });
   }
   ```
   这导致所有生产构建都会强制 HTTPS。

## 修复方案

### 1. 修改 `lib/security-headers.ts`

**修改前：**
```typescript
export const SECURITY_HEADERS = {
  // ... 其他头部
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload',
};

export function enforceHttps(request: Request): NextResponse | null {
  if (process.env.NODE_ENV === 'production' && !isSecureConnection(request)) {
    // 强制重定向
  }
}
```

**修改后：**
```typescript
// 只在明确启用时才添加 HSTS
export const SECURITY_HEADERS = (() => {
  const shouldUseHSTS = process.env.NODE_ENV === 'production' && 
                        process.env.FORCE_HTTPS === 'true';
  
  return shouldUseHSTS 
    ? { ...BASE_SECURITY_HEADERS, ...HSTS_HEADER }
    : BASE_SECURITY_HEADERS;
})();

export function enforceHttps(request: Request): NextResponse | null {
  // 只有在明确启用时才强制 HTTPS
  const shouldForceHttps = process.env.NODE_ENV === 'production' && 
                           process.env.FORCE_HTTPS === 'true';
  
  if (shouldForceHttps && !isSecureConnection(request)) {
    // 强制重定向
  }
}
```

### 2. 环境变量控制

在 `.env.production` 中：
```env
# 设置为 false 以禁用强制 HTTPS（本地测试生产构建）
FORCE_HTTPS="false"

# 设置为 true 以启用强制 HTTPS（真实生产环境，配合 Nginx）
# FORCE_HTTPS="true"
```

## 使用方法

### 本地测试生产构建

```bash
# 1. 确保 .env.production 中 FORCE_HTTPS=false
echo 'FORCE_HTTPS="false"' >> .env.production

# 2. 构建
npm run build

# 3. 测试构建配置
npm run test:production

# 4. 启动生产服务器
npm start

# 5. 在另一个终端测试
curl -I http://localhost:3000/api/health
# 应该返回 200 OK，不是 301

# 6. 浏览器测试（隐私模式）
# 访问: http://localhost:3000/test
```

### 真实生产环境部署

**推荐方案：在 Nginx 层面处理 HTTPS**

```nginx
# nginx.conf
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
    
    # 在 Nginx 设置 HSTS
    add_header Strict-Transport-Security "max-age=31536000" always;
    
    location / {
        proxy_pass http://localhost:3000;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

在应用的 `.env.production` 中：
```env
# 不需要在应用层强制 HTTPS，Nginx 已经处理
FORCE_HTTPS="false"
```

**备选方案：在应用层处理 HTTPS**

如果必须在应用层处理（不推荐），在 `.env.production` 中：
```env
# 启用应用层 HTTPS 强制
FORCE_HTTPS="true"
```

## 验证修复

### 1. 开发环境测试

```bash
npm run dev
curl http://localhost:3000/api/health
# ✅ 应该返回 200 OK
```

### 2. 生产构建测试

```bash
npm run build
npm start
curl -I http://localhost:3000/api/health
# ✅ 应该返回 200 OK（如果 FORCE_HTTPS=false）
# ✅ 响应头中不应该有 Strict-Transport-Security
```

### 3. 检查响应头

```bash
curl -I http://localhost:3000/api/health | grep -i "strict-transport"
# 如果 FORCE_HTTPS=false，应该没有输出
```

## 配置对比

| 场景 | NODE_ENV | FORCE_HTTPS | 行为 |
|------|----------|-------------|------|
| 本地开发 | development | - | HTTP，无 HSTS |
| 本地测试生产构建 | production | false | HTTP，无 HSTS |
| 生产环境（Nginx 处理） | production | false | HTTP→Nginx→HTTPS |
| 生产环境（应用处理） | production | true | 强制 HTTPS，有 HSTS |

## 最佳实践

1. ✅ **推荐**：在 Nginx/负载均衡器层面处理 HTTPS
   - 更灵活
   - 更容易管理证书
   - 应用层保持简单

2. ✅ **本地测试**：使用 `FORCE_HTTPS=false`
   - 可以测试生产构建
   - 不会被 HTTPS 重定向困扰

3. ✅ **环境变量控制**：通过 `FORCE_HTTPS` 灵活控制
   - 不需要修改代码
   - 不同环境不同配置

4. ❌ **不推荐**：在应用层强制 HTTPS
   - 除非没有 Nginx/负载均衡器
   - 会增加应用复杂度

## 相关文档

- [HTTPS_FIX.md](./HTTPS_FIX.md) - HTTPS 配置详解
- [CLEAR_HSTS.md](./CLEAR_HSTS.md) - 清除 HSTS 缓存
- [BROWSER_HTTPS_ISSUE.md](./BROWSER_HTTPS_ISSUE.md) - 浏览器 HTTPS 问题
- [nginx/nginx.conf](./nginx/nginx.conf) - Nginx 配置示例

## 总结

- ✅ 修复了生产构建强制 HTTPS 的问题
- ✅ 通过 `FORCE_HTTPS` 环境变量控制行为
- ✅ HSTS 头部只在明确启用时设置
- ✅ 推荐在 Nginx 层面处理 HTTPS
- ✅ 本地可以正常测试生产构建

现在 `npm run build && npm start` 不会再强制跳转 HTTPS 了！
