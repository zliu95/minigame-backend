# iOS/Android 玩家认证修复说明

## 修复内容

修复了 iOS 和 Android 平台在玩家认证时忽略传入 `nickname` 的问题。

### 问题描述

之前的实现中，iOS 和 Android 平台会自动生成默认昵称（如 `iOS玩家_abc123`），而忽略客户端传入的 `nickname` 参数。

### 修复后的行为

现在 iOS 和 Android 平台会：
1. **优先使用**客户端传入的 `nickname`、`avatarUrl` 和 `location`
2. 如果没有传入，才使用默认值

## API 使用说明

### 请求格式

```http
POST /api/players/auth
Content-Type: application/json
X-Platform: IOS_APP

{
  "gameId": "your-game-id",
  "playerId": "unique-player-id",
  "platform": "IOS_APP",
  "nickname": "玩家昵称",        // ✅ 现在会被正确保存
  "avatarUrl": "https://..."    // ✅ 可选，会被保存
}
```

### iOS Swift 示例

```swift
import Foundation

class GameAPI {
    static let baseURL = "https://your-api-domain.com"
    
    // 玩家认证 - 传入自定义昵称和头像
    static func authenticatePlayer(
        gameId: String,
        playerId: String,
        nickname: String,
        avatarUrl: String? = nil,
        completion: @escaping (Result<AuthResponse, Error>) -> Void
    ) {
        let url = URL(string: "\(baseURL)/api/players/auth")!
        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        request.setValue("IOS_APP", forHTTPHeaderField: "X-Platform")
        
        var body: [String: Any] = [
            "gameId": gameId,
            "playerId": playerId,
            "platform": "IOS_APP",
            "nickname": nickname  // ✅ 会被保存到数据库
        ]
        
        // 可选：添加头像URL
        if let avatarUrl = avatarUrl {
            body["avatarUrl"] = avatarUrl
        }
        
        do {
            request.httpBody = try JSONSerialization.data(withJSONObject: body)
        } catch {
            completion(.failure(error))
            return
        }
        
        URLSession.shared.dataTask(with: request) { data, response, error in
            if let error = error {
                completion(.failure(error))
                return
            }
            
            guard let data = data else {
                completion(.failure(NSError(domain: "NoData", code: -1)))
                return
            }
            
            do {
                let decoder = JSONDecoder()
                let result = try decoder.decode(AuthResponse.self, from: data)
                completion(.success(result))
            } catch {
                completion(.failure(error))
            }
        }.resume()
    }
}

// 使用示例
func loginPlayer() {
    let playerId = UIDevice.current.identifierForVendor?.uuidString ?? UUID().uuidString
    
    GameAPI.authenticatePlayer(
        gameId: "your-game-id",
        playerId: playerId,
        nickname: "张三",  // ✅ 自定义昵称
        avatarUrl: "https://example.com/avatar.jpg"  // ✅ 自定义头像
    ) { result in
        switch result {
        case .success(let response):
            print("认证成功: \(response.data.player.nickname)")  // 输出: 认证成功: 张三
        case .failure(let error):
            print("认证失败: \(error)")
        }
    }
}
```

### Android Kotlin 示例

```kotlin
import okhttp3.*
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.RequestBody.Companion.toRequestBody
import org.json.JSONObject

class GameAPI {
    companion object {
        private const val BASE_URL = "https://your-api-domain.com"
        private val client = OkHttpClient()
        private val JSON = "application/json; charset=utf-8".toMediaType()
        
        // 玩家认证 - 传入自定义昵称和头像
        fun authenticatePlayer(
            gameId: String,
            playerId: String,
            nickname: String,
            avatarUrl: String? = null,
            callback: (Result<AuthResponse>) -> Unit
        ) {
            val json = JSONObject().apply {
                put("gameId", gameId)
                put("playerId", playerId)
                put("platform", "ANDROID_APP")
                put("nickname", nickname)  // ✅ 会被保存到数据库
                avatarUrl?.let { put("avatarUrl", it) }
            }
            
            val body = json.toString().toRequestBody(JSON)
            val request = Request.Builder()
                .url("$BASE_URL/api/players/auth")
                .post(body)
                .addHeader("X-Platform", "ANDROID_APP")
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
                        // 解析并返回结果
                    }
                }
            })
        }
    }
}

// 使用示例
fun loginPlayer() {
    val playerId = Settings.Secure.getString(
        contentResolver,
        Settings.Secure.ANDROID_ID
    )
    
    GameAPI.authenticatePlayer(
        gameId = "your-game-id",
        playerId = playerId,
        nickname = "李四",  // ✅ 自定义昵称
        avatarUrl = "https://example.com/avatar.jpg"  // ✅ 自定义头像
    ) { result ->
        result.onSuccess { response ->
            println("认证成功: ${response.data.player.nickname}")  // 输出: 认证成功: 李四
        }.onFailure { error ->
            println("认证失败: $error")
        }
    }
}
```

## 字段说明

### 必需字段

| 字段 | 类型 | 说明 |
|------|------|------|
| gameId | string | 游戏ID |
| playerId | string | 玩家唯一标识 |
| platform | string | 平台类型（IOS_APP 或 ANDROID_APP） |
| nickname | string | 玩家昵称 |

### 可选字段

| 字段 | 类型 | 说明 |
|------|------|------|
| avatarUrl | string | 玩家头像URL |
| location | object | 位置信息 { country, province, city } |

## 默认值行为

如果不传入可选字段，系统会使用以下默认值：

- **nickname 未传入**：使用 `iOS玩家_xxx` 或 `Android玩家_xxx`（xxx 为 playerId 后6位）
- **avatarUrl 未传入**：为 `null`
- **location 未传入**：为 `null`

## 测试方法

### 方法 1：使用 H5 测试页面

访问 http://localhost:3000/test-h5.html

1. 选择平台为 "iOS App" 或 "Android App"
2. 输入自定义昵称
3. 点击"获取 Token"
4. 检查返回的玩家信息中的昵称是否正确

### 方法 2：使用 curl 命令

```bash
# 获取游戏ID
GAME_ID="your-game-id"

# iOS 平台测试
curl -X POST http://localhost:3000/api/players/auth \
  -H "Content-Type: application/json" \
  -H "X-Platform: IOS_APP" \
  -d '{
    "gameId": "'$GAME_ID'",
    "playerId": "test_ios_001",
    "platform": "IOS_APP",
    "nickname": "测试iOS玩家",
    "avatarUrl": "https://example.com/avatar.jpg"
  }'

# Android 平台测试
curl -X POST http://localhost:3000/api/players/auth \
  -H "Content-Type: application/json" \
  -H "X-Platform: ANDROID_APP" \
  -d '{
    "gameId": "'$GAME_ID'",
    "playerId": "test_android_001",
    "platform": "ANDROID_APP",
    "nickname": "测试Android玩家",
    "avatarUrl": "https://example.com/avatar.jpg"
  }'
```

## 数据库验证

认证成功后，可以在数据库中验证数据：

```sql
-- 查看最新创建的玩家
SELECT id, nickname, playerId, platform, avatarUrl, createdAt 
FROM players 
ORDER BY createdAt DESC 
LIMIT 5;
```

应该能看到传入的 `nickname` 和 `avatarUrl` 已正确保存。

## 相关文件

- `lib/external-apis.ts` - 外部API服务（已修复）
- `app/api/players/auth/route.ts` - 玩家认证接口
- `public/test-h5.html` - H5 测试页面

## 更新日志

- **2024-11-17**: 修复 iOS/Android 平台忽略传入 nickname 的问题
