/**
 * 排行榜查询API端点
 * GET /api/leaderboards/[gameId]
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma, QueryOptimizer } from '@/lib/db';
import { ErrorCode } from '@/lib/validations';
import { handleApiError } from '@/lib/error-handler';
import { LeaderboardCache } from '@/lib/cache';
import { DatabaseMonitor } from '@/lib/db-monitor';
import { z } from 'zod';

// 查询参数验证模式
const LeaderboardQuerySchema = z.object({
  platform: z.enum(['WECHAT', 'DOUYIN', 'IOS_APP', 'ANDROID_APP']).optional(),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  offset: z.coerce.number().int().min(0).default(0),
  startRank: z.coerce.number().int().min(1).optional(),
  endRank: z.coerce.number().int().min(1).optional(),
});

export async function GET(
  request: NextRequest,
  { params }: { params: { gameId: string } }
) {
  try {
    const { gameId } = params;
    const { searchParams } = new URL(request.url);
    
    // 验证查询参数
    const queryParams = LeaderboardQuerySchema.parse({
      platform: searchParams.get('platform'),
      limit: searchParams.get('limit'),
      offset: searchParams.get('offset'),
      startRank: searchParams.get('startRank'),
      endRank: searchParams.get('endRank'),
    });

    // 处理排名范围查询
    let skip = queryParams.offset;
    let take = queryParams.limit;

    if (queryParams.startRank && queryParams.endRank) {
      if (queryParams.endRank < queryParams.startRank) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: ErrorCode.VALIDATION_ERROR,
              message: '结束排名不能小于开始排名',
            },
          },
          { status: 400 }
        );
      }
      
      skip = queryParams.startRank - 1;
      take = queryParams.endRank - queryParams.startRank + 1;
    }

    // 生成缓存键
    const cacheKey = `${gameId}_${queryParams.platform || 'all'}_${skip}_${take}`;
    
    // 尝试从缓存获取数据
    const cachedData = await LeaderboardCache.getLeaderboard(cacheKey);
    if (cachedData) {
      return NextResponse.json({
        success: true,
        data: cachedData,
        cached: true,
      });
    }

    // 验证游戏是否存在
    const game = await prisma.game.findUnique({
      where: { id: gameId },
    });

    if (!game) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: ErrorCode.NOT_FOUND,
            message: '游戏不存在',
          },
        },
        { status: 404 }
      );
    }

    // 构建查询条件
    const whereCondition: any = {
      gameId: gameId,
    };

    if (queryParams.platform) {
      whereCondition.platform = queryParams.platform;
    }

    // 获取总玩家数
    const totalPlayers = await prisma.player.count({
      where: whereCondition,
    });

    // 使用优化的查询方法
    const { result: players, duration } = await DatabaseMonitor.measureQueryTime(
      'leaderboard_query',
      () => QueryOptimizer.getOptimizedLeaderboard(
        gameId,
        queryParams.platform,
        take,
        skip
      )
    );

    // 记录查询性能
    if (duration > 500) {
      console.warn(`Slow leaderboard query: ${duration}ms for game ${gameId}`);
    }

    // 计算排名
    const rankings = (players as any[]).map((player: any, index: number) => ({
      rank: skip + index + 1,
      player: {
        id: player.id,
        nickname: player.nickname,
        playerId: player.playerId,
        avatarUrl: player.avatarUrl,
        score: player.score,
        playTime: player.playTime,
        details: player.details,
        platform: player.platform,
        location: player.location,
        createdAt: player.createdAt,
        updatedAt: player.updatedAt,
      },
    }));

    // 检查是否还有更多数据
    const hasMore = skip + take < totalPlayers;

    // 构建响应数据
    const responseData = {
      game: {
        id: game.id,
        name: game.name,
        shortName: game.shortName,
      },
      rankings,
      pagination: {
        total: totalPlayers,
        limit: take,
        offset: skip,
        hasMore,
      },
      filters: {
        platform: queryParams.platform || null,
      },
    };

    // 缓存数据（仅缓存前几页的数据以避免缓存过多）
    if (skip < 100) {
      await LeaderboardCache.setLeaderboard(cacheKey, responseData);
    }

    // 返回成功响应
    return NextResponse.json({
      success: true,
      data: responseData,
    });

  } catch (error) {
    console.error('Leaderboard query error:', error);
    
    const apiError = handleApiError(error);
    return NextResponse.json(
      {
        success: false,
        error: apiError,
      },
      { status: 500 }
    );
  }
}