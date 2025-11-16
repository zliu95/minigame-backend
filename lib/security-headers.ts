import { NextResponse } from 'next/server';

/**
 * 安全响应头配置
 */
export const SECURITY_HEADERS = {
  // 内容安全策略
  'Content-Security-Policy': [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval'", // Next.js需要unsafe-inline和unsafe-eval
    "style-src 'self' 'unsafe-inline'", // Tailwind CSS需要unsafe-inline
    "img-src 'self' data: https:",
    "font-src 'self' data:",
    "connect-src 'self' https:",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'",
  ].join('; '),
  
  // 防止点击劫持
  'X-Frame-Options': 'DENY',
  
  // 防止MIME类型嗅探
  'X-Content-Type-Options': 'nosniff',
  
  // XSS保护
  'X-XSS-Protection': '1; mode=block',
  
  // 引用者策略
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  
  // 权限策略
  'Permissions-Policy': [
    'camera=()',
    'microphone=()',
    'geolocation=()',
    'payment=()',
    'usb=()',
  ].join(', '),
  
  // 严格传输安全（仅HTTPS）
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload',
  
  // 防止缓存敏感信息
  'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
  'Pragma': 'no-cache',
  'Expires': '0',
};

/**
 * CORS配置
 */
export const CORS_CONFIG = {
  // 允许的来源
  allowedOrigins: [
    process.env.NEXTAUTH_URL || 'http://localhost:3000',
    'https://your-production-domain.com', // 替换为实际的生产域名
  ],
  
  // 允许的方法
  allowedMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  
  // 允许的头部
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'X-Requested-With',
    'X-API-Key',
  ],
  
  // 暴露的头部
  exposedHeaders: [
    'X-RateLimit-Limit',
    'X-RateLimit-Remaining',
    'X-RateLimit-Reset',
  ],
  
  // 是否允许凭据
  credentials: true,
  
  // 预检请求缓存时间
  maxAge: 86400, // 24小时
};

/**
 * 应用安全头部到响应
 */
export function applySecurityHeaders(response: NextResponse): NextResponse {
  // 应用安全头部
  Object.entries(SECURITY_HEADERS).forEach(([key, value]) => {
    response.headers.set(key, value);
  });
  
  return response;
}

/**
 * 应用CORS头部到响应
 */
export function applyCorsHeaders(
  response: NextResponse,
  origin?: string | null,
  method?: string
): NextResponse {
  // 检查来源是否被允许
  if (origin && CORS_CONFIG.allowedOrigins.includes(origin)) {
    response.headers.set('Access-Control-Allow-Origin', origin);
  }
  
  // 设置其他CORS头部
  response.headers.set(
    'Access-Control-Allow-Methods',
    CORS_CONFIG.allowedMethods.join(', ')
  );
  
  response.headers.set(
    'Access-Control-Allow-Headers',
    CORS_CONFIG.allowedHeaders.join(', ')
  );
  
  response.headers.set(
    'Access-Control-Expose-Headers',
    CORS_CONFIG.exposedHeaders.join(', ')
  );
  
  if (CORS_CONFIG.credentials) {
    response.headers.set('Access-Control-Allow-Credentials', 'true');
  }
  
  // 预检请求缓存
  if (method === 'OPTIONS') {
    response.headers.set('Access-Control-Max-Age', CORS_CONFIG.maxAge.toString());
  }
  
  return response;
}

/**
 * 创建OPTIONS响应（用于CORS预检）
 */
export function createOptionsResponse(origin?: string | null): NextResponse {
  const response = new NextResponse(null, { status: 200 });
  return applyCorsHeaders(response, origin, 'OPTIONS');
}

/**
 * 检查是否为安全的HTTPS连接
 */
export function isSecureConnection(request: Request): boolean {
  const protocol = request.headers.get('x-forwarded-proto') || 
                   new URL(request.url).protocol;
  
  return protocol === 'https:' || process.env.NODE_ENV === 'development';
}

/**
 * 强制HTTPS重定向
 */
export function enforceHttps(request: Request): NextResponse | null {
  if (process.env.NODE_ENV === 'production' && !isSecureConnection(request)) {
    const url = new URL(request.url);
    url.protocol = 'https:';
    
    return NextResponse.redirect(url, { status: 301 });
  }
  
  return null;
}