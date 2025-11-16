import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // 安全配置
  poweredByHeader: false, // 隐藏X-Powered-By头部
  
  // 压缩配置
  compress: true,
  
  // 输出配置（用于Docker部署）
  output: 'standalone',
  
  // 图片优化配置
  images: {
    domains: [
      'localhost',
      // 添加允许的图片域名
    ],
    dangerouslyAllowSVG: false, // 禁用SVG以防止XSS
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },
  
  // 重定向配置
  async redirects() {
    return [
      // 注意：HTTPS 重定向应该在 Nginx/负载均衡器层面处理
      // 如果需要在应用层强制 HTTPS，请取消下面的注释并配置正确的域名
      // ...(process.env.NODE_ENV === 'production' && process.env.FORCE_HTTPS === 'true' ? [{
      //   source: '/(.*)',
      //   has: [
      //     {
      //       type: 'header' as const,
      //       key: 'x-forwarded-proto',
      //       value: 'http',
      //     },
      //   ],
      //   destination: 'https://your-actual-domain.com/$1',
      //   permanent: true,
      // }] : []),
    ];
  },
  
  // 头部配置
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          // 基础安全头部（作为备用，主要在middleware中设置）
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'off',
          },
          {
            key: 'X-Download-Options',
            value: 'noopen',
          },
          {
            key: 'X-Permitted-Cross-Domain-Policies',
            value: 'none',
          },
        ],
      },
      {
        source: '/api/(.*)',
        headers: [
          // API特定头部
          {
            key: 'X-Robots-Tag',
            value: 'noindex, nofollow, nosnippet, noarchive',
          },
        ],
      },
      {
        source: '/((?!api).*)',
        headers: [
          // 静态资源缓存
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
    ];
  },
  
  // Turbopack配置（Next.js 16+默认使用）
  turbopack: {},
  
  // Webpack配置
  webpack: (config, { dev }) => {
    // 生产环境优化
    if (!dev) {
      config.optimization = {
        ...config.optimization,
        minimize: true,
      };
    }
    
    return config;
  },
  
  // 环境变量配置
  env: {
    CUSTOM_KEY: process.env.CUSTOM_KEY,
  },
};

export default nextConfig;
