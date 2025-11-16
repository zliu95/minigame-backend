import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { UpdateGameSchema } from '@/lib/validations';
import { withErrorHandling, createSuccessResponse, UnauthorizedError, NotFoundError, ValidationError, withLogging } from '@/lib/error-handler';
import { logger } from '@/lib/logger';

interface RouteParams {
  params: Promise<{
    id: string;
  }>;
}

// GET /api/games/[id] - 获取单个游戏详情
export const GET = withErrorHandling(async (request: NextRequest, { params }: RouteParams) => {
  // 验证管理员身份
  const session = await getServerSession(authOptions);
  if (!session) {
    throw new UnauthorizedError('未授权访问');
  }

  const { id } = await params;

  logger.info('Fetching game details', {
    gameId: id,
    userId: session.user?.username,
  }, request);

  // 查找游戏
  const game = await withLogging(
    () => prisma.game.findUnique({
      where: { id },
      include: {
        _count: {
          select: { players: true },
        },
        players: {
          take: 5,
          orderBy: { score: 'desc' },
          select: {
            id: true,
            nickname: true,
            score: true,
            platform: true,
            createdAt: true,
          },
        },
      },
    }),
    'fetch game details',
    { gameId: id }
  );

  if (!game) {
    logger.warn('Game not found', { gameId: id }, request);
    throw new NotFoundError('游戏不存在');
  }

  logger.dbOperation('SELECT', 'game', undefined);
  logger.info('Game details fetched successfully', {
    gameId: game.id,
    gameName: game.name,
    playerCount: game._count.players,
  }, request);

  return createSuccessResponse(game, 200, request);
});

// PUT /api/games/[id] - 更新游戏信息
export const PUT = withErrorHandling(async (request: NextRequest, { params }: RouteParams) => {
  // 验证管理员身份
  const session = await getServerSession(authOptions);
  if (!session) {
    throw new UnauthorizedError('未授权访问');
  }

  const { id } = await params;

  // 解析请求体
  const body = await request.json();

  // 验证数据
  const validatedData = UpdateGameSchema.parse(body);

  logger.info('Updating game', {
    gameId: id,
    updateData: validatedData,
    userId: session.user?.username,
  }, request);

  // 检查游戏是否存在
  const existingGame = await withLogging(
    () => prisma.game.findUnique({
      where: { id },
    }),
    'check game existence',
    { gameId: id }
  );

  if (!existingGame) {
    logger.warn('Game not found for update', { gameId: id }, request);
    throw new NotFoundError('游戏不存在');
  }

  // 更新游戏
  const updatedGame = await withLogging(
    () => prisma.game.update({
      where: { id },
      data: validatedData,
      include: {
        _count: {
          select: { players: true },
        },
      },
    }),
    'update game',
    { gameId: id, updateFields: Object.keys(validatedData) }
  );

  logger.dbOperation('UPDATE', 'game', undefined);
  logger.info('Game updated successfully', {
    gameId: updatedGame.id,
    gameName: updatedGame.name,
    updatedFields: Object.keys(validatedData),
  }, request);

  return createSuccessResponse(updatedGame, 200, request);
});

// DELETE /api/games/[id] - 删除游戏
export const DELETE = withErrorHandling(async (request: NextRequest, { params }: RouteParams) => {
  // 验证管理员身份
  const session = await getServerSession(authOptions);
  if (!session) {
    throw new UnauthorizedError('未授权访问');
  }

  const { id } = await params;

  logger.info('Attempting to delete game', {
    gameId: id,
    userId: session.user?.username,
  }, request);

  // 检查游戏是否存在
  const existingGame = await withLogging(
    () => prisma.game.findUnique({
      where: { id },
      include: {
        _count: {
          select: { players: true },
        },
      },
    }),
    'check game existence for deletion',
    { gameId: id }
  );

  if (!existingGame) {
    logger.warn('Game not found for deletion', { gameId: id }, request);
    throw new NotFoundError('游戏不存在');
  }

  // 检查是否有关联的玩家数据
  if (existingGame._count.players > 0) {
    logger.warn('Cannot delete game with players', {
      gameId: id,
      playerCount: existingGame._count.players,
    }, request);
    throw new ValidationError('无法删除包含玩家数据的游戏，请先清理相关数据', {
      playerCount: existingGame._count.players,
    });
  }

  // 删除游戏
  await withLogging(
    () => prisma.game.delete({
      where: { id },
    }),
    'delete game',
    { gameId: id, gameName: existingGame.name }
  );

  logger.dbOperation('DELETE', 'game', undefined);
  logger.info('Game deleted successfully', {
    gameId: id,
    gameName: existingGame.name,
  }, request);

  return createSuccessResponse({ message: '游戏删除成功' }, 200, request);
});