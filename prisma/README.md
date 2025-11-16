# 数据库设置说明

## 环境准备

1. 安装 PostgreSQL 数据库
2. 创建数据库：`game_leaderboard_admin`
3. 配置 `.env` 文件中的 `DATABASE_URL`

## 数据库操作命令

### 初始化数据库
```bash
# 运行迁移
npm run db:migrate

# 运行种子数据
npm run db:seed
```

### 开发工具
```bash
# 打开 Prisma Studio
npm run db:studio

# 重置数据库（谨慎使用）
npm run db:reset
```

### 生成 Prisma Client
```bash
npx prisma generate
```

## 数据库结构

### 表结构
- `admins`: 管理员账户
- `games`: 游戏信息
- `players`: 玩家数据和排行榜

### 默认数据
- 管理员账户: `admin` / `admin123`
- 示例游戏: 益智拼图、极速赛车
- 示例玩家数据

## 注意事项

1. 生产环境请修改默认管理员密码
2. 确保数据库连接字符串正确配置
3. 定期备份生产数据库