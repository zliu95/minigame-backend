# 清除浏览器 HSTS 缓存

## 问题说明

你看到的 HTTPS 跳转是**浏览器的 HSTS（HTTP Strict Transport Security）缓存**导致的，不是应用的问题。

当浏览器之前访问过某个域名的 HTTPS 版本时，会记住这个设置，之后自动将所有 HTTP 请求升级为 HTTPS。

## 验证应用是否正常

### 方法 1：访问测试页面（推荐）

```bash
# 启动开发服务器
npm run dev

# 在浏览器访问（使用隐私模式）
http://localhost:3000/test
```

测试页面不需要登录，可以直接验证应用是否正常运行。

### 方法 2：检查 API 端点

```bash
# 使用 curl 测试（不受浏览器缓存影响）
curl http://localhost:3000/api/health

# 应该返回 JSON 响应，不会重定向
```

## 清除 HSTS 缓存

### Chrome / Edge

1. **方法 1：使用隐私模式（最简单）**
   - 打开隐私模式/无痕窗口
   - 访问 `http://localhost:3000/test`
   - 这样不会受到 HSTS 缓存影响

2. **方法 2：清除 HSTS 设置**
   ```
   1. 在地址栏输入: chrome://net-internals/#hsts
   2. 在 "Delete domain security policies" 部分
   3. 输入: localhost
   4. 点击 "Delete"
   5. 重启浏览器
   ```

3. **方法 3：清除所有浏览数据**
   ```
   1. 设置 > 隐私和安全 > 清除浏览数据
   2. 选择 "高级"
   3. 勾选所有选项（特别是 "Cookie 和其他网站数据"）
   4. 点击 "清除数据"
   ```

### Firefox

1. **使用隐私窗口**
   - Ctrl+Shift+P (Windows/Linux) 或 Cmd+Shift+P (Mac)
   - 访问 `http://localhost:3000/test`

2. **清除 HSTS 设置**
   ```
   1. 在地址栏输入: about:config
   2. 搜索: security.cert_pinning.enforcement_level
   3. 设置为 0
   4. 重启浏览器
   ```

### Safari

1. **使用隐私浏览**
   - 文件 > 新建隐私浏览窗口
   - 访问 `http://localhost:3000/test`

2. **清除网站数据**
   ```
   1. Safari > 偏好设置 > 隐私
   2. 点击 "管理网站数据"
   3. 搜索 "localhost"
   4. 删除
   ```

## 验证修复

### 1. 使用 curl（命令行）

```bash
# 测试健康检查（不应该重定向）
curl -v http://localhost:3000/api/health

# 查看响应头，应该是 200 OK，不是 301/302
```

### 2. 使用隐私模式

```bash
# 启动服务器
npm run dev

# 在隐私模式下访问
http://localhost:3000/test
```

应该看到绿色的测试页面，说明应用正常运行。

### 3. 检查登录流程

```bash
# 访问登录页面
http://localhost:3000/login

# 使用默认账号登录
用户名: admin
密码: admin123
```

## 为什么会有这个问题？

1. **之前的配置**：应用之前配置了强制 HTTPS 重定向
2. **浏览器记住了**：浏览器缓存了这个 HSTS 设置
3. **已经修复**：应用代码已经修复，但浏览器缓存还在

## 最佳实践

### 开发环境

- ✅ 使用 HTTP（`http://localhost:3000`）
- ✅ 使用隐私模式测试
- ✅ 不要在本地配置 HTTPS（除非必要）

### 生产环境

- ✅ 在 Nginx/负载均衡器层面配置 HTTPS
- ✅ 使用有效的 SSL 证书
- ✅ 配置 HSTS 头部（在 Nginx 中）

## 快速测试命令

```bash
# 1. 启动开发服务器
npm run dev

# 2. 在另一个终端测试 API（不受浏览器影响）
curl http://localhost:3000/api/health

# 3. 测试登录页面
curl -I http://localhost:3000/login

# 4. 在隐私模式浏览器中访问
# http://localhost:3000/test
```

## 总结

- ✅ **应用本身已经修复**，不会强制重定向到 HTTPS
- ⚠️ **浏览器缓存**导致自动升级到 HTTPS
- 💡 **解决方案**：使用隐私模式或清除 HSTS 缓存
- 🎯 **验证方法**：访问 `/test` 页面或使用 curl 测试

## 相关文档

- [QUICK_START.md](./QUICK_START.md) - 快速启动
- [HTTPS_FIX.md](./HTTPS_FIX.md) - HTTPS 问题详解
- [POST_FIX_CHECKLIST.md](./POST_FIX_CHECKLIST.md) - 修复检查清单
