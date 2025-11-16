import { NextRequest } from 'next/server';
import { logger } from './logger';

/**
 * 安全事件类型
 */
export enum SecurityEventType {
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',
  INVALID_ORIGIN = 'INVALID_ORIGIN',
  SUSPICIOUS_REQUEST = 'SUSPICIOUS_REQUEST',
  AUTHENTICATION_FAILURE = 'AUTHENTICATION_FAILURE',
  UNAUTHORIZED_ACCESS = 'UNAUTHORIZED_ACCESS',
  DATA_VALIDATION_FAILURE = 'DATA_VALIDATION_FAILURE',
  ENCRYPTION_ERROR = 'ENCRYPTION_ERROR',
}

/**
 * 安全事件接口
 */
export interface SecurityEvent {
  type: SecurityEventType;
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  details?: Record<string, any>;
  request?: {
    ip: string;
    userAgent: string;
    path: string;
    method: string;
  };
  timestamp: Date;
}

/**
 * 记录安全事件
 */
export function logSecurityEvent(event: Omit<SecurityEvent, 'timestamp'>): void {
  const fullEvent: SecurityEvent = {
    ...event,
    timestamp: new Date(),
  };
  
  // 根据严重程度选择日志级别
  switch (event.severity) {
    case 'critical':
      logger.error('安全事件 - 严重', fullEvent);
      break;
    case 'high':
      logger.error('安全事件 - 高', fullEvent);
      break;
    case 'medium':
      logger.warn('安全事件 - 中', fullEvent);
      break;
    case 'low':
      logger.info('安全事件 - 低', fullEvent);
      break;
  }
  
  // 在生产环境中，可以发送到安全监控系统
  if (process.env.NODE_ENV === 'production' && event.severity === 'critical') {
    // 发送到安全监控系统（如Sentry、DataDog等）
    // sendToSecurityMonitoring(fullEvent);
  }
}

/**
 * 从请求中提取安全相关信息
 */
export function extractRequestInfo(request: NextRequest) {
  return {
    ip: request.headers.get('x-forwarded-for') || 
        request.headers.get('x-real-ip') || 
        'unknown',
    userAgent: request.headers.get('user-agent') || 'unknown',
    path: request.nextUrl.pathname,
    method: request.method,
  };
}

/**
 * 检查IP是否在黑名单中
 */
export function isBlacklistedIP(ip: string): boolean {
  // 这里可以实现IP黑名单检查
  // 可以从数据库、Redis或配置文件中读取黑名单
  const blacklistedIPs: string[] = [
    // 添加需要屏蔽的IP地址
  ];
  
  return blacklistedIPs.includes(ip);
}

/**
 * 检查User-Agent是否可疑
 */
export function isSuspiciousUserAgent(userAgent: string): boolean {
  const suspiciousPatterns = [
    /sqlmap/i,
    /nikto/i,
    /nessus/i,
    /masscan/i,
    /nmap/i,
    /dirb/i,
    /dirbuster/i,
    /gobuster/i,
    /wfuzz/i,
    /burp/i,
    /zap/i,
  ];
  
  return suspiciousPatterns.some(pattern => pattern.test(userAgent));
}

/**
 * 验证请求体大小
 */
export function validateRequestSize(request: NextRequest, maxSize: number = 10 * 1024 * 1024): boolean {
  const contentLength = request.headers.get('content-length');
  if (contentLength) {
    const size = parseInt(contentLength, 10);
    return size <= maxSize;
  }
  return true;
}

/**
 * 生成CSP nonce
 */
export function generateCSPNonce(): string {
  const crypto = require('crypto');
  return crypto.randomBytes(16).toString('base64');
}

/**
 * 清理和验证文件路径
 */
export function sanitizeFilePath(path: string): string {
  // 移除危险字符和路径遍历尝试
  return path
    .replace(/\.\./g, '') // 移除路径遍历
    .replace(/[<>:"|?*]/g, '') // 移除文件名中的危险字符
    .replace(/^\/+/, '') // 移除开头的斜杠
    .trim();
}

/**
 * 验证文件类型
 */
export function validateFileType(filename: string, allowedTypes: string[]): boolean {
  const extension = filename.split('.').pop()?.toLowerCase();
  return extension ? allowedTypes.includes(extension) : false;
}

/**
 * 创建安全的随机字符串
 */
export function generateSecureRandomString(length: number = 32): string {
  const crypto = require('crypto');
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  
  for (let i = 0; i < length; i++) {
    const randomIndex = crypto.randomInt(0, chars.length);
    result += chars[randomIndex];
  }
  
  return result;
}

/**
 * 验证JWT token格式（不验证签名）
 */
export function validateJWTFormat(token: string): boolean {
  const parts = token.split('.');
  if (parts.length !== 3) {
    return false;
  }
  
  try {
    // 验证每个部分都是有效的base64
    parts.forEach(part => {
      Buffer.from(part, 'base64');
    });
    return true;
  } catch {
    return false;
  }
}

/**
 * 检查密码强度
 */
export function checkPasswordStrength(password: string): {
  score: number;
  feedback: string[];
} {
  const feedback: string[] = [];
  let score = 0;
  
  // 长度检查
  if (password.length >= 8) {
    score += 1;
  } else {
    feedback.push('密码长度至少8位');
  }
  
  // 包含大写字母
  if (/[A-Z]/.test(password)) {
    score += 1;
  } else {
    feedback.push('包含至少一个大写字母');
  }
  
  // 包含小写字母
  if (/[a-z]/.test(password)) {
    score += 1;
  } else {
    feedback.push('包含至少一个小写字母');
  }
  
  // 包含数字
  if (/\d/.test(password)) {
    score += 1;
  } else {
    feedback.push('包含至少一个数字');
  }
  
  // 包含特殊字符
  if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    score += 1;
  } else {
    feedback.push('包含至少一个特殊字符');
  }
  
  return { score, feedback };
}

/**
 * 安全地解析JSON
 */
export function safeJsonParse(jsonString: string, maxDepth: number = 10): any {
  try {
    const parsed = JSON.parse(jsonString);
    
    // 检查对象深度
    function checkDepth(obj: any, depth: number = 0): boolean {
      if (depth > maxDepth) {
        return false;
      }
      
      if (typeof obj === 'object' && obj !== null) {
        for (const key in obj) {
          if (!checkDepth(obj[key], depth + 1)) {
            return false;
          }
        }
      }
      
      return true;
    }
    
    if (!checkDepth(parsed)) {
      throw new Error('JSON对象嵌套过深');
    }
    
    return parsed;
  } catch (error) {
    throw new Error('JSON解析失败');
  }
}