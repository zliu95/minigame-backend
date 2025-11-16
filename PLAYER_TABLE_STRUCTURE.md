# Player 表结构说明

## 概述

Player 表采用**单表设计**，同时包含玩家信息和排行榜数据。这种设计简单直接，适合中小规模应用。

## 表结构

### Player 表字段

| 字段 | 类型 | 说明 | 示例 |
|------|------|------|------|
| **id** | String | 主键，自动生成 | `clxxx...` |
| **gameId** | String | 游戏ID（外键） | `clyyy...` |
| **openid** | String | 平台唯一标识 | `wx_openid_123` |
| **nickname** | String | 玩家昵称 | `玩家小明` |
| **avatarUrl** | String? | 头像URL | `https://...` |
| **score** | Float | 分数（支持小数） | `1500.5` |
| **duration** | Int | 游戏时长（秒） | `3600` |
| **detailsJson** | Json? | 详细数据 | `{"items": {...}}` |
| **platform** | Enum | 平台类型 | `WECHAT` |
| **location** | String? | 地理位置 | `中国-北京-北京` |
| **createdAt** | DateTime | 创建时间 | `2024-11-16...` |
| **updatedAt** | DateTime | 更新时间 | `2024-11-16...` |

### 平台枚举（Platform）

```typescript
enum Platform {
  WECHAT      // 微信小程序
  DOUYIN      // 抖音小程序
  IOS_APP     // iOS应用
  ANDROID_APP // Android应用
}
```

## 唯一约束

```prisma
@@unique([gameId, openid, platform])
```

**含义：** 同一个游戏中，同一平台的同一个玩家（openid）只能有一条记录。

**示例：**
- ✅ 允许：玩家A在游戏1的微信平台有一条记录
- ✅ 允许：玩家A在游戏1的抖音平台有一条记录（不同平台）
- ✅ 允许：玩家A在游戏2的微信平台有一条记录（不同游戏）
- ❌ 不允许：玩家A在游戏1的微信平台有两条记录

## 索引优化

为了提升查询性能，创建了以下索引：

```prisma
@@index([gameId, score(sort: Desc)])           // 游戏总排行榜
@@index([gameId, platform, score(sort: Desc)]) // 按平台的排行榜
@@index([gameId, duration(sort: Asc)])         // 按时长排序
@@index([gameId, createdAt])                   // 按创建时间
@@index([gameId, updatedAt])                   // 按更新时间
@@index([gameId, score(sort: Desc), updatedAt]) // 排行榜（带时间）
@@index([platform, createdAt])                 // 按平台和时间
```

## detailsJson 字段用法

可以存储任意游戏相关的额外数据：

### 示例 1：道具使用情况

```json
{
  "items_used": {
    "hint": 3,
    "skip": 1,
    "boost": 2
  },
  "total_items": 6
}
```

### 示例 2：关卡信息

```json
{
  "level_completed": 15,
  "highest_level": 20,
  "stars_earned": 42
}
```

### 示例 3：成就和统计

```json
{
  "achievements": ["first_win", "speed_master", "perfect_score"],
  "combo_max": 50,
  "accuracy": 0.95,
  "perfect_rounds": 8
}
```

### 示例 4：综合数据

```json
{
  "items": {
    "hint": 3,
    "skip": 1
  },
  "level": 15,
  "achievements": ["first_win"],
  "stats": {
    "combo_max": 50,
    "accuracy": 0.95
  },
  "custom": {
    "any_field": "any_value"
  }
}
```

## 常用查询

### 1. 获取游戏排行榜（前100名）

```typescript
const leaderboard = await prisma.player.findMany({
  where: { gameId },
  orderBy: { score: 'desc' },
  take: 100,
  select: {
    id: true,
    nickname: true,
    avatarUrl: true,
    score: true,
    duration: true,
    platform: true,
    updatedAt: true,
  },
});
```

### 2. 按平台获取排行榜

```typescript
const wechatLeaderboard = await prisma.player.findMany({
  where: {
    gameId,
    platform: 'WECHAT',
  },
  orderBy: { score: 'desc' },
  take: 100,
});
```

### 3. 获取玩家排名

```typescript
// 方法1：计算排名
const rank = await prisma.player.count({
  where: {
    gameId,
    score: {
      gt: playerScore, // 大于当前玩家分数的数量
    },
  },
}) + 1;

// 方法2：使用原生SQL
const result = await prisma.$queryRaw`
  SELECT COUNT(*) + 1 as rank
  FROM players
  WHERE "gameId" = ${gameId}
    AND score > (
      SELECT score FROM players 
      WHERE "gameId" = ${gameId} 
        AND openid = ${openid}
        AND platform = ${platform}
    )
`;
```

### 4. 更新或创建玩家记录

```typescript
const player = await prisma.player.upsert({
  where: {
    gameId_openid_platform: {
      gameId,
      openid,
      platform: 'WECHAT',
    },
  },
  update: {
    nickname,
    avatarUrl,
    score: newScore,
    duration: newDuration,
    detailsJson: details,
    location,
  },
  create: {
    gameId,
    openid,
    platform: 'WECHAT',
    nickname,
    avatarUrl,
    score: newScore,
    duration: newDuration,
    detailsJson: details,
    location,
  },
});
```

### 5. 获取玩家在所有游戏中的记录

```typescript
const playerRecords = await prisma.player.findMany({
  where: {
    openid,
    platform: 'WECHAT',
  },
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

### 6. 获取游戏统计

```typescript
const stats = await prisma.player.aggregate({
  where: { gameId },
  _count: true,
  _avg: { score: true, duration: true },
  _max: { score: true },
  _min: { score: true },
});
```

## 数据示例

```typescript
{
  id: "clxxx123",
  gameId: "clyyy456",
  openid: "wx_openid_abc123",
  nickname: "玩家小明",
  avatarUrl: "https://example.com/avatar.jpg",
  score: 1500.5,
  duration: 3600,
  detailsJson: {
    items_used: { hint: 3, skip: 1 },
    level_completed: 15,
    achievements: ["first_win"]
  },
  platform: "WECHAT",
  location: "中国-北京-北京",
  createdAt: "2024-11-16T10:00:00Z",
  updatedAt: "2024-11-16T12:00:00Z"
}
```

## 设计优势

### ✅ 优点

1. **简单直接** - 单表设计，易于理解和维护
2. **查询高效** - 排行榜查询只需访问一个表
3. **索引优化** - 针对常用查询创建了索引
4. **灵活扩展** - detailsJson 可以存储任意额外数据
5. **支持小数** - score 使用 Float 类型

### ⚠️ 注意事项

1. **数据重复** - 同一玩家在不同游戏中会重复存储昵称、头像等信息
2. **更新成本** - 如果玩家修改昵称，需要更新所有游戏的记录
3. **适用规模** - 适合中小规模应用（百万级记录以内）

## 何时考虑拆分表？

如果遇到以下情况，可以考虑拆分为 Player 和 Record 两个表：

1. 玩家数据更新频繁（如昵称、头像经常变化）
2. 需要跨游戏的玩家统计
3. 数据量超过千万级
4. 需要记录玩家的历史成绩（不只是最佳成绩）

## 迁移到新结构

如果将来需要拆分表，可以参考 [DATABASE_SCHEMA_UPDATE.md](./DATABASE_SCHEMA_UPDATE.md)

## 相关文档

- [DATABASE_SETUP.md](./DATABASE_SETUP.md) - 数据库设置
- [prisma/schema.prisma](./prisma/schema.prisma) - 完整 Schema 定义
- [Prisma 文档](https://www.prisma.io/docs)
