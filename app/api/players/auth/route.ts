/**
 * 玩家认证API端点
 * POST /api/players/auth
 */

import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { PlayerAuthSchema, validateAndSanitize, sanitizeInput } from '@/lib/validations';
import { withErrorHandling, createSuccessResponse, NotFoundError, ExternalApiError as AppExternalApiError, withLogging } from '@/lib/error-handler';
import { ExternalApiFactory, ExternalApiError } from '@/lib/external-apis';
import { generatePlayerToken } from '@/lib/jwt';
import { Platform } from '@prisma/client';
import { logger } from '@/lib/logger';
import { logSecurityEvent, SecurityEventType, extractRequestInfo, isSuspiciousUserAgent, validateRequestSize } from '@/lib/security-utils';
import { encryptSensitiveData } from '@/lib/encryption';

export const POST = withErrorHandling(async (request: NextRequest) => {
  const requestInfo = extractRequestInfo(request);
  
  // 安全检查
  if (!validateRequestSize(request, 1024 * 1024)) { // 1MB限制
    logSecurityEvent({
      type: SecurityEventType.SUSPICIOUS_REQUEST,
      severity: 'medium',
      message: '玩家认证请求体过大',
      request: requestInfo,
    });
    throw new Error('请求数据过大');
  }
  
  // 检查可疑User-Agent
  if (isSuspiciousUserAgent(requestInfo.userAgent)) {
    logSecurityEvent({
      type: SecurityEventType.SUSPICIOUS_REQUEST,
      severity: 'high',
      message: '检测到可疑的User-Agent',
      request: requestInfo,
      details: { userAgent: requestInfo.userAgent },
    });
  }
  
  // 解析请求体
  const body = await request.json();
  
  // 验证和清理输入数据
  const validationResult = validateAndSanitize(PlayerAuthSchema, body);
  if (!validationResult.success) {
    logSecurityEvent({
      type: SecurityEventType.DATA_VALIDATION_FAILURE,
      severity: 'medium',
      message: '玩家认证数据验证失败',
      request: requestInfo,
      details: { error: validationResult.error },
    });
    throw new Error(validationResult.error);
  }
  
  const validatedData = validationResult.data;
  
  logger.info('Player authentication request', {
    gameId: validatedData.gameId,
    platform: validatedData.platform,
    playerId: validatedData.playerId,
    nickname: validatedData.nickname,
  }, request);

  // 验证游戏是否存在
  const game = await withLogging(
    () => prisma.game.findUnique({
      where: { id: validatedData.gameId },
    }),
    'verify game existence',
    { gameId: validatedData.gameId }
  );
  
  if (!game) {
    logger.warn('Game not found for player auth', {
      gameId: validatedData.gameId,
    }, request);
    throw new NotFoundError('游戏不存在');
  }

  // 根据平台验证用户身份
  let externalPlayerInfo;
  try {
    externalPlayerInfo = await withLogging(
      () => ExternalApiFactory.verifyUserByPlatform(
        validatedData.platform as Platform,
        validatedData.code,
        validatedData.playerId,
        {
          nickname: validatedData.nickname,
          avatarUrl: validatedData.avatarUrl,
          location: validatedData.location,
        }
      ),
      'verify user with external platform',
      { platform: validatedData.platform, playerId: validatedData.playerId }
    );

    logger.externalApi(
      validatedData.platform,
      'user verification',
      200,
      undefined
    );
  } catch (error) {
    if (error instanceof ExternalApiError) {
      logger.externalApi(
        error.platform,
        'user verification',
        undefined,
        undefined,
        error
      );
      throw new AppExternalApiError(`${error.platform}平台验证失败: ${error.message}`, {
        platform: error.platform,
      });
    }
    throw error;
  }

  // 查找或创建玩家记录
  const existingPlayer = await withLogging(
    () => prisma.player.findUnique({
      where: {
        gameId_platform_playerId: {
          gameId: validatedData.gameId,
          platform: validatedData.platform as Platform,
          playerId: externalPlayerInfo.playerId,
        },
      },
    }),
    'find existing player',
    { gameId: validatedData.gameId, platform: validatedData.platform, playerId: externalPlayerInfo.playerId }
  );

  let player;
  if (existingPlayer) {
    // 更新现有玩家信息
    player = await withLogging(
      () => prisma.player.update({
        where: { id: existingPlayer.id },
        data: {
          nickname: sanitizeInput(externalPlayerInfo.nickname),
          avatarUrl: externalPlayerInfo.avatarUrl,
          location: externalPlayerInfo.location,
          openId: validatedData.platform === Platform.WECHAT || validatedData.platform === Platform.DOUYIN 
            ? externalPlayerInfo.playerId 
            : existingPlayer.openId,
          updatedAt: new Date(),
        },
      }),
      'update existing player',
      { playerId: existingPlayer.id, nickname: externalPlayerInfo.nickname }
    );

    logger.dbOperation('UPDATE', 'player', undefined);
    logger.info('Player updated', {
      playerId: player.id,
      nickname: player.nickname,
    }, request);
  } else {
    // 创建新玩家记录
    player = await withLogging(
      () => prisma.player.create({
        data: {
          gameId: validatedData.gameId,
          nickname: sanitizeInput(externalPlayerInfo.nickname),
          playerId: externalPlayerInfo.playerId,
          avatarUrl: externalPlayerInfo.avatarUrl,
          platform: validatedData.platform as Platform,
          openId: validatedData.platform === Platform.WECHAT || validatedData.platform === Platform.DOUYIN 
            ? externalPlayerInfo.playerId 
            : null,
          location: externalPlayerInfo.location,
        },
      }),
      'create new player',
      { gameId: validatedData.gameId, nickname: externalPlayerInfo.nickname, platform: validatedData.platform }
    );

    logger.dbOperation('INSERT', 'player', undefined);
    logger.info('New player created', {
      playerId: player.id,
      nickname: player.nickname,
      platform: player.platform,
    }, request);
  }

  // 生成访问token
  const token = generatePlayerToken({
    playerId: player.id,
    gameId: validatedData.gameId,
    platform: validatedData.platform,
  });

  logger.info('Player authentication successful', {
    playerId: player.id,
    gameId: validatedData.gameId,
    platform: validatedData.platform,
  }, request);

  // 返回成功响应
  return createSuccessResponse({
    playerId: player.id,
    token,
    player: {
      id: player.id,
      nickname: player.nickname,
      avatarUrl: player.avatarUrl,
      score: player.score,
      playTime: player.playTime,
      platform: player.platform,
    },
  }, 200, request);
});