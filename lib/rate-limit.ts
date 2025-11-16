import { NextRequest } from 'next/server';

interface RateLimitConfig {
  windowMs: number; // 时间窗口（毫秒）
  maxRequests: number; // 最大请求数
}

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

// 内存存储（生产环境建议使用Redis）
const rateLimitStore = new Map<string, RateLimitEntry>();

// 默认配置
const DEFAULT_CONFIG: RateLimitConfig = {
  windowMs: 15 * 60 * 1000, // 15分钟
  maxRequests: 100, // 100次请求
};

// API特定配置
const API_CONFIGS: Record<string, RateLimitConfig> = {
  '/api/auth/login': {
    windowMs: 15 * 60 * 1000, // 15分钟
    maxRequests: 5, // 5次登录尝试
  },
  '/api/players/auth': {
    windowMs: 60 * 1000, // 1分钟
    maxRequests: 10, // 10次认证请求
  },
  '/api/players/score': {
    windowMs: 60 * 1000, // 1分钟
    maxRequests: 30, // 30次分值更新
  },
  '/api/games': {
    windowMs: 60 * 1000, // 1分钟
    maxRequests: 20, // 20次游戏操作
  },
};

/**
 * 获取客户端IP地址
 */
function getClientIP(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for');
  const realIP = request.headers.get('x-real-ip');
  
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  
  if (realIP) {
    return realIP;
  }
  
  return 'unknown';
}

/**
 * 获取速率限制配置
 */
function getRateLimitConfig(pathname: string): RateLimitConfig {
  // 精确匹配
  if (API_CONFIGS[pathname]) {
    return API_CONFIGS[pathname];
  }
  
  // 前缀匹配
  for (const [path, config] of Object.entries(API_CONFIGS)) {
    if (pathname.startsWith(path)) {
      return config;
    }
  }
  
  return DEFAULT_CONFIG;
}

/**
 * 清理过期的速率限制记录
 */
function cleanupExpiredEntries(): void {
  const now = Date.now();
  for (const [key, entry] of rateLimitStore.entries()) {
    if (now > entry.resetTime) {
      rateLimitStore.delete(key);
    }
  }
}

/**
 * 检查速率限制
 */
export function checkRateLimit(request: NextRequest): {
  allowed: boolean;
  limit: number;
  remaining: number;
  resetTime: number;
} {
  const ip = getClientIP(request);
  const pathname = request.nextUrl.pathname;
  const config = getRateLimitConfig(pathname);
  
  const key = `${ip}:${pathname}`;
  const now = Date.now();
  
  // 清理过期记录（每100次请求清理一次）
  if (Math.random() < 0.01) {
    cleanupExpiredEntries();
  }
  
  let entry = rateLimitStore.get(key);
  
  if (!entry || now > entry.resetTime) {
    // 创建新的限制记录
    entry = {
      count: 1,
      resetTime: now + config.windowMs,
    };
    rateLimitStore.set(key, entry);
    
    return {
      allowed: true,
      limit: config.maxRequests,
      remaining: config.maxRequests - 1,
      resetTime: entry.resetTime,
    };
  }
  
  // 增加请求计数
  entry.count++;
  
  const allowed = entry.count <= config.maxRequests;
  const remaining = Math.max(0, config.maxRequests - entry.count);
  
  return {
    allowed,
    limit: config.maxRequests,
    remaining,
    resetTime: entry.resetTime,
  };
}

/**
 * 创建速率限制响应
 */
export function createRateLimitResponse(rateLimitInfo: ReturnType<typeof checkRateLimit>) {
  return new Response(
    JSON.stringify({
      success: false,
      message: '请求过于频繁，请稍后再试',
      code: 'RATE_LIMIT_EXCEEDED',
    }),
    {
      status: 429,
      headers: {
        'Content-Type': 'application/json',
        'X-RateLimit-Limit': rateLimitInfo.limit.toString(),
        'X-RateLimit-Remaining': rateLimitInfo.remaining.toString(),
        'X-RateLimit-Reset': new Date(rateLimitInfo.resetTime).toISOString(),
        'Retry-After': Math.ceil((rateLimitInfo.resetTime - Date.now()) / 1000).toString(),
      },
    }
  );
}