/**
 * 数据库性能监控API端点
 * GET /api/admin/db-stats
 */

import { NextRequest, NextResponse } from 'next/server';
import { DatabaseMonitor } from '@/lib/db-monitor';
import { handleApiError } from '@/lib/error-handler';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    // 验证管理员权限
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json(
        { success: false, error: { message: '未授权访问' } },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'overview';

    let data;

    switch (type) {
      case 'overview':
        const [tableStats, connectionStats, recommendations] = await Promise.all([
          DatabaseMonitor.getTableSizes(),
          DatabaseMonitor.getConnectionStats(),
          DatabaseMonitor.getPerformanceRecommendations(),
        ]);

        data = {
          tables: tableStats,
          connections: connectionStats,
          recommendations,
          timestamp: new Date().toISOString(),
        };
        break;

      case 'indexes':
        data = await DatabaseMonitor.getIndexUsage();
        break;

      case 'connections':
        data = await DatabaseMonitor.getConnectionStats();
        break;

      case 'recommendations':
        data = await DatabaseMonitor.getPerformanceRecommendations();
        break;

      default:
        return NextResponse.json(
          { success: false, error: { message: '无效的统计类型' } },
          { status: 400 }
        );
    }

    return NextResponse.json({
      success: true,
      data,
      type,
    });

  } catch (error) {
    console.error('Database stats API error:', error);
    const apiError = handleApiError(error);
    return NextResponse.json(
      { success: false, error: apiError },
      { status: 500 }
    );
  }
}