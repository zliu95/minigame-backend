// Platform enum
export enum Platform {
  WECHAT = 'WECHAT',
  DOUYIN = 'DOUYIN',
  IOS_APP = 'IOS_APP',
  ANDROID_APP = 'ANDROID_APP',
}

// Base models
export interface Admin {
  id: string;
  username: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Game {
  id: string;
  name: string;
  shortName: string;
  description?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Player {
  id: string;
  gameId: string;
  nickname: string;
  playerId: string;
  avatarUrl?: string;
  score: number;
  duration: number;
  detailsJson?: Record<string, unknown>;
  platform: Platform;
  openId?: string;
  location?: {
    country?: string;
    province?: string;
    city?: string;
  };
  createdAt: Date;
  updatedAt: Date;
  game?: Game;
}

// API types
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

// Error types
export enum ErrorCode {
  UNAUTHORIZED = 'UNAUTHORIZED',
  FORBIDDEN = 'FORBIDDEN',
  NOT_FOUND = 'NOT_FOUND',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  DUPLICATE_ENTRY = 'DUPLICATE_ENTRY',
  EXTERNAL_API_ERROR = 'EXTERNAL_API_ERROR',
  DATABASE_ERROR = 'DATABASE_ERROR',
}

export interface ApiError {
  code: ErrorCode;
  message: string;
  details?: Record<string, unknown>;
}
