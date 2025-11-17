import { NextRequest } from 'next/server';

// 允许的来源域名
const ALLOWED_ORIGINS = [
  process.env.NEXTAUTH_URL || 'http://localhost:3000',
  'https://your-production-domain.com', // 替换为实际的生产域名
];

// 允许的User-Agent模式
const ALLOWED_USER_AGENTS = [
  /^Mozilla\/.*/, // 浏览器
  /^okhttp\/.*/, // Android OkHttp
  /^CFNetwork\/.*/, // iOS CFNetwork
  /^WeChat\/.*/, // 微信
  /^ByteDance\/.*/, // 抖音
];

// API密钥验证（用于服务器到服务器的调用）
const API_KEYS = new Set([
  process.env.INTERNAL_API_KEY,
  process.env.GAME_CLIENT_API_KEY,
].filter(Boolean));

/**
 * 验证请求来源
 */
export function validateOrigin(request: NextRequest): {
  valid: boolean;
  reason?: string;
} {
  const origin = request.headers.get('origin');
  const referer = request.headers.get('referer');
  const userAgent = request.headers.get('user-agent');
  const apiKey = request.headers.get('x-api-key');
  
  // 如果提供了有效的API密钥，允许访问
  if (apiKey && API_KEYS.has(apiKey)) {
    return { valid: true };
  }
  
  // 检查User-Agent
  if (!userAgent) {
    return { valid: false, reason: '缺少User-Agent' };
  }
  
  const isValidUserAgent = ALLOWED_USER_AGENTS.some(pattern => 
    pattern.test(userAgent)
  );
  
  if (!isValidUserAgent) {
    return { valid: false, reason: '无效的User-Agent' };
  }
  
  // 对于浏览器请求，检查Origin或Referer
  if (userAgent.includes('Mozilla')) {
    if (origin) {
      if (!ALLOWED_ORIGINS.includes(origin)) {
        return { valid: false, reason: '无效的Origin' };
      }
    } else if (referer) {
      const refererOrigin = new URL(referer).origin;
      if (!ALLOWED_ORIGINS.includes(refererOrigin)) {
        return { valid: false, reason: '无效的Referer' };
      }
    } else {
      return { valid: false, reason: '缺少Origin或Referer' };
    }
  }
  
  return { valid: true };
}

/**
 * 检查是否为可疑请求
 */
export function detectSuspiciousRequest(request: NextRequest): {
  suspicious: boolean;
  reasons: string[];
} {
  const reasons: string[] = [];
  const userAgent = request.headers.get('user-agent') || '';
  const contentLength = request.headers.get('content-length');
  const isDevelopment = process.env.NODE_ENV === 'development';
  
  // 检查异常大的请求体
  if (contentLength && parseInt(contentLength) > 10 * 1024 * 1024) { // 10MB
    reasons.push('请求体过大');
  }
  
  // 检查可疑的User-Agent
  const suspiciousPatterns = [
    /bot/i,
    /crawler/i,
    /spider/i,
    /scraper/i,
    /curl/i,
    /wget/i,
    /python/i,
    /java/i,
  ];
  
  if (suspiciousPatterns.some(pattern => pattern.test(userAgent))) {
    reasons.push('可疑的User-Agent');
  }
  
  // 在生产环境中检查异常的请求头
  // 开发环境跳过这些检查，因为本地代理可能会添加这些头
  if (!isDevelopment) {
    const suspiciousHeaders = [
      'x-forwarded-host',
      'x-cluster-client-ip',
      'x-real-ip',
    ];
    
    for (const header of suspiciousHeaders) {
      if (request.headers.get(header)) {
        const value = request.headers.get(header);
        if (value && !isValidIP(value) && !isValidHost(value)) {
          reasons.push(`异常的${header}头`);
        }
      }
    }
  }
  
  return {
    suspicious: reasons.length > 0,
    reasons,
  };
}

/**
 * 验证IP地址格式
 */
function isValidIP(ip: string): boolean {
  // IPv6 本地地址
  if (ip === '::1' || ip === '::ffff:127.0.0.1') {
    return true;
  }
  
  const ipv4Regex = /^(\d{1,3}\.){3}\d{1,3}$/;
  const ipv6Regex = /^([0-9a-fA-F]{0,4}:){2,7}[0-9a-fA-F]{0,4}$/;
  
  if (ipv4Regex.test(ip)) {
    return ip.split('.').every(octet => {
      const num = parseInt(octet);
      return num >= 0 && num <= 255;
    });
  }
  
  return ipv6Regex.test(ip);
}

/**
 * 验证主机名格式（包括 localhost 和域名）
 */
function isValidHost(host: string): boolean {
  // 移除端口号
  const hostWithoutPort = host.split(':')[0];
  
  // 检查是否是 localhost
  if (hostWithoutPort === 'localhost' || hostWithoutPort === '127.0.0.1') {
    return true;
  }
  
  // 检查是否是有效的域名
  const domainRegex = /^([a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)*[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?$/;
  return domainRegex.test(hostWithoutPort);
}

/**
 * 创建来源验证失败的响应
 */
export function createOriginValidationResponse(reason: string) {
  return new Response(
    JSON.stringify({
      success: false,
      message: '请求来源验证失败',
      code: 'INVALID_ORIGIN',
      details: { reason },
    }),
    {
      status: 403,
      headers: {
        'Content-Type': 'application/json',
      },
    }
  );
}