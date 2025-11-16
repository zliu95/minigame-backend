import Redis from 'ioredis';
import { Platform } from '@prisma/client';

// Redis client instance
let redis: Redis | null = null;

// Initialize Redis connection
export function getRedisClient(): Redis | null {
  if (!process.env.REDIS_URL) {
    console.warn('REDIS_URL not configured, caching disabled');
    return null;
  }

  if (!redis) {
    try {
      redis = new Redis(process.env.REDIS_URL, {
        maxRetriesPerRequest: 3,
        lazyConnect: true,
        retryStrategy(times) {
          const delay = Math.min(times * 50, 2000);
          return delay;
        },
      });

      redis.on('error', (error) => {
        console.error('Redis connection error:', error);
      });

      redis.on('connect', () => {
        console.log('Redis connected successfully');
      });
    } catch (error) {
      console.error('Failed to initialize Redis:', error);
      return null;
    }
  }

  return redis;
}

// Cache key generators
export const CacheKeys = {
  leaderboard: (gameId: string, platform?: Platform) => 
    `leaderboard:${gameId}:${platform || 'all'}`,
  playerRank: (gameId: string, playerId: string) => 
    `player_rank:${gameId}:${playerId}`,
  gameStats: (gameId: string) => 
    `game_stats:${gameId}`,
  analytics: (type: string) => 
    `analytics:${type}`,
};

// Cache TTL constants (in seconds)
export const CacheTTL = {
  LEADERBOARD: 300, // 5 minutes
  PLAYER_RANK: 60,  // 1 minute
  GAME_STATS: 600,  // 10 minutes
  ANALYTICS: 1800,  // 30 minutes
};

// Generic cache operations
export class CacheManager {
  private client: Redis | null;

  constructor() {
    this.client = getRedisClient();
  }

  async get<T>(key: string): Promise<T | null> {
    if (!this.client) return null;

    try {
      const cached = await this.client.get(key);
      return cached ? JSON.parse(cached) : null;
    } catch (error) {
      console.error(`Cache get error for key ${key}:`, error);
      return null;
    }
  }

  async set<T>(key: string, value: T, ttl?: number): Promise<boolean> {
    if (!this.client) return false;

    try {
      const serialized = JSON.stringify(value);
      if (ttl) {
        await this.client.setex(key, ttl, serialized);
      } else {
        await this.client.set(key, serialized);
      }
      return true;
    } catch (error) {
      console.error(`Cache set error for key ${key}:`, error);
      return false;
    }
  }

  async del(key: string): Promise<boolean> {
    if (!this.client) return false;

    try {
      await this.client.del(key);
      return true;
    } catch (error) {
      console.error(`Cache delete error for key ${key}:`, error);
      return false;
    }
  }

  async delPattern(pattern: string): Promise<boolean> {
    if (!this.client) return false;

    try {
      const keys = await this.client.keys(pattern);
      if (keys.length > 0) {
        await this.client.del(...keys);
      }
      return true;
    } catch (error) {
      console.error(`Cache delete pattern error for pattern ${pattern}:`, error);
      return false;
    }
  }

  async exists(key: string): Promise<boolean> {
    if (!this.client) return false;

    try {
      const result = await this.client.exists(key);
      return result === 1;
    } catch (error) {
      console.error(`Cache exists error for key ${key}:`, error);
      return false;
    }
  }

  // Increment operations for counters
  async incr(key: string, ttl?: number): Promise<number | null> {
    if (!this.client) return null;

    try {
      const result = await this.client.incr(key);
      if (ttl && result === 1) {
        await this.client.expire(key, ttl);
      }
      return result;
    } catch (error) {
      console.error(`Cache incr error for key ${key}:`, error);
      return null;
    }
  }

  // Close connection
  async disconnect(): Promise<void> {
    if (this.client) {
      await this.client.quit();
      redis = null;
    }
  }
}

// Singleton instance
export const cache = new CacheManager();

// Leaderboard specific cache operations
export class LeaderboardCache {
  static async getLeaderboard(gameId: string, platform?: Platform) {
    const key = CacheKeys.leaderboard(gameId, platform);
    return await cache.get(key);
  }

  static async setLeaderboard(
    gameId: string, 
    data: any, 
    platform?: Platform, 
    ttl = CacheTTL.LEADERBOARD
  ) {
    const key = CacheKeys.leaderboard(gameId, platform);
    return await cache.set(key, data, ttl);
  }

  static async invalidateLeaderboard(gameId: string, platform?: Platform) {
    if (platform) {
      const key = CacheKeys.leaderboard(gameId, platform);
      return await cache.del(key);
    } else {
      // Invalidate all platform leaderboards for this game
      const pattern = `leaderboard:${gameId}:*`;
      return await cache.delPattern(pattern);
    }
  }

  static async getPlayerRank(gameId: string, playerId: string) {
    const key = CacheKeys.playerRank(gameId, playerId);
    return await cache.get(key);
  }

  static async setPlayerRank(
    gameId: string, 
    playerId: string, 
    rankData: any, 
    ttl = CacheTTL.PLAYER_RANK
  ) {
    const key = CacheKeys.playerRank(gameId, playerId);
    return await cache.set(key, rankData, ttl);
  }

  static async invalidatePlayerRank(gameId: string, playerId: string) {
    const key = CacheKeys.playerRank(gameId, playerId);
    return await cache.del(key);
  }
}

// Analytics cache operations
export class AnalyticsCache {
  static async getAnalytics(type: string) {
    const key = CacheKeys.analytics(type);
    return await cache.get(key);
  }

  static async setAnalytics(
    type: string, 
    data: any, 
    ttl = CacheTTL.ANALYTICS
  ) {
    const key = CacheKeys.analytics(type);
    return await cache.set(key, data, ttl);
  }

  static async invalidateAnalytics(type?: string) {
    if (type) {
      const key = CacheKeys.analytics(type);
      return await cache.del(key);
    } else {
      // Invalidate all analytics
      const pattern = 'analytics:*';
      return await cache.delPattern(pattern);
    }
  }
}

// Game stats cache operations
export class GameStatsCache {
  static async getGameStats(gameId: string) {
    const key = CacheKeys.gameStats(gameId);
    return await cache.get(key);
  }

  static async setGameStats(
    gameId: string, 
    data: any, 
    ttl = CacheTTL.GAME_STATS
  ) {
    const key = CacheKeys.gameStats(gameId);
    return await cache.set(key, data, ttl);
  }

  static async invalidateGameStats(gameId: string) {
    const key = CacheKeys.gameStats(gameId);
    return await cache.del(key);
  }
}