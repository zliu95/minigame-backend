import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { GameSchema } from '@/lib/validations';
import { withErrorHandling, createSuccessResponse, UnauthorizedError, withLogging } from '@/lib/error-handler';
import { logger } from '@/lib/logger';

// GET /api/games - 获取游戏列表
export const GET = withErrorHandling(async (request: NextRequest) => {
  // 验证管理员身份
  const session = await getServerSession(authOptions);
  if (!session) {
    throw new UnauthorizedError('未授权访问');
  }

  // 获取查询参数
  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get('page') || '1');
  const limit = parseInt(searchParams.get('limit') || '10');
  const search = searchParams.get('search') || '';
  const isActive = searchParams.get('isActive');

  logger.info('Fetching games list', {
    page,
    limit,
    search,
    isActive,
    userId: session.user?.username,
  }, request);

  // 构建查询条件
  const where: any = {};
  if (search) {
    where.OR = [
      { name: { contains: search, mode: 'insensitive' } },
      { shortName: { contains: search, mode: 'insensitive' } },
    ];
  }
  if (isActive !== null) {
    where.isActive = isActive === 'true';
  }

  // 计算偏移量
  const skip = (page - 1) * limit;

  // 并行查询游戏列表和总数
  const [games, total] = await withLogging(
    () => Promise.all([
      prisma.game.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          _count: {
            select: { players: true },
          },
        },
      }),
      prisma.game.count({ where }),
    ]),
    'fetch games with pagination',
    { page, limit, search, totalConditions: Object.keys(where).length }
  );

  logger.dbOperation('SELECT', 'game', undefined);

  return createSuccessResponse({
    games,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
      hasMore: skip + games.length < total,
    },
  }, 200, request);
});

// POST /api/games - 创建游戏
export const POST = withErrorHandling(async (request: NextRequest) => {
  // 验证管理员身份
  const session = await getServerSession(authOptions);
  if (!session) {
    throw new UnauthorizedError('未授权访问');
  }

  // 解析请求体
  const body = await request.json();

  // 验证数据
  const validatedData = GameSchema.parse(body);

  logger.info('Creating new game', {
    gameName: validatedData.name,
    shortName: validatedData.shortName,
    userId: session.user?.username,
  }, request);

  // 创建游戏
  const game = await withLogging(
    () => prisma.game.create({
      data: validatedData,
      include: {
        _count: {
          select: { players: true },
        },
      },
    }),
    'create game',
    { gameName: validatedData.name }
  );

  logger.dbOperation('INSERT', 'game', undefined);
  logger.info('Game created successfully', {
    gameId: game.id,
    gameName: game.name,
  }, request);

  return createSuccessResponse(game, 201, request);
});