/**
 * JWT工具函数
 * 用于生成和验证玩家访问token
 */

import jwt from 'jsonwebtoken';

// JWT载荷接口
export interface PlayerTokenPayload {
  playerId: string;
  gameId: string;
  platform: string;
  iat?: number;
  exp?: number;
}

// JWT配置
const JWT_SECRET = process.env.NEXTAUTH_SECRET || 'fallback-secret-key';
const JWT_EXPIRES_IN = '7d'; // Token有效期7天

/**
 * 生成玩家访问token
 */
export function generatePlayerToken(payload: Omit<PlayerTokenPayload, 'iat' | 'exp'>): string {
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN,
  });
}

/**
 * 验证并解析玩家token
 */
export function verifyPlayerToken(token: string): PlayerTokenPayload {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as PlayerTokenPayload;
    return decoded;
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      throw new Error('Invalid token');
    }
    if (error instanceof jwt.TokenExpiredError) {
      throw new Error('Token expired');
    }
    throw new Error('Token verification failed');
  }
}

/**
 * 从Authorization header中提取token
 */
export function extractTokenFromHeader(authHeader: string | null): string | null {
  if (!authHeader) {
    return null;
  }

  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    return null;
  }

  return parts[1];
}