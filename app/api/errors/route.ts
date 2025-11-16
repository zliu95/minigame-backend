import { NextRequest } from 'next/server';
import { z } from 'zod';
import { withErrorHandling, createSuccessResponse } from '@/lib/error-handler';
import { logger } from '@/lib/logger';

// 错误报告数据验证模式
const ErrorReportSchema = z.object({
  message: z.string(),
  stack: z.string().optional(),
  componentStack: z.string().optional(),
  timestamp: z.string(),
  userAgent: z.string().optional(),
  url: z.string().optional(),
  userId: z.string().optional(),
  additionalInfo: z.record(z.any()).optional(),
});

export const POST = withErrorHandling(async (request: NextRequest) => {
  const body = await request.json();
  const errorReport = ErrorReportSchema.parse(body);

  // 记录前端错误
  logger.error('Frontend Error Report', {
    message: errorReport.message,
    stack: errorReport.stack,
    componentStack: errorReport.componentStack,
    userAgent: errorReport.userAgent,
    url: errorReport.url,
    userId: errorReport.userId,
    additionalInfo: errorReport.additionalInfo,
  }, request);

  // 在生产环境中，这里可以：
  // 1. 发送到外部错误监控服务（如 Sentry）
  // 2. 存储到数据库用于分析
  // 3. 发送告警通知

  if (process.env.NODE_ENV === 'production') {
    // 示例：发送到外部监控服务
    // await sendToMonitoringService(errorReport);
    
    // 示例：存储到数据库
    // await storeErrorReport(errorReport);
  }

  return createSuccessResponse(
    { message: '错误报告已记录' },
    200,
    request
  );
});

// 获取错误统计信息（仅开发环境）
export const GET = withErrorHandling(async (request: NextRequest) => {
  if (process.env.NODE_ENV !== 'development') {
    return createSuccessResponse(
      { message: '此端点仅在开发环境可用' },
      403,
      request
    );
  }

  // 这里可以返回错误统计信息
  // 在实际应用中，可以从数据库或日志系统获取
  const errorStats = {
    totalErrors: 0,
    recentErrors: [],
    errorsByType: {},
    errorsByPage: {},
  };

  return createSuccessResponse(errorStats, 200, request);
});