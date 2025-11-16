# 创建示例数据指南

## 快速创建示例数据

### 方法 1：使用种子脚本（推荐）

```bash
npm run db:seed
```

这会创建：
- ✅ 1 个管理员账户（admin/admin123）
- ✅ 2 个示例游戏（益智拼图、极速赛车）
- ✅ 3 条玩家记录（不同平台）

### 方法 2：查看已创建的数据

```bash
npm run players:view
```

输出示例：
```
🎮 玩家数据列表
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

找到 3 条玩家记录：

📦 游戏: 益智拼图 (puzzle-game)
────────────────────────────────────────────────────────────
1. 玩家小明
   平台: WECHAT
   分数: 1500.5
   时长: 60分钟
   详细数据:
     道具使用: {"hint":3,"skip":1,"boost":2}
     完成关卡: 15
     成就: first_win, speed_master
```

## 创建的示例数据详情

### 玩家 1：玩家小明（微信平台）

```json
{
  "gameId": "益智拼图",
  "openid": "wx_openid_001",
  "nickname": "玩家小明",
  "platform": "WECHAT",
  "score": 1500.5,
  "duration": 3600,
  "location": "中国-北京市-北京市",
  "detailsJson": {
    "items_used": {
      "hint": 3,
      "skip": 1,
      "boost": 2
    },
    "level_completed": 15,
    "achievements": ["first_win", "speed_master"],
    "combo_max": 50
  }
}
```

### 玩家 2：玩家小红（抖音平台）

```json
{
  "gameId": "益智拼图",
  "openid": "dy_openid_001",
  "nickname": "玩家小红",
  "platform": "DOUYIN",
  "score": 1200.0,
  "duration": 2400,
  "location": "中国-上海市-上海市",
  "detailsJson": {
    "items_used": {
      "hint": 5,
      "skip": 0,
      "boost": 1
    },
    "level_completed": 12,
    "achievements": ["first_win"],
    "combo_max": 35
  }
}
```

### 玩家 3：iOS玩家（iOS平台）

```json
{
  "gameId": "极速赛车",
  "openid": "ios_openid_001",
  "nickname": "iOS玩家",
  "platform": "IOS_APP",
  "score": 2000.8,
  "duration": 4800,
  "location": "中国-广东省-深圳市",
  "detailsJson": {
    "items_used": {
      "hint": 2,
      "skip": 2,
      "boost": 3
    },
    "level_completed": 20,
    "achievements": ["first_win", "speed_master", "perfect_score"],
    "combo_max": 80,
    "accuracy": 0.95
  }
}
```

## 使用 Prisma Studio 查看

```bash
npx prisma studio
```

在浏览器中打开 http://localhost:5555，可以：
- 查看所有表的数据
- 编辑数据
- 删除数据
- 添加新数据

## 自定义创建数据

### 方法 1：修改种子脚本

编辑 `prisma/seed.ts`，添加更多玩家：

```typescript
const samplePlayers = [
  // 现有的 3 条数据...
  
  // 添加新玩家
  {
    gameId: game1.id,
    openid: 'wx_openid_002',
    nickname: '新玩家',
    avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=newplayer',
    score: 1800.0,
    duration: 3000,
    platform: 'WECHAT' as const,
    location: '中国-浙江省-杭州市',
    detailsJson: {
      items_used: { hint: 2, skip: 1, boost: 1 },
      level_completed: 18,
    },
  },
]
```

然后运行：
```bash
npm run db:seed
```

### 方法 2：使用 API 创建

```bash
# 玩家认证（创建玩家）
curl -X POST http://localhost:3000/api/players/auth \
  -H "Content-Type: application/json" \
  -d '{
    "code": "mock_code",
    "platform": "WECHAT",
    "gameId": "your-game-id"
  }'

# 更新分数
curl -X POST http://localhost:3000/api/players/score \
  -H "Content-Type: application/json" \
  -d '{
    "gameId": "your-game-id",
    "playerId": "your-player-id",
    "score": 2500,
    "duration": 5000,
    "details": {
      "items_used": {"hint": 1}
    }
  }'
```

### 方法 3：使用 Prisma Client

创建脚本 `scripts/create-custom-player.ts`：

```typescript
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const player = await prisma.player.create({
    data: {
      gameId: 'your-game-id',
      openid: 'custom_openid',
      nickname: '自定义玩家',
      platform: 'WECHAT',
      score: 1800,
      duration: 3000,
      location: '中国-浙江省-杭州市',
      detailsJson: {
        custom: 'data',
      },
    },
  })
  
  console.log('创建玩家:', player)
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e)
    prisma.$disconnect()
    process.exit(1)
  })
```

运行：
```bash
tsx scripts/create-custom-player.ts
```

## 批量创建数据

如果需要创建大量测试数据：

```typescript
// 在 seed.ts 中添加
const generatePlayers = (count: number, gameId: string) => {
  const players = []
  for (let i = 0; i < count; i++) {
    players.push({
      gameId,
      openid: `test_openid_${i}`,
      nickname: `测试玩家${i}`,
      platform: ['WECHAT', 'DOUYIN', 'IOS_APP'][i % 3] as any,
      score: Math.random() * 3000,
      duration: Math.floor(Math.random() * 7200),
      location: '中国-测试省-测试市',
    })
  }
  return players
}

// 创建 100 个玩家
const testPlayers = generatePlayers(100, game1.id)
for (const playerData of testPlayers) {
  await prisma.player.create({ data: playerData })
}
```

## 重置数据

如果需要清空并重新创建数据：

```bash
# 警告：这会删除所有数据！
npm run db:reset

# 然后重新创建
npm run db:seed
```

## 数据验证

### 检查数据是否创建成功

```bash
# 方法 1：使用查看脚本
npm run players:view

# 方法 2：使用 Prisma Studio
npx prisma studio

# 方法 3：使用 SQL
psql $DATABASE_URL -c "SELECT * FROM players;"
```

### 检查数据统计

```bash
# 查看总数
psql $DATABASE_URL -c "SELECT COUNT(*) FROM players;"

# 按游戏统计
psql $DATABASE_URL -c "
  SELECT g.name, COUNT(p.id) as player_count
  FROM games g
  LEFT JOIN players p ON g.id = p.\"gameId\"
  GROUP BY g.id, g.name;
"

# 按平台统计
psql $DATABASE_URL -c "
  SELECT platform, COUNT(*) as count
  FROM players
  GROUP BY platform;
"
```

## 常用命令总结

```bash
# 创建示例数据
npm run db:seed

# 查看玩家数据
npm run players:view

# 可视化查看
npx prisma studio

# 重置数据库
npm run db:reset

# 查看管理员
npm run admin:list

# 创建管理员
npm run admin:create
```

## 示例数据的用途

1. **开发测试** - 快速验证功能
2. **UI 展示** - 查看排行榜效果
3. **性能测试** - 测试查询性能
4. **演示** - 向客户展示系统

## 注意事项

1. ⚠️ 示例数据仅用于开发和测试
2. ⚠️ 生产环境不要运行 `db:seed`
3. ⚠️ `db:reset` 会删除所有数据
4. ✅ 使用 `db:seed` 是幂等的（可以重复运行）

## 相关文档

- [PLAYER_TABLE_STRUCTURE.md](./PLAYER_TABLE_STRUCTURE.md) - 表结构说明
- [DATABASE_SETUP.md](./DATABASE_SETUP.md) - 数据库设置
- [prisma/seed.ts](./prisma/seed.ts) - 种子脚本源码
