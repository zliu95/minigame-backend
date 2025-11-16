# 数据库结构更新说明

## 更新内容

将原来的单一 `Player` 表拆分为两个表：

### 1. Player 表（玩家信息）

存储玩家的基本信息：

| 字段 | 类型 | 说明 |
|------|------|------|
| id | String | 主键 |
| openid | String | 平台唯一标识（微信openid、抖音openid等）|
| platform | Enum | 平台（WECHAT, DOUYIN, IOS_APP, ANDROID_APP）|
| nickname | String | 昵称 |
| avatarUrl | String? | 头像URL |
| location | String? | 地理位置 |
| createdAt | DateTime | 创建时间 |
| updatedAt | DateTime | 更新时间 |

**唯一约束：** `(platform, openid)` - 同一平台的openid唯一

### 2. Record 表（游戏记录/排行榜数据）

存储每个玩家在每个游戏中的最佳成绩：

| 字段 | 类型 | 说明 |
|------|------|------|
| id | String | 主键 |
| gameId | String | 游戏ID（外键） |
| playerId | String | 玩家ID（外键） |
| score | Float | 分数（支持小数）|
| duration | Int | 游戏时长（秒）|
| rank | Int? | 排名（可选，可动态计算）|
| detailsJson | Json? | 详细数据（道具、关卡等）|
| createdAt | DateTime | 首次记录时间 |
| updatedAt | DateTime | 最后更新时间 |

**唯一约束：** `(gameId, playerId)` - 每个玩家在每个游戏中只有一条记录

**索引：**
- `(gameId, score DESC)` - 游戏排行榜
- `(gameId, score DESC, updatedAt)` - 带时间的排行榜
- `(gameId, duration ASC)` - 按时长排序
- `(playerId)` - 玩家的所有记录

## 数据结构对比

### 旧结构（单表）

```
Player
├── id
├── gameId
├── nickname
├── playerId
├── avatarUrl
├── score          ← 混合了玩家信息和游戏数据
├── duration
├── details
├── platform
├── openId
└── location
```

**问题：**
- 玩家信息和游戏记录混在一起
- 同一玩家在不同游戏中会重复存储信息
- 不够清晰和规范

### 新结构（分离）

```
Player (玩家信息)          Record (游戏记录)
├── id                     ├── id
├── openid                 ├── gameId → Game
├── platform               ├── playerId → Player
├── nickname               ├── score
├── avatarUrl              ├── duration
├── location               ├── rank
└── timestamps             ├── detailsJson
                           └── timestamps
```

**优点：**
- 清晰分离玩家信息和游戏数据
- 玩家信息只存储一次
- 更容易查询和维护
- 支持一个玩家玩多个游戏

## detailsJson 字段示例

可以存储任意游戏相关的额外数据：

```json
{
  "items_used": {
    "hint": 3,
    "skip": 1,
    "boost": 2
  },
  "level_completed": 15,
  "achievements": ["first_win", "speed_master"],
  "combo_max": 50,
  "accuracy": 0.95,
  "custom_data": {
    "any": "additional",
    "game": "specific",
    "data": "here"
  }
}
```

## 迁移步骤

### 1. 创建新的迁移

```bash
npx prisma migrate dev --name split_player_and_record
```

这会：
- 创建新的 `records` 表
- 修改 `players` 表结构
- 迁移现有数据（如果有）

### 2. 数据迁移（如果有现有数据）

如果数据库中已有数据，需要手动迁移：

```sql
-- 1. 创建新的 Player 记录（去重）
INSERT INTO players (id, openid, platform, nickname, "avatarUrl", location, "createdAt", "updatedAt")
SELECT DISTINCT ON (platform, "openId")
  gen_random_uuid()::text,
  "openId",
  platform,
  nickname,
  "avatarUrl",
  location::text,
  "createdAt",
  "updatedAt"
FROM players_old
WHERE "openId" IS NOT NULL;

-- 2. 创建 Record 记录
INSERT INTO records (id, "gameId", "playerId", score, duration, "detailsJson", "createdAt", "updatedAt")
SELECT 
  old.id,
  old."gameId",
  new.id as "playerId",
  old.score::float,
  old."duration",
  old.details,
  old."createdAt",
  old."updatedAt"
FROM players_old old
JOIN players new ON new.openid = old."openId" AND new.platform = old.platform;
```

### 3. 验证迁移

```bash
# 查看新表结构
npx prisma studio

# 或使用 SQL
psql $DATABASE_URL -c "\d players"
psql $DATABASE_URL -c "\d records"
```

## API 更新

需要更新以下 API 端点以使用新的表结构：

### 1. 玩家认证 API (`/api/players/auth`)

```typescript
// 创建或更新玩家信息
const player = await prisma.player.upsert({
  where: {
    platform_openid: {
      platform: 'WECHAT',
      openid: openid,
    },
  },
  update: {
    nickname,
    avatarUrl,
    location,
  },
  create: {
    openid,
    platform: 'WECHAT',
    nickname,
    avatarUrl,
    location,
  },
});
```

### 2. 更新分数 API (`/api/players/score`)

```typescript
// 更新或创建游戏记录
const record = await prisma.record.upsert({
  where: {
    gameId_playerId: {
      gameId,
      playerId,
    },
  },
  update: {
    score: newScore,
    duration: newDuration,
    detailsJson: details,
  },
  create: {
    gameId,
    playerId,
    score: newScore,
    duration: newDuration,
    detailsJson: details,
  },
});
```

### 3. 排行榜查询 API (`/api/leaderboards/[gameId]`)

```typescript
// 查询排行榜
const records = await prisma.record.findMany({
  where: { gameId },
  include: {
    player: {
      select: {
        nickname: true,
        avatarUrl: true,
        platform: true,
      },
    },
  },
  orderBy: { score: 'desc' },
  take: 100,
});
```

## 排名计算

### 方法 1：动态计算（推荐）

不存储 rank 字段，查询时动态计算：

```typescript
const records = await prisma.$queryRaw`
  SELECT 
    r.*,
    ROW_NUMBER() OVER (ORDER BY r.score DESC) as rank,
    p.nickname,
    p."avatarUrl",
    p.platform
  FROM records r
  JOIN players p ON r."playerId" = p.id
  WHERE r."gameId" = ${gameId}
  ORDER BY r.score DESC
  LIMIT 100
`;
```

### 方法 2：预计算存储

定期更新 rank 字段（适合大数据量）：

```typescript
// 批量更新排名
await prisma.$executeRaw`
  UPDATE records r
  SET rank = ranked.rank
  FROM (
    SELECT id, ROW_NUMBER() OVER (
      PARTITION BY "gameId" 
      ORDER BY score DESC
    ) as rank
    FROM records
  ) ranked
  WHERE r.id = ranked.id
`;
```

## 查询示例

### 1. 获取玩家在所有游戏中的记录

```typescript
const playerRecords = await prisma.record.findMany({
  where: { playerId },
  include: {
    game: {
      select: {
        name: true,
        shortName: true,
      },
    },
  },
  orderBy: { score: 'desc' },
});
```

### 2. 获取游戏的前100名

```typescript
const topRecords = await prisma.record.findMany({
  where: { gameId },
  include: {
    player: true,
  },
  orderBy: { score: 'desc' },
  take: 100,
});
```

### 3. 按平台分组的排行榜

```typescript
const recordsByPlatform = await prisma.record.findMany({
  where: {
    gameId,
    player: {
      platform: 'WECHAT',
    },
  },
  include: {
    player: true,
  },
  orderBy: { score: 'desc' },
});
```

### 4. 获取玩家排名

```typescript
const playerRank = await prisma.$queryRaw`
  SELECT COUNT(*) + 1 as rank
  FROM records
  WHERE "gameId" = ${gameId}
    AND score > (
      SELECT score FROM records 
      WHERE "gameId" = ${gameId} AND "playerId" = ${playerId}
    )
`;
```

## 性能优化

### 1. 索引已优化

新结构包含了所有必要的索引，支持：
- 快速排行榜查询
- 按分数排序
- 按时长排序
- 玩家记录查询

### 2. 使用连接查询

```typescript
// 一次查询获取所有需要的数据
const leaderboard = await prisma.record.findMany({
  where: { gameId },
  include: {
    player: {
      select: {
        nickname: true,
        avatarUrl: true,
        platform: true,
      },
    },
  },
  orderBy: { score: 'desc' },
  take: 100,
});
```

### 3. 缓存排行榜

```typescript
// 使用 Redis 缓存热门排行榜
const cacheKey = `leaderboard:${gameId}`;
let leaderboard = await redis.get(cacheKey);

if (!leaderboard) {
  leaderboard = await prisma.record.findMany({...});
  await redis.setex(cacheKey, 300, JSON.stringify(leaderboard));
}
```

## 总结

新的数据库结构：
- ✅ 清晰分离玩家信息和游戏记录
- ✅ 避免数据重复
- ✅ 更容易维护和查询
- ✅ 支持灵活的排行榜查询
- ✅ 支持存储详细的游戏数据（detailsJson）
- ✅ 优化的索引提升查询性能

## 下一步

1. 运行迁移：`npx prisma migrate dev`
2. 更新 API 代码以使用新结构
3. 更新前端组件
4. 测试所有功能
