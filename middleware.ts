import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";
import { checkRateLimit, createRateLimitResponse } from "./lib/rate-limit";
import { validateOrigin, createOriginValidationResponse, detectSuspiciousRequest } from "./lib/origin-validation";
import { applySecurityHeaders, applyCorsHeaders, enforceHttps, createOptionsResponse } from "./lib/security-headers";

export default withAuth(
  function middleware(req) {
    const { pathname } = req.nextUrl;
    const origin = req.headers.get('origin');
    const method = req.method;
    
    // 强制HTTPS（生产环境）
    const httpsRedirect = enforceHttps(req);
    if (httpsRedirect) {
      return httpsRedirect;
    }
    
    // 处理CORS预检请求
    if (method === 'OPTIONS') {
      return createOptionsResponse(origin);
    }
    
    // API路由的安全检查
    if (pathname.startsWith("/api/")) {
      // 速率限制检查
      const rateLimitResult = checkRateLimit(req);
      if (!rateLimitResult.allowed) {
        return createRateLimitResponse(rateLimitResult);
      }
      
      // 来源验证（仅对敏感API）
      if (isSensitiveApiRoute(pathname)) {
        const originValidation = validateOrigin(req);
        if (!originValidation.valid) {
          return createOriginValidationResponse(originValidation.reason || '来源验证失败');
        }
      }
      
      // 可疑请求检测
      const suspiciousCheck = detectSuspiciousRequest(req);
      if (suspiciousCheck.suspicious) {
        console.warn(`可疑请求检测到: ${pathname}`, {
          ip: req.ip,
          userAgent: req.headers.get('user-agent'),
          reasons: suspiciousCheck.reasons,
        });
        
        // 对于高风险请求，直接拒绝
        if (suspiciousCheck.reasons.includes('请求体过大')) {
          return new Response(
            JSON.stringify({
              success: false,
              message: '请求被拒绝',
              code: 'SUSPICIOUS_REQUEST',
            }),
            { status: 400, headers: { 'Content-Type': 'application/json' } }
          );
        }
      }
      
      // 创建响应并添加安全头部
      let response = NextResponse.next();
      
      // 应用安全头部
      response = applySecurityHeaders(response);
      
      // 应用CORS头部
      response = applyCorsHeaders(response, origin, method);
      
      // 添加速率限制头部
      response.headers.set('X-RateLimit-Limit', rateLimitResult.limit.toString());
      response.headers.set('X-RateLimit-Remaining', rateLimitResult.remaining.toString());
      response.headers.set('X-RateLimit-Reset', new Date(rateLimitResult.resetTime).toISOString());
      
      // 检查是否是公开的API路由
      if (isPublicApiRoute(pathname)) {
        return response;
      }
      
      // 对于受保护的API路由，检查认证
      if (!req.nextauth.token) {
        const errorResponse = new Response(
          JSON.stringify({ success: false, message: "未授权访问" }),
          { status: 401, headers: { "content-type": "application/json" } }
        );
        return applySecurityHeaders(NextResponse.json(
          { success: false, message: "未授权访问" },
          { status: 401 }
        ));
      }
      
      return response;
    }
    
    // 如果用户已登录但访问登录页面，重定向到首页
    if (pathname === "/login" && req.nextauth.token) {
      return NextResponse.redirect(new URL("/", req.url));
    }

    // 为所有其他请求应用安全头部
    let response = NextResponse.next();
    response = applySecurityHeaders(response);
    response = applyCorsHeaders(response, origin, method);
    
    return response;
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const { pathname } = req.nextUrl;
        
        // 登录页面始终允许访问
        if (pathname === "/login") {
          return true;
        }
        
        // 公开的API路由允许访问
        if (pathname.startsWith("/api/") && isPublicApiRoute(pathname)) {
          return true;
        }
        
        // 其他路由需要认证
        return !!token;
      },
    },
  }
);

function isPublicApiRoute(pathname: string): boolean {
  const publicApiRoutes = [
    "/api/auth/",
    "/api/players/auth",
    "/api/players/score", 
    "/api/leaderboards",
  ];

  return publicApiRoutes.some(route => pathname.startsWith(route));
}

function isSensitiveApiRoute(pathname: string): boolean {
  const sensitiveApiRoutes = [
    "/api/auth/login",
    "/api/games",
    "/api/admin",
  ];

  return sensitiveApiRoutes.some(route => pathname.startsWith(route));
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    "/((?!_next/static|_next/image|favicon.ico|public/).*)",
  ],
};
