import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';
import { z } from 'zod';
import { NextRequest } from 'next/server';
import { ErrorCode, type ApiError } from './validations';
import { logger } from './logger';

// 自定义错误类
export class AppError extends Error {
  constructor(
    public code: ErrorCode,
    message: string,
    public statusCode: number = 500,
    public details?: Record<string, any>
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export class ValidationError extends AppError {
  constructor(message: string, details?: Record<string, any>) {
    super(ErrorCode.VALIDATION_ERROR, message, 400, details);
    this.name = 'ValidationError';
  }
}

export class NotFoundError extends AppError {
  constructor(message: string = '资源不存在') {
    super(ErrorCode.NOT_FOUND, message, 404);
    this.name = 'NotFoundError';
  }
}

export class UnauthorizedError extends AppError {
  constructor(message: string = '未授权访问') {
    super(ErrorCode.UNAUTHORIZED, message, 401);
    this.name = 'UnauthorizedError';
  }
}

export class ForbiddenError extends AppError {
  constructor(message: string = '禁止访问') {
    super(ErrorCode.FORBIDDEN, message, 403);
    this.name = 'ForbiddenError';
  }
}

export class ExternalApiError extends AppError {
  constructor(message: string, details?: Record<string, any>) {
    super(ErrorCode.EXTERNAL_API_ERROR, message, 502, details);
    this.name = 'ExternalApiError';
  }
}

export function handleApiError(error: unknown, request?: NextRequest): ApiError {
  // 记录错误日志
  if (request) {
    logger.error('API Error occurred', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      url: request.url,
      method: request.method,
    }, request);
  } else {
    logger.error('API Error occurred', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });
  }

  // 自定义应用错误
  if (error instanceof AppError) {
    return {
      code: error.code,
      message: error.message,
      details: error.details,
    };
  }

  // Prisma 错误处理
  if (error instanceof PrismaClientKnownRequestError) {
    logger.dbOperation('error', 'unknown', undefined, error as Error);
    
    switch (error.code) {
      case 'P2002':
        return {
          code: ErrorCode.DUPLICATE_ENTRY,
          message: '数据已存在，请检查唯一字段',
          details: { field: error.meta?.target },
        };
      case 'P2025':
        return {
          code: ErrorCode.NOT_FOUND,
          message: '记录不存在',
        };
      case 'P2003':
        return {
          code: ErrorCode.VALIDATION_ERROR,
          message: '外键约束失败',
          details: { field: error.meta?.field_name },
        };
      case 'P2014':
        return {
          code: ErrorCode.VALIDATION_ERROR,
          message: '数据关系冲突',
        };
      default:
        return {
          code: ErrorCode.DATABASE_ERROR,
          message: '数据库操作失败',
          details: { code: error.code },
        };
    }
  }

  // Zod 验证错误处理
  if (error instanceof z.ZodError) {
    return {
      code: ErrorCode.VALIDATION_ERROR,
      message: '数据验证失败',
      details: error.issues.reduce((acc: Record<string, string>, err: any) => {
        const path = err.path.join('.');
        acc[path] = err.message;
        return acc;
      }, {}),
    };
  }

  // 网络错误处理
  if (error instanceof TypeError && error.message.includes('fetch')) {
    return {
      code: ErrorCode.EXTERNAL_API_ERROR,
      message: '外部服务连接失败',
    };
  }

  // 通用错误处理
  if (error instanceof Error) {
    // 不要在生产环境暴露详细的错误信息
    const message = process.env.NODE_ENV === 'development' 
      ? error.message 
      : '服务器内部错误';
      
    return {
      code: ErrorCode.DATABASE_ERROR,
      message,
    };
  }

  return {
    code: ErrorCode.DATABASE_ERROR,
    message: '未知错误',
  };
}

// 错误状态码映射
const ERROR_STATUS_MAP: Record<ErrorCode, number> = {
  [ErrorCode.UNAUTHORIZED]: 401,
  [ErrorCode.FORBIDDEN]: 403,
  [ErrorCode.NOT_FOUND]: 404,
  [ErrorCode.VALIDATION_ERROR]: 400,
  [ErrorCode.DUPLICATE_ENTRY]: 409,
  [ErrorCode.EXTERNAL_API_ERROR]: 502,
  [ErrorCode.DATABASE_ERROR]: 500,
};

export function createErrorResponse(error: ApiError, customStatus?: number, request?: NextRequest) {
  const status = customStatus || ERROR_STATUS_MAP[error.code] || 500;
  
  // 记录响应日志
  if (request) {
    logger.apiResponse(request, status, Date.now());
  }
  
  return Response.json(
    {
      success: false,
      error: error.code,
      message: error.message,
      details: error.details,
      timestamp: new Date().toISOString(),
    },
    { status }
  );
}

export function createSuccessResponse<T>(data: T, status: number = 200, request?: NextRequest) {
  // 记录响应日志
  if (request) {
    logger.apiResponse(request, status, Date.now());
  }
  
  return Response.json(
    {
      success: true,
      data,
      timestamp: new Date().toISOString(),
    },
    { status }
  );
}

// API路由包装器，用于统一错误处理和日志记录
export function withErrorHandling(
  handler: (request: NextRequest, context?: any) => Promise<Response>
) {
  return async (request: NextRequest, context?: any): Promise<Response> => {
    const startTime = Date.now();
    
    try {
      // 记录请求开始
      logger.apiRequest(request, startTime);
      
      // 执行处理器
      const response = await handler(request, context);
      
      // 记录成功响应
      logger.apiResponse(request, response.status, startTime);
      
      return response;
    } catch (error) {
      // 处理错误
      const apiError = handleApiError(error, request);
      
      // 记录错误响应
      const status = ERROR_STATUS_MAP[apiError.code] || 500;
      logger.apiResponse(request, status, startTime);
      
      return createErrorResponse(apiError, undefined, request);
    }
  };
}

// 异步操作包装器
export async function withLogging<T>(
  operation: () => Promise<T>,
  operationName: string,
  context?: Record<string, any>
): Promise<T> {
  const startTime = Date.now();
  
  try {
    logger.debug(`Starting ${operationName}`, context);
    const result = await operation();
    const duration = Date.now() - startTime;
    logger.debug(`Completed ${operationName}`, { ...context, duration: `${duration}ms` });
    return result;
  } catch (error) {
    const duration = Date.now() - startTime;
    logger.error(`Failed ${operationName}`, {
      ...context,
      duration: `${duration}ms`,
      error: error instanceof Error ? error.message : String(error),
    });
    throw error;
  }
}