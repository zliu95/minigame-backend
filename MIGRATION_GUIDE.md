# Prisma 迁移指南

## 什么是数据库迁移？

数据库迁移是一种版本控制系统，用于跟踪和管理数据库结构的变化。

## 常用迁移命令

### 1. 创建新迁移（开发环境）

```bash
npx prisma migrate dev --name your_migration_name
```

**说明：**
- 自动检测 schema 变化
- 创建迁移文件
- 应用到数据库
- 生成 Prisma Client

**示例：**
```bash
npx prisma migrate dev --name add_email_field
npx prisma migrate dev --name update_user_table
```

### 2. 仅创建迁移文件（不应用）

```bash
npx prisma migrate dev --name your_migration_name --create-only
```

**使用场景：**
- 需要手动修改迁移 SQL
- 表中已有数据，需要特殊处理
- 需要添加自定义 SQL

### 3. 应用迁移（生产环境）

```bash
npx prisma migrate deploy
```

**说明：**
- 只应用未执行的迁移
- 不会创建新迁移
- 适合 CI/CD 和生产环境

### 4. 查看迁移状态

```bash
npx prisma migrate status
```

**输出示例：**
```
Database schema is up to date!

Following migrations have been applied:
20241031000000_init
20251116104247_add_player_id_field
```

### 5. 重置数据库（警告：删除所有数据）

```bash
npx prisma migrate reset
```

**说明：**
- 删除数据库
- 重新应用所有迁移
- 运行种子脚本

## 实际案例：添加 playerId 字段

### 场景

在 Player 表中添加一个新的必填字段 `playerId`，但表中已有数据。

### 步骤 1：修改 Schema

编辑 `prisma/schema.prisma`：

```prisma
model Player {
  id          String   @id @default(cuid())
  gameId      String
  openid      String
  playerId    String   // 新增字段
  nickname    String
  // ... 其他字段
}
```

### 步骤 2：创建迁移文件

```bash
npx prisma migrate dev --name add_player_id_field --create-only
```

**输出：**
```
⚠️ We found changes that cannot be executed:
  • Added the required column `playerId` to the `players` table 
    without a default value. There are 3 rows in this table.

Prisma Migrate created the following migration without applying it:
20251116104247_add_player_id_field
```

### 步骤 3：修改迁移文件

编辑 `prisma/migrations/20251116104247_add_player_id_field/migration.sql`：

**原始内容：**
```sql
-- AlterTable
ALTER TABLE "players" ADD COLUMN "playerId" TEXT NOT NULL;
```

**修改后：**
```sql
-- AlterTable
-- 步骤1: 添加字段（允许为空）
ALTER TABLE "players" ADD COLUMN "playerId" TEXT;

-- 步骤2: 为现有数据设置默认值
UPDATE "players" SET "playerId" = "openid" WHERE "playerId" IS NULL;

-- 步骤3: 设置字段为必填
ALTER TABLE "players" ALTER COLUMN "playerId" SET NOT NULL;
```

### 步骤 4：应用迁移

```bash
npx prisma migrate dev
```

**输出：**
```
Applying migration `20251116104247_add_player_id_field`
✔ Generated Prisma Client
Your database is now in sync with your schema.
```

### 步骤 5：验证

```bash
npm run players:view
# 或
npx prisma studio
```

## 常见场景和解决方案

### 场景 1：添加必填字段（表中有数据）

**问题：** 无法直接添加必填字段

**解决方案：**
```sql
-- 1. 添加可空字段
ALTER TABLE "table_name" ADD COLUMN "new_field" TEXT;

-- 2. 填充数据
UPDATE "table_name" SET "new_field" = 'default_value';

-- 3. 设置为必填
ALTER TABLE "table_name" ALTER COLUMN "new_field" SET NOT NULL;
```

### 场景 2：重命名字段

**Schema 变化：**
```prisma
model Player {
  // oldName String  // 旧字段
  newName String     // 新字段
}
```

**迁移 SQL：**
```sql
-- 重命名字段（保留数据）
ALTER TABLE "players" RENAME COLUMN "oldName" TO "newName";
```

### 场景 3：修改字段类型

**Schema 变化：**
```prisma
model Player {
  score Float  // 从 Int 改为 Float
}
```

**迁移 SQL：**
```sql
-- 修改字段类型
ALTER TABLE "players" ALTER COLUMN "score" TYPE DOUBLE PRECISION;
```

### 场景 4：添加唯一约束

**Schema 变化：**
```prisma
model Player {
  email String @unique
}
```

**迁移 SQL：**
```sql
-- 1. 先清理重复数据（如果有）
DELETE FROM "players" a USING "players" b
WHERE a.id > b.id AND a.email = b.email;

-- 2. 添加唯一约束
ALTER TABLE "players" ADD CONSTRAINT "players_email_key" UNIQUE ("email");
```

### 场景 5：添加外键关系

**Schema 变化：**
```prisma
model Player {
  gameId String
  game   Game   @relation(fields: [gameId], references: [id])
}
```

**迁移 SQL：**
```sql
-- 添加外键约束
ALTER TABLE "players" 
ADD CONSTRAINT "players_gameId_fkey" 
FOREIGN KEY ("gameId") REFERENCES "games"("id") 
ON DELETE CASCADE ON UPDATE CASCADE;
```

## 迁移最佳实践

### ✅ 推荐做法

1. **小步迁移** - 每次只做一个变更
2. **命名清晰** - 使用描述性的迁移名称
3. **备份数据** - 生产环境迁移前备份
4. **测试迁移** - 在开发环境先测试
5. **版本控制** - 提交迁移文件到 Git

### ❌ 避免做法

1. ❌ 直接修改已应用的迁移文件
2. ❌ 删除迁移文件
3. ❌ 在生产环境使用 `migrate dev`
4. ❌ 跳过迁移直接修改数据库
5. ❌ 不测试就部署迁移

## 迁移文件结构

```
prisma/
├── schema.prisma
└── migrations/
    ├── migration_lock.toml
    ├── 20241031000000_init/
    │   └── migration.sql
    └── 20251116104247_add_player_id_field/
        └── migration.sql
```

## 生产环境迁移流程

### 1. 开发环境

```bash
# 1. 修改 schema
# 2. 创建迁移
npx prisma migrate dev --name your_change

# 3. 测试
npm run dev

# 4. 提交到 Git
git add prisma/
git commit -m "feat: add new field"
git push
```

### 2. 生产环境

```bash
# 1. 拉取最新代码
git pull

# 2. 备份数据库
pg_dump $DATABASE_URL > backup.sql

# 3. 应用迁移
npx prisma migrate deploy

# 4. 验证
npx prisma migrate status

# 5. 重启应用
pm2 restart app
```

## 回滚迁移

Prisma 不支持自动回滚，需要手动处理：

### 方法 1：创建反向迁移

```bash
# 创建新迁移来撤销变更
npx prisma migrate dev --name revert_previous_change
```

在迁移文件中写反向 SQL：
```sql
-- 如果之前添加了字段，现在删除它
ALTER TABLE "players" DROP COLUMN "playerId";
```

### 方法 2：从备份恢复

```bash
# 恢复数据库
psql $DATABASE_URL < backup.sql

# 重置迁移状态
npx prisma migrate resolve --rolled-back migration_name
```

## 故障排除

### 问题 1：迁移失败

```bash
# 查看状态
npx prisma migrate status

# 标记为已回滚
npx prisma migrate resolve --rolled-back migration_name

# 重新应用
npx prisma migrate deploy
```

### 问题 2：Schema 和数据库不同步

```bash
# 查看差异
npx prisma migrate diff \
  --from-schema-datamodel prisma/schema.prisma \
  --to-schema-datasource $DATABASE_URL

# 创建修复迁移
npx prisma migrate dev --name fix_schema_drift
```

### 问题 3：迁移冲突

```bash
# 重置本地数据库
npx prisma migrate reset

# 或手动解决冲突后
npx prisma migrate resolve --applied migration_name
```

## 有用的命令

```bash
# 格式化 schema
npx prisma format

# 验证 schema
npx prisma validate

# 生成 Client
npx prisma generate

# 查看数据库
npx prisma studio

# 查看迁移历史
ls -la prisma/migrations/
```

## 相关文档

- [Prisma Migrate 文档](https://www.prisma.io/docs/concepts/components/prisma-migrate)
- [DATABASE_SETUP.md](./DATABASE_SETUP.md) - 数据库设置
- [PLAYER_TABLE_STRUCTURE.md](./PLAYER_TABLE_STRUCTURE.md) - 表结构说明
