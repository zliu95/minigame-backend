/**
 * 排名查询API端点
 * GET /api/leaderboards/[gameId]/rank?score=1500&platform=WECHAT
 * 
 * 功能：根据游戏ID和分数，返回该分数在排行榜中的排名
 * - 如果不传入platform参数，返回所有平台的总排名
 * - 如果传入platform参数，返回该平台的排名
 * - 只返回排名数字，不返回具体玩家数据
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { ErrorCode } from '@/lib/validations';
import { handleApiError } from '@/lib/error-handler';
import { z } from 'zod';

// 查询参数验证模式
const RankQuerySchema = z.object({
  score: z.coerce.number().min(0),
  platform: z.enum(['WECHAT', 'DOUYIN', 'IOS_APP', 'ANDROID_APP']).optional(),
});

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ gameId: string }> }
) {
  try {
    const { gameId } = await params;
    const { searchParams } = new URL(request.url);
    
    // 验证查询参数
    const queryParams = RankQuerySchema.parse({
      score: searchParams.get('score'),
      platform: searchParams.get('platform'),
    });

    const { score, platform } = queryParams;

    // 验证游戏是否存在
    const game = await prisma.game.findUnique({
      where: { id: gameId },
      select: { id: true, name: true },
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
      gameId,
      score: {
        gt: score, // 大于指定分数的玩家数量
      },
    };

    // 如果指定了平台，只计算该平台的排名
    if (platform) {
      whereCondition.platform = platform;
    }

    // 计算排名：比该分数高的玩家数量 + 1
    const rank = await prisma.player.count({
      where: whereCondition,
    }) + 1;

    return NextResponse.json({
      success: true,
      data: {
        rank,
      },
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: ErrorCode.VALIDATION_ERROR,
            message: '参数验证失败',
            details: error.issues,
          },
        },
        { status: 400 }
      );
    }

    const apiError = handleApiError(error, request);
    return NextResponse.json(
      {
        success: false,
        error: apiError,
      },
      { status: 500 }
    );
  }
}
