import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

// Database configuration with connection pooling and optimization
const createPrismaClient = () => {
  return new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'info', 'warn', 'error'] : ['error'],
    datasources: {
      db: {
        url: process.env.DATABASE_URL,
      },
    },
  })
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient()

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma
}

// Database connection pool configuration
export const dbConfig = {
  // Connection pool settings (configured via DATABASE_URL parameters)
  maxConnections: parseInt(process.env.DB_MAX_CONNECTIONS || '10'),
  connectionTimeout: parseInt(process.env.DB_CONNECTION_TIMEOUT || '5000'),
  poolTimeout: parseInt(process.env.DB_POOL_TIMEOUT || '10000'),
}

// Optimized query helpers
export class QueryOptimizer {
  // Batch operations for better performance
  static async batchPlayerUpdates(updates: Array<{ id: string; data: any }>) {
    const transactions = updates.map(update =>
      prisma.player.update({
        where: { id: update.id },
        data: update.data,
      })
    )
    
    return await prisma.$transaction(transactions)
  }

  // Optimized leaderboard query with proper indexing
  static async getOptimizedLeaderboard(
    gameId: string,
    platform?: string,
    limit = 20,
    offset = 0
  ) {
    const whereCondition: any = { gameId }
    if (platform) {
      whereCondition.platform = platform
    }

    // Use raw query for better performance on large datasets
    if (offset > 1000) {
      return await prisma.$queryRaw`
        SELECT 
          id, nickname, "playerId", "avatarUrl", score, "duration", 
          detailsJson, platform, location, "createdAt", "updatedAt",
          ROW_NUMBER() OVER (ORDER BY score DESC, "updatedAt" ASC) as rank
        FROM players 
        WHERE "gameId" = ${gameId}
        ${platform ? `AND platform = ${platform}` : ''}
        ORDER BY score DESC, "updatedAt" ASC
        LIMIT ${limit} OFFSET ${offset}
      `
    }

    // Use Prisma for smaller offsets
    return await prisma.player.findMany({
      where: whereCondition,
      orderBy: [
        { score: 'desc' },
        { updatedAt: 'asc' },
      ],
      skip: offset,
      take: limit,
      select: {
        id: true,
        nickname: true,
        playerId: true,
        avatarUrl: true,
        score: true,
        duration: true,
        detailsJson: true,
        platform: true,
        location: true,
        createdAt: true,
        updatedAt: true,
      },
    })
  }

  // Optimized rank calculation
  static async getPlayerRank(gameId: string, playerId: string, score: number) {
    // Use efficient count query with index
    const rank = await prisma.player.count({
      where: {
        gameId,
        OR: [
          { score: { gt: score } },
          {
            score,
            updatedAt: { lt: await this.getPlayerUpdatedAt(playerId) }
          }
        ]
      }
    })
    
    return rank + 1
  }

  private static async getPlayerUpdatedAt(playerId: string) {
    const player = await prisma.player.findUnique({
      where: { id: playerId },
      select: { updatedAt: true }
    })
    return player?.updatedAt || new Date()
  }

  // Bulk analytics queries
  static async getAnalyticsData(gameId?: string, days = 30) {
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)
    
    const baseWhere = gameId ? { gameId } : {}
    
    // Use a single query with aggregations for better performance
    const result = await prisma.player.aggregate({
      where: baseWhere,
      _count: {
        id: true,
      },
    })

    const activeResult = await prisma.player.aggregate({
      where: {
        ...baseWhere,
        updatedAt: { gte: startDate }
      },
      _count: {
        id: true,
      },
    })

    const recentResult = await prisma.player.aggregate({
      where: {
        ...baseWhere,
        createdAt: { gte: startDate }
      },
      _count: {
        id: true,
      },
    })

    return {
      totalUsers: result._count.id,
      activeUsers: activeResult._count.id,
      recentUsers: recentResult._count.id,
    }
  }
}

// Database health check
export async function checkDatabaseHealth(): Promise<boolean> {
  try {
    await prisma.$queryRaw`SELECT 1`
    return true
  } catch (error) {
    console.error('Database health check failed:', error)
    return false
  }
}

// Graceful shutdown
export async function closeDatabaseConnection(): Promise<void> {
  await prisma.$disconnect()
}