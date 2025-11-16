/**
 * 玩家分值更新API端点
 * POST /api/players/score
 */

import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { UpdateScoreSchema } from '@/lib/validations';
import { withErrorHandling, createSuccessResponse, UnauthorizedError, NotFoundError, ForbiddenError, withLogging } from '@/lib/error-handler';
import { verifyPlayerToken } from '@/lib/jwt';
import { logger } from '@/lib/logger';
import { LeaderboardCache } from '@/lib/cache';

export const POST = withErrorHandling(async (request: NextRequest) => {
  // 解析请求体
  const body = await request.json();
  
  // 验证输入数据
  const validatedData = UpdateScoreSchema.parse(body);
  
  logger.info('Score update request', {
    score: validatedData.score,
    playTime: validatedData.playTime,
    hasDetails: !!validatedData.details,
  }, request);

  // 验证token
  let tokenPayload;
  try {
    tokenPayload = verifyPlayerToken(validatedData.token);
  } catch (error) {
    logger.warn('Invalid token for score update', {
      error: error instanceof Error ? error.message : String(error),
    }, request);
    throw new UnauthorizedError('Token无效或已过期');
  }

  // 查找玩家记录
  const player = await withLogging(
    () => prisma.player.findUnique({
      where: { id: tokenPayload.playerId },
      include: { game: true },
    }),
    'find player for score update',
    { playerId: tokenPayload.playerId }
  );

  if (!player) {
    logger.warn('Player not found for score update', {
      playerId: tokenPayload.playerId,
    }, request);
    throw new NotFoundError('玩家不存在');
  }

  // 验证游戏ID匹配
  if (player.gameId !== tokenPayload.gameId) {
    logger.warn('Game ID mismatch for score update', {
      playerGameId: player.gameId,
      tokenGameId: tokenPayload.gameId,
      playerId: player.id,
    }, request);
    throw new ForbiddenError('游戏ID不匹配');
  }

  logger.info('Updating player score', {
    playerId: player.id,
    nickname: player.nickname,
    oldScore: player.score,
    newScore: validatedData.score,
    gameId: player.gameId,
  }, request);

  // 更新玩家分值和游戏时长
  const updatedPlayer = await withLogging(
    () => prisma.player.update({
      where: { id: player.id },
      data: {
        score: validatedData.score,
        playTime: validatedData.playTime,
        details: validatedData.details,
        updatedAt: new Date(),
      },
    }),
    'update player score',
    { playerId: player.id, newScore: validatedData.score }
  );

  logger.dbOperation('UPDATE', 'player', undefined);

  // 计算当前排名
  const currentRank = await withLogging(
    () => prisma.player.count({
      where: {
        gameId: player.gameId,
        score: {
          gt: validatedData.score,
        },
      },
    }),
    'calculate player rank',
    { gameId: player.gameId, score: validatedData.score }
  ) + 1;

  // 获取总玩家数
  const totalPlayers = await withLogging(
    () => prisma.player.count({
      where: {
        gameId: player.gameId,
      },
    }),
    'count total players',
    { gameId: player.gameId }
  );

  // 获取周围排名信息（前后各5名）
  const nearbyPlayers = await withLogging(
    () => prisma.player.findMany({
      where: {
        gameId: player.gameId,
      },
      orderBy: [
        { score: 'desc' },
        { updatedAt: 'asc' },
      ],
      skip: Math.max(0, currentRank - 6),
      take: 11,
      select: {
        id: true,
        nickname: true,
        avatarUrl: true,
        score: true,
        playTime: true,
        platform: true,
      },
    }),
    'fetch nearby players',
    { gameId: player.gameId, currentRank }
  );

  logger.dbOperation('SELECT', 'player', undefined);

  // 计算周围排名
  const nearbyRankings = nearbyPlayers.map((p, index) => ({
    rank: Math.max(1, currentRank - 5) + index,
    player: p,
  }));

  // 清除相关缓存
  await LeaderboardCache.invalidateLeaderboard(player.gameId);
  await LeaderboardCache.invalidatePlayerRank(player.gameId, player.id);

  logger.info('Score update completed', {
    playerId: updatedPlayer.id,
    nickname: updatedPlayer.nickname,
    newScore: updatedPlayer.score,
    currentRank,
    totalPlayers,
  }, request);

  // 返回成功响应
  return createSuccessResponse({
    currentRank,
    totalPlayers,
    player: {
      id: updatedPlayer.id,
      nickname: updatedPlayer.nickname,
      avatarUrl: updatedPlayer.avatarUrl,
      score: updatedPlayer.score,
      playTime: updatedPlayer.playTime,
      platform: updatedPlayer.platform,
    },
    nearbyRankings,
  }, 200, request);
});