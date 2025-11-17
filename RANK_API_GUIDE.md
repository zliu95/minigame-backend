# 排名查询 API 指南

## API 端点

```
GET /api/leaderboards/{gameId}/rank?score={score}&platform={platform}
```

## 功能说明

根据游戏ID和分数，返回该分数在排行榜中的排名位置。

**重要更新**：
- ✅ 只返回排名数字，不返回具体玩家数据
- ✅ platform 参数为可选：
  - 不传 platform：返回所有平台的总排名
  - 传入 platform：返回该平台的排名

## 请求参数

### 路径参数

| 参数 | 类型 | 必需 | 说明 |
|------|------|------|------|
| gameId | string | ✅ | 游戏ID |

### 查询参数

| 参数 | 类型 | 必需 | 说明 | 示例 |
|------|------|------|------|------|
| score | number | ✅ | 要查询的分数 | `1500.5` |
| platform | enum | ❌ | 平台类型（可选）| `WECHAT`, `DOUYIN`, `IOS_APP`, `ANDROID_APP` |

**platform 参数说明**：
- 不传：查询所有平台的总排名
- 传入：查询指定平台的排名

## 请求示例

### 1. 查询全平台排名（不传 platform）

```bash
curl "http://localhost:3000/api/leaderboards/game-id-123/rank?score=1500"
```

响应：
```json
{
  "success": true,
  "data": {
    "rank": 5
  }
}
```

### 2. 查询特定平台排名（传入 platform）

```bash
curl "http://localhost:3000/api/leaderboards/game-id-123/rank?score=1500&platform=IOS_APP"
```

响应：
```json
{
  "success": true,
  "data": {
    "rank": 3
  }
}
```

### 3. 查询小数分数排名

```bash
curl "http://localhost:3000/api/leaderboards/game-id-123/rank?score=1500.5"
```

响应：
```json
{
  "success": true,
  "data": {
    "rank": 12
  }
}
```

## 响应格式

### 成功响应 (200 OK)

```json
{
  "success": true,
  "data": {
    "rank": 5
  }
}
```

### 响应字段说明

| 字段 | 类型 | 说明 |
|------|------|------|
| success | boolean | 请求是否成功 |
| data.rank | number | 排名位置（1表示第一名） |

### 错误响应

#### 游戏不存在 (404)

```json
{
  "success": false,
  "error": {
    "code": "NOT_FOUND",
    "message": "游戏不存在"
  }
}
```

#### 参数验证失败 (400)

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "参数验证失败",
    "details": [
      {
        "code": "invalid_type",
        "expected": "number",
        "received": "string",
        "path": ["score"],
        "message": "Expected number, received string"
      }
    ]
  }
}
```

## 使用场景

### 场景 1：游戏结束时显示排名

玩家完成游戏后，显示他们的分数在排行榜中的位置。

```typescript
// 游戏客户端代码
async function showGameResult(gameId: string, finalScore: number, platform?: string) {
  const url = platform 
    ? `https://api.your-domain.com/api/leaderboards/${gameId}/rank?score=${finalScore}&platform=${platform}`
    : `https://api.your-domain.com/api/leaderboards/${gameId}/rank?score=${finalScore}`;
    
  const response = await fetch(url);
  const result = await response.json();
  
  if (result.success) {
    const { rank } = result.data;
    
    alert(`
      你的分数: ${finalScore}
      排名: 第 ${rank} 名
    `);
  }
}
```

### 场景 2：预测排名

在游戏进行中，实时显示当前分数的预测排名。

```typescript
// 实时排名预测
async function predictRank(gameId: string, currentScore: number, platform?: string) {
  const url = platform 
    ? `https://api.your-domain.com/api/leaderboards/${gameId}/rank?score=${currentScore}&platform=${platform}`
    : `https://api.your-domain.com/api/leaderboards/${gameId}/rank?score=${currentScore}`;
    
  const response = await fetch(url);
  const result = await response.json();
  
  if (result.success) {
    updateUI({
      predictedRank: result.data.rank,
    });
  }
}
```

### 场景 3：目标设定

显示达到特定排名需要的分数。

```typescript
// 查询不同分数的排名
async function findScoreForRank(gameId: string, targetRank: number) {
  // 二分查找最接近目标排名的分数
  let low = 0;
  let high = 10000;
  
  while (low < high) {
    const mid = Math.floor((low + high) / 2);
    const response = await fetch(
      `https://api.your-domain.com/api/leaderboards/${gameId}/rank?score=${mid}`
    );
    const result = await response.json();
    
    if (result.data.rank > targetRank) {
      low = mid + 1;
    } else {
      high = mid;
    }
  }
  
  return low;
}
```

## iOS Swift 示例

```swift
func getRankForScore(gameId: String, score: Double, platform: String? = nil, completion: @escaping (Result<Int, Error>) -> Void) {
    var urlString = "https://api.your-domain.com/api/leaderboards/\(gameId)/rank?score=\(score)"
    if let platform = platform {
        urlString += "&platform=\(platform)"
    }
    
    guard let url = URL(string: urlString) else { return }
    
    var request = URLRequest(url: url)
    request.httpMethod = "GET"
    
    URLSession.shared.dataTask(with: request) { data, response, error in
        if let error = error {
            completion(.failure(error))
            return
        }
        
        guard let data = data else { return }
        
        do {
            let result = try JSONDecoder().decode(RankResponse.self, from: data)
            if result.success {
                completion(.success(result.data.rank))
            }
        } catch {
            completion(.failure(error))
        }
    }.resume()
}

struct RankResponse: Codable {
    let success: Bool
    let data: RankData
}

struct RankData: Codable {
    let rank: Int
}
```

## Android Kotlin 示例

```kotlin
fun getRankForScore(
    gameId: String,
    score: Double,
    platform: String? = null,
    callback: (Result<Int>) -> Unit
) {
    var url = "https://api.your-domain.com/api/leaderboards/$gameId/rank?score=$score"
    if (platform != null) {
        url += "&platform=$platform"
    }
    
    val request = Request.Builder()
        .url(url)
        .get()
        .build()
    
    client.newCall(request).enqueue(object : Callback {
        override fun onFailure(call: Call, e: IOException) {
            callback(Result.failure(e))
        }
        
        override fun onResponse(call: Call, response: Response) {
            response.use {
                if (!response.isSuccessful) {
                    callback(Result.failure(IOException("Unexpected code $response")))
                    return
                }
                
                val responseData = response.body?.string()
                val result = Gson().fromJson(responseData, RankResponse::class.java)
                
                if (result.success) {
                    callback(Result.success(result.data.rank))
                }
            }
        }
    })
}

data class RankResponse(
    val success: Boolean,
    val data: RankData
)

data class RankData(
    val rank: Int
)
```

## 性能考虑

### 1. 缓存策略

对于热门游戏，可以缓存常见分数的排名：

```typescript
// 伪代码
const cacheKey = `rank:${gameId}:${score}:${platform}`;
const cached = await redis.get(cacheKey);

if (cached) {
  return JSON.parse(cached);
}

// 查询数据库...
await redis.setex(cacheKey, 60, JSON.stringify(result)); // 缓存1分钟
```

### 2. 索引优化

确保数据库有适当的索引：

```sql
-- 已在 schema.prisma 中定义
CREATE INDEX idx_players_game_score ON players(game_id, score DESC);
CREATE INDEX idx_players_game_platform_score ON players(game_id, platform, score DESC);
```

### 3. 查询优化

对于大量玩家的游戏，考虑使用近似排名算法或预计算排名。

## 注意事项

1. **相同分数处理**：多个玩家获得相同分数时，他们会获得相同的排名
2. **实时性**：排名是实时计算的，反映当前排行榜状态
3. **平台参数**：
   - 不传 platform：返回所有平台的总排名
   - 传入 platform：返回该平台的排名
4. **性能**：对于百万级玩家的游戏，建议使用缓存或预计算排名
5. **简化响应**：接口只返回排名数字，不返回玩家详细数据，提高性能

## 相关 API

- `POST /api/players/score` - 更新玩家分数
- `GET /api/leaderboards/[gameId]` - 获取完整排行榜
- `GET /api/analytics/overview` - 获取统计数据

## 更新日志

- **v2.0.0** (2024-11-17): 
  - 简化响应格式，只返回排名数字
  - platform 参数改为可选，不传则返回全平台排名
- **v1.0.0** (2024-11-16): 初始版本，支持基本排名查询功能
