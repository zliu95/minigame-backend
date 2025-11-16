import { NextRequest } from 'next/server';

export enum LogLevel {
  ERROR = 'error',
  WARN = 'warn',
  INFO = 'info',
  DEBUG = 'debug',
}

export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  context?: Record<string, any>;
  requestId?: string;
  userId?: string;
  ip?: string;
  userAgent?: string;
}

class Logger {
  private isDevelopment = process.env.NODE_ENV === 'development';

  private formatLog(entry: LogEntry): string {
    const { timestamp, level, message, context, requestId, userId, ip } = entry;
    
    if (this.isDevelopment) {
      // 开发环境：简洁格式
      const contextStr = context ? ` | Context: ${JSON.stringify(context)}` : '';
      return `[${timestamp}] ${level.toUpperCase()}: ${message}${contextStr}`;
    } else {
      // 生产环境：结构化JSON格式
      return JSON.stringify({
        timestamp,
        level,
        message,
        context,
        requestId,
        userId,
        ip,
      });
    }
  }

  private log(level: LogLevel, message: string, context?: Record<string, any>, request?: NextRequest): void {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      context,
    };

    // 从请求中提取信息
    if (request) {
      entry.requestId = request.headers.get('x-request-id') || undefined;
      entry.ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || undefined;
      entry.userAgent = request.headers.get('user-agent') || undefined;
      
      // 尝试从认证头或会话中获取用户ID
      const authHeader = request.headers.get('authorization');
      if (authHeader) {
        // 这里可以解析JWT获取用户ID，暂时跳过
        entry.userId = 'authenticated-user';
      }
    }

    const logMessage = this.formatLog(entry);

    // 根据日志级别选择输出方法
    switch (level) {
      case LogLevel.ERROR:
        console.error(logMessage);
        break;
      case LogLevel.WARN:
        console.warn(logMessage);
        break;
      case LogLevel.INFO:
        console.info(logMessage);
        break;
      case LogLevel.DEBUG:
        if (this.isDevelopment) {
          console.debug(logMessage);
        }
        break;
    }

    // 在生产环境中，这里可以添加外部日志服务集成
    // 例如：发送到 Winston、Pino、或云日志服务
  }

  error(message: string, context?: Record<string, any>, request?: NextRequest): void {
    this.log(LogLevel.ERROR, message, context, request);
  }

  warn(message: string, context?: Record<string, any>, request?: NextRequest): void {
    this.log(LogLevel.WARN, message, context, request);
  }

  info(message: string, context?: Record<string, any>, request?: NextRequest): void {
    this.log(LogLevel.INFO, message, context, request);
  }

  debug(message: string, context?: Record<string, any>, request?: NextRequest): void {
    this.log(LogLevel.DEBUG, message, context, request);
  }

  // API请求日志
  apiRequest(request: NextRequest, startTime: number): void {
    const duration = Date.now() - startTime;
    this.info('API Request', {
      method: request.method,
      url: request.url,
      duration: `${duration}ms`,
    }, request);
  }

  // API响应日志
  apiResponse(request: NextRequest, status: number, startTime: number): void {
    const duration = Date.now() - startTime;
    const level = status >= 400 ? LogLevel.ERROR : LogLevel.INFO;
    
    this.log(level, 'API Response', {
      method: request.method,
      url: request.url,
      status,
      duration: `${duration}ms`,
    }, request);
  }

  // 数据库操作日志
  dbOperation(operation: string, table: string, duration?: number, error?: Error): void {
    if (error) {
      this.error('Database Operation Failed', {
        operation,
        table,
        duration: duration ? `${duration}ms` : undefined,
        error: error.message,
        stack: error.stack,
      });
    } else {
      this.debug('Database Operation', {
        operation,
        table,
        duration: duration ? `${duration}ms` : undefined,
      });
    }
  }

  // 外部API调用日志
  externalApi(service: string, endpoint: string, status?: number, duration?: number, error?: Error): void {
    if (error) {
      this.error('External API Call Failed', {
        service,
        endpoint,
        status,
        duration: duration ? `${duration}ms` : undefined,
        error: error.message,
      });
    } else {
      this.info('External API Call', {
        service,
        endpoint,
        status,
        duration: duration ? `${duration}ms` : undefined,
      });
    }
  }
}

// 单例实例
export const logger = new Logger();

// 便捷的日志装饰器
export function logDbOperation<T extends (...args: any[]) => Promise<any>>(
  operation: string,
  table: string
) {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      const startTime = Date.now();
      try {
        const result = await originalMethod.apply(this, args);
        const duration = Date.now() - startTime;
        logger.dbOperation(operation, table, duration);
        return result;
      } catch (error) {
        const duration = Date.now() - startTime;
        logger.dbOperation(operation, table, duration, error as Error);
        throw error;
      }
    };

    return descriptor;
  };
}