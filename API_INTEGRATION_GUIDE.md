# API 集成指南

## 平台差异说明

### CORS 跨域问题

**重要：** CORS（跨域资源共享）**只影响浏览器环境**，不影响原生移动应用。

| 平台 | 是否受 CORS 限制 | 说明 |
|------|-----------------|------|
| **H5 游戏** | ✅ 是 | 浏览器强制执行 CORS 策略 |
| **微信小程序** | ✅ 是 | 类似浏览器，需要配置域名白名单 |
| **抖音小程序** | ✅ 是 | 类似浏览器，需要配置域名白名单 |
| **iOS App** | ❌ 否 | 原生应用，直接 HTTP 请求 |
| **Android App** | ❌ 否 | 原生应用，直接 HTTP 请求 |

## iOS/Android App 集成

### 特点

1. **无 CORS 限制** - 可以直接调用任何域名的 API
2. **需要身份验证** - 使用 API Key 或 Token
3. **需要标识平台** - 在请求中标明来源

### 推荐的请求头

```http
POST /api/players/auth HTTP/1.1
Host: your-api-domain.com
Content-Type: application/json
X-Platform: IOS_APP
X-App-Version: 1.0.0
X-Device-ID: unique-device-id
User-Agent: YourGame/1.0.0 (iOS 17.0)
```

### iOS Swift 示例

```swift
import Foundation

class GameAPI {
    static let baseURL = "https://your-api-domain.com"
    
    // 玩家认证
    static func authenticatePlayer(
        gameId: String,
        playerId: String,
        completion: @escaping (Result<PlayerData, Error>) -> Void
    ) {
        let url = URL(string: "\(baseURL)/api/players/auth")!
        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        
        // 设置请求头
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        request.setValue("IOS_APP", forHTTPHeaderField: "X-Platform")
        request.setValue(Bundle.main.appVersion, forHTTPHeaderField: "X-App-Version")
        
        // 请求体
        let body: [String: Any] = [
            "gameId": gameId,
            "playerId": playerId,
            "platform": "IOS_APP",
            "nickname": "Player Name",
            "avatarUrl": "https://..."
        ]
        
        request.httpBody = try? JSONSerialization.data(withJSONObject: body)
        
        // 发送请求
        URLSession.shared.dataTask(with: request) { data, response, error in
            if let error = error {
                completion(.failure(error))
                return
            }
            
            guard let data = data else {
                completion(.failure(NSError(domain: "NoData", code: -1)))
                return
            }
            
            // 解析响应
            do {
                let result = try JSONDecoder().decode(PlayerData.self, from: data)
                completion(.success(result))
            } catch {
                completion(.failure(error))
            }
        }.resume()
    }
    
    // 更新分数
    static func updateScore(
        gameId: String,
        playerId: String,
        score: Double,
        duration: Int,
        details: [String: Any]? = nil,
        completion: @escaping (Result<ScoreResponse, Error>) -> Void
    ) {
        let url = URL(string: "\(baseURL)/api/players/score")!
        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        request.setValue("IOS_APP", forHTTPHeaderField: "X-Platform")
        
        var body: [String: Any] = [
            "gameId": gameId,
            "playerId": playerId,
            "score": score,
            "duration": duration,
            "platform": "IOS_APP"
        ]
        
        if let details = details {
            body["details"] = details
        }
        
        request.httpBody = try? JSONSerialization.data(withJSONObject: body)
        
        URLSession.shared.dataTask(with: request) { data, response, error in
            // 处理响应...
        }.resume()
    }
    
    // 获取排行榜
    static func getLeaderboard(
        gameId: String,
        platform: String? = nil,
        limit: Int = 100,
        completion: @escaping (Result<[LeaderboardEntry], Error>) -> Void
    ) {
        var components = URLComponents(string: "\(baseURL)/api/leaderboards/\(gameId)")!
        var queryItems: [URLQueryItem] = [
            URLQueryItem(name: "limit", value: "\(limit)")
        ]
        
        if let platform = platform {
            queryItems.append(URLQueryItem(name: "platform", value: platform))
        }
        
        components.queryItems = queryItems
        
        var request = URLRequest(url: components.url!)
        request.httpMethod = "GET"
        request.setValue("IOS_APP", forHTTPHeaderField: "X-Platform")
        
        URLSession.shared.dataTask(with: request) { data, response, error in
            // 处理响应...
        }.resume()
    }
}

// 数据模型
struct PlayerData: Codable {
    let id: String
    let nickname: String
    let score: Double
    let rank: Int?
}

struct ScoreResponse: Codable {
    let success: Bool
    let data: PlayerData?
}

struct LeaderboardEntry: Codable {
    let rank: Int
    let nickname: String
    let score: Double
    let avatarUrl: String?
    let platform: String
}
```

### Android Kotlin 示例

```kotlin
import okhttp3.*
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.RequestBody.Companion.toRequestBody
import org.json.JSONObject
import java.io.IOException

class GameAPI {
    companion object {
        private const val BASE_URL = "https://your-api-domain.com"
        private val client = OkHttpClient()
        private val JSON = "application/json; charset=utf-8".toMediaType()
        
        // 玩家认证
        fun authenticatePlayer(
            gameId: String,
            playerId: String,
            callback: (Result<PlayerData>) -> Unit
        ) {
            val json = JSONObject().apply {
                put("gameId", gameId)
                put("playerId", playerId)
                put("platform", "ANDROID_APP")
                put("nickname", "Player Name")
            }
            
            val body = json.toString().toRequestBody(JSON)
            val request = Request.Builder()
                .url("$BASE_URL/api/players/auth")
                .post(body)
                .addHeader("X-Platform", "ANDROID_APP")
                .addHeader("X-App-Version", BuildConfig.VERSION_NAME)
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
                        // 解析 JSON 并返回
                        // callback(Result.success(playerData))
                    }
                }
            })
        }
        
        // 更新分数
        fun updateScore(
            gameId: String,
            playerId: String,
            score: Double,
            duration: Int,
            details: Map<String, Any>? = null,
            callback: (Result<ScoreResponse>) -> Unit
        ) {
            val json = JSONObject().apply {
                put("gameId", gameId)
                put("playerId", playerId)
                put("score", score)
                put("duration", duration)
                put("platform", "ANDROID_APP")
                details?.let { put("details", JSONObject(it)) }
            }
            
            val body = json.toString().toRequestBody(JSON)
            val request = Request.Builder()
                .url("$BASE_URL/api/players/score")
                .post(body)
                .addHeader("X-Platform", "ANDROID_APP")
                .build()
            
            client.newCall(request).enqueue(object : Callback {
                override fun onFailure(call: Call, e: IOException) {
                    callback(Result.failure(e))
                }
                
                override fun onResponse(call: Call, response: Response) {
                    // 处理响应...
                }
            })
        }
        
        // 获取排行榜
        fun getLeaderboard(
            gameId: String,
            platform: String? = null,
            limit: Int = 100,
            callback: (Result<List<LeaderboardEntry>>) -> Unit
        ) {
            val urlBuilder = HttpUrl.Builder()
                .scheme("https")
                .host("your-api-domain.com")
                .addPathSegments("api/leaderboards/$gameId")
                .addQueryParameter("limit", limit.toString())
            
            platform?.let {
                urlBuilder.addQueryParameter("platform", it)
            }
            
            val request = Request.Builder()
                .url(urlBuilder.build())
                .get()
                .addHeader("X-Platform", "ANDROID_APP")
                .build()
            
            client.newCall(request).enqueue(object : Callback {
                override fun onFailure(call: Call, e: IOException) {
                    callback(Result.failure(e))
                }
                
                override fun onResponse(call: Call, response: Response) {
                    // 处理响应...
                }
            })
        }
    }
}

// 数据类
data class PlayerData(
    val id: String,
    val nickname: String,
    val score: Double,
    val rank: Int?
)

data class ScoreResponse(
    val success: Boolean,
    val data: PlayerData?
)

data class LeaderboardEntry(
    val rank: Int,
    val nickname: String,
    val score: Double,
    val avatarUrl: String?,
    val platform: String
)
```

## H5 游戏集成（需要 CORS）

### JavaScript/TypeScript 示例

```typescript
// API 客户端
class GameAPIClient {
  private baseURL = 'https://your-api-domain.com';
  
  // 玩家认证
  async authenticatePlayer(data: {
    gameId: string;
    playerId: string;
    platform: 'WECHAT' | 'DOUYIN';
    code: string;
  }) {
    const response = await fetch(`${this.baseURL}/api/players/auth`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    return await response.json();
  }
  
  // 更新分数
  async updateScore(data: {
    gameId: string;
    playerId: string;
    score: number;
    duration: number;
    details?: any;
  }) {
    const response = await fetch(`${this.baseURL}/api/players/score`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        ...data,
        platform: 'WECHAT', // 或 'DOUYIN'
      }),
    });
    
    return await response.json();
  }
  
  // 获取排行榜
  async getLeaderboard(
    gameId: string,
    options?: {
      platform?: string;
      limit?: number;
      offset?: number;
    }
  ) {
    const params = new URLSearchParams();
    if (options?.platform) params.append('platform', options.platform);
    if (options?.limit) params.append('limit', options.limit.toString());
    if (options?.offset) params.append('offset', options.offset.toString());
    
    const response = await fetch(
      `${this.baseURL}/api/leaderboards/${gameId}?${params}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
    
    return await response.json();
  }
}

// 使用示例
const api = new GameAPIClient();

// 微信小程序中使用
wx.login({
  success: async (res) => {
    if (res.code) {
      const result = await api.authenticatePlayer({
        gameId: 'your-game-id',
        playerId: 'player-id',
        platform: 'WECHAT',
        code: res.code,
      });
      console.log('认证成功:', result);
    }
  }
});
```

## 服务端 CORS 配置

### 当前配置（lib/security-headers.ts）

```typescript
export const CORS_CONFIG = {
  // 允许的来源（仅对浏览器有效）
  allowedOrigins: [
    process.env.NEXTAUTH_URL || 'http://localhost:3000',
    'https://your-production-domain.com',
  ],
  
  // 允许的方法
  allowedMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  
  // 允许的头部
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'X-Requested-With',
    'X-API-Key',
    'X-Platform',      // 添加平台标识
    'X-App-Version',   // 添加应用版本
  ],
}
```

### 建议的配置更新

对于 iOS/Android App，可以：

1. **不检查 Origin**（因为原生应用没有 Origin 头）
2. **使用 X-Platform 头部识别来源**
3. **使用 API Key 或 Token 进行身份验证**

## API 端点说明

### 1. 玩家认证

```http
POST /api/players/auth
Content-Type: application/json
X-Platform: IOS_APP | ANDROID_APP | WECHAT | DOUYIN

{
  "gameId": "game-id",
  "playerId": "player-id",
  "platform": "IOS_APP",
  "nickname": "Player Name",
  "avatarUrl": "https://...",
  "code": "auth-code" // 仅小程序需要
}
```

### 2. 更新分数

```http
POST /api/players/score
Content-Type: application/json
X-Platform: IOS_APP

{
  "gameId": "game-id",
  "playerId": "player-id",
  "score": 1500.5,
  "duration": 3600,
  "platform": "IOS_APP",
  "details": {
    "items_used": {"hint": 3},
    "level": 15
  }
}
```

### 3. 获取排行榜

```http
GET /api/leaderboards/{gameId}?platform=IOS_APP&limit=100
X-Platform: IOS_APP
```

## 安全建议

### iOS/Android App

1. **使用 HTTPS** - 加密传输
2. **证书固定** - 防止中间人攻击
3. **请求签名** - 防止篡改
4. **设备指纹** - 识别设备
5. **版本控制** - 强制更新旧版本

### 示例：请求签名（iOS）

```swift
func signRequest(body: [String: Any], secret: String) -> String {
    let timestamp = Int(Date().timeIntervalSince1970)
    let jsonData = try! JSONSerialization.data(withJSONObject: body)
    let bodyString = String(data: jsonData, encoding: .utf8)!
    
    let signString = "\(bodyString)\(timestamp)\(secret)"
    let signature = signString.sha256() // 使用 SHA256
    
    return signature
}

// 在请求中添加
request.setValue(signature, forHTTPHeaderField: "X-Signature")
request.setValue("\(timestamp)", forHTTPHeaderField: "X-Timestamp")
```

## 小程序特殊配置

### 微信小程序

需要在微信公众平台配置服务器域名：

```
request合法域名：
https://your-api-domain.com
```

### 抖音小程序

需要在抖音开发者平台配置服务器域名：

```
request合法域名：
https://your-api-domain.com
```

## 总结

| 特性 | iOS/Android App | H5/小程序 |
|------|----------------|-----------|
| CORS 限制 | ❌ 无 | ✅ 有 |
| Origin 头部 | ❌ 无 | ✅ 有 |
| 需要域名白名单 | ❌ 否 | ✅ 是（小程序） |
| 推荐认证方式 | API Key/Token | OAuth/Code |
| 请求头标识 | X-Platform | Origin |

## 相关文档

- [lib/security-headers.ts](./lib/security-headers.ts) - CORS 配置
- [lib/origin-validation.ts](./lib/origin-validation.ts) - 来源验证
- [API 文档](./README.md#api-接口) - 完整 API 说明
