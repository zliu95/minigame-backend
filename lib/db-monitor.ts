import { prisma } from './db';

// Database performance monitoring utilities
export class DatabaseMonitor {
  // Monitor query performance
  static async measureQueryTime<T>(
    queryName: string,
    queryFn: () => Promise<T>
  ): Promise<{ result: T; duration: number }> {
    const startTime = Date.now();
    
    try {
      const result = await queryFn();
      const duration = Date.now() - startTime;
      
      // Log slow queries (> 1 second)
      if (duration > 1000) {
        console.warn(`Slow query detected: ${queryName} took ${duration}ms`);
      }
      
      return { result, duration };
    } catch (error) {
      const duration = Date.now() - startTime;
      console.error(`Query failed: ${queryName} after ${duration}ms`, error);
      throw error;
    }
  }

  // Get database statistics
  static async getDatabaseStats() {
    try {
      const stats = await prisma.$queryRaw<Array<{
        table_name: string;
        row_count: bigint;
        table_size: string;
        index_size: string;
      }>>`
        SELECT 
          schemaname,
          tablename as table_name,
          attname as column_name,
          n_distinct,
          correlation
        FROM pg_stats 
        WHERE schemaname = 'public'
        ORDER BY tablename, attname;
      `;

      return stats;
    } catch (error) {
      console.error('Failed to get database stats:', error);
      return [];
    }
  }

  // Check index usage
  static async getIndexUsage() {
    try {
      const indexStats = await prisma.$queryRaw<Array<{
        table_name: string;
        index_name: string;
        index_scans: bigint;
        tuples_read: bigint;
        tuples_fetched: bigint;
      }>>`
        SELECT 
          schemaname,
          tablename as table_name,
          indexname as index_name,
          idx_scan as index_scans,
          idx_tup_read as tuples_read,
          idx_tup_fetch as tuples_fetched
        FROM pg_stat_user_indexes 
        WHERE schemaname = 'public'
        ORDER BY idx_scan DESC;
      `;

      return indexStats;
    } catch (error) {
      console.error('Failed to get index usage stats:', error);
      return [];
    }
  }

  // Monitor connection pool
  static async getConnectionStats() {
    try {
      const connections = await prisma.$queryRaw<Array<{
        state: string;
        count: bigint;
      }>>`
        SELECT 
          state,
          COUNT(*) as count
        FROM pg_stat_activity 
        WHERE datname = current_database()
        GROUP BY state;
      `;

      return connections;
    } catch (error) {
      console.error('Failed to get connection stats:', error);
      return [];
    }
  }

  // Analyze query performance
  static async analyzeQuery(query: string) {
    try {
      const plan = await prisma.$queryRaw`EXPLAIN ANALYZE ${query}`;
      return plan;
    } catch (error) {
      console.error('Failed to analyze query:', error);
      return null;
    }
  }

  // Get table sizes
  static async getTableSizes() {
    try {
      const sizes = await prisma.$queryRaw<Array<{
        table_name: string;
        row_count: bigint;
        total_size: string;
        table_size: string;
        index_size: string;
      }>>`
        SELECT 
          tablename as table_name,
          n_tup_ins + n_tup_upd + n_tup_del as row_count,
          pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as total_size,
          pg_size_pretty(pg_relation_size(schemaname||'.'||tablename)) as table_size,
          pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename) - pg_relation_size(schemaname||'.'||tablename)) as index_size
        FROM pg_stat_user_tables 
        WHERE schemaname = 'public'
        ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
      `;

      return sizes;
    } catch (error) {
      console.error('Failed to get table sizes:', error);
      return [];
    }
  }

  // Performance recommendations
  static async getPerformanceRecommendations() {
    const recommendations: string[] = [];

    try {
      // Check for missing indexes
      const missingIndexes = await prisma.$queryRaw<Array<{
        table_name: string;
        seq_scan: bigint;
        seq_tup_read: bigint;
      }>>`
        SELECT 
          schemaname,
          tablename as table_name,
          seq_scan,
          seq_tup_read
        FROM pg_stat_user_tables 
        WHERE schemaname = 'public'
        AND seq_scan > 1000
        AND seq_tup_read / seq_scan > 10000;
      `;

      if (missingIndexes.length > 0) {
        recommendations.push(
          `Consider adding indexes to tables: ${missingIndexes.map(t => t.table_name).join(', ')}`
        );
      }

      // Check for unused indexes
      const unusedIndexes = await prisma.$queryRaw<Array<{
        index_name: string;
        table_name: string;
      }>>`
        SELECT 
          indexname as index_name,
          tablename as table_name
        FROM pg_stat_user_indexes 
        WHERE schemaname = 'public'
        AND idx_scan = 0;
      `;

      if (unusedIndexes.length > 0) {
        recommendations.push(
          `Consider removing unused indexes: ${unusedIndexes.map(i => i.index_name).join(', ')}`
        );
      }

      // Check for large tables without recent VACUUM
      const needVacuum = await prisma.$queryRaw<Array<{
        table_name: string;
        n_dead_tup: bigint;
      }>>`
        SELECT 
          tablename as table_name,
          n_dead_tup
        FROM pg_stat_user_tables 
        WHERE schemaname = 'public'
        AND n_dead_tup > 1000;
      `;

      if (needVacuum.length > 0) {
        recommendations.push(
          `Consider running VACUUM on tables: ${needVacuum.map(t => t.table_name).join(', ')}`
        );
      }

    } catch (error) {
      console.error('Failed to generate performance recommendations:', error);
    }

    return recommendations;
  }
}

// Query optimization helpers
export class QueryOptimizationHelpers {
  // Batch insert with conflict resolution
  static async batchUpsertPlayers(players: Array<{
    gameId: string;
    playerId: string;
    platform: string;
    nickname: string;
    avatarUrl?: string;
    score?: number;
    duration?: number;
    detailsJson?: any;
    location?: any;
  }>) {
    const queries = players.map(player => 
      prisma.player.upsert({
        where: {
          gameId_platform_playerId: {
            gameId: player.gameId,
            platform: player.platform as any,
            playerId: player.playerId,
          }
        },
        update: {
          nickname: player.nickname,
          avatarUrl: player.avatarUrl,
          score: player.score || 0,
          duration: player.duration || 0,
          detailsJson: player.detailsJson,
          location: player.location,
          updatedAt: new Date(),
        },
        create: {
          gameId: player.gameId,
          playerId: player.playerId,
          platform: player.platform as any,
          nickname: player.nickname,
          avatarUrl: player.avatarUrl,
          score: player.score || 0,
          duration: player.duration || 0,
          detailsJson: player.detailsJson,
          location: player.location,
        }
      })
    );

    return await prisma.$transaction(queries);
  }

  // Efficient pagination for large datasets
  static async getPaginatedLeaderboard(
    gameId: string,
    platform?: string,
    cursor?: string,
    limit = 20
  ) {
    const whereCondition: any = { gameId };
    if (platform) {
      whereCondition.platform = platform;
    }

    if (cursor) {
      // Cursor-based pagination for better performance
      return await prisma.player.findMany({
        where: {
          ...whereCondition,
          id: { gt: cursor }
        },
        orderBy: [
          { score: 'desc' },
          { updatedAt: 'asc' },
          { id: 'asc' }
        ],
        take: limit,
        select: {
          id: true,
          nickname: true,
          playerId: true,
          avatarUrl: true,
          score: true,
          duration: true,
          platform: true,
          updatedAt: true,
        }
      });
    } else {
      // First page
      return await prisma.player.findMany({
        where: whereCondition,
        orderBy: [
          { score: 'desc' },
          { updatedAt: 'asc' },
          { id: 'asc' }
        ],
        take: limit,
        select: {
          id: true,
          nickname: true,
          playerId: true,
          avatarUrl: true,
          score: true,
          duration: true,
          platform: true,
          updatedAt: true,
        }
      });
    }
  }
}