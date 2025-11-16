import { NextRequest, NextResponse } from 'next/server'
import { prisma, QueryOptimizer } from '@/lib/db'
import { handleApiError } from '@/lib/error-handler'
import { AnalyticsCache } from '@/lib/cache'
import { DatabaseMonitor } from '@/lib/db-monitor'
import { Platform } from '@prisma/client'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const gameId = searchParams.get('gameId') || undefined
    const days = parseInt(searchParams.get('days') || '30')
    
    // 生成缓存键
    const cacheKey = `overview_${gameId || 'all'}_${days}d`
    
    // 尝试从缓存获取数据
    const cachedData = await AnalyticsCache.getAnalytics(cacheKey)
    if (cachedData) {
      return NextResponse.json({
        success: true,
        data: cachedData,
        cached: true,
      })
    }
    
    // 计算时间范围
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)
    
    // 构建基础查询条件
    const baseWhere = gameId ? { gameId } : {}
    const recentWhere = {
      ...baseWhere,
      createdAt: {
        gte: startDate
      }
    }
    
    // 使用优化的分析查询
    const { result: analyticsData, duration } = await DatabaseMonitor.measureQueryTime(
      'analytics_overview',
      () => QueryOptimizer.getAnalyticsData(gameId, days)
    )

    // 并行执行其他统计查询
    const [
      platformStats,
      totalGames
    ] = await Promise.all([
      // 按平台统计用户分布
      prisma.player.groupBy({
        by: ['platform'],
        where: baseWhere,
        _count: {
          id: true
        }
      }),
      
      // 游戏总数（如果没有指定gameId）
      gameId ? Promise.resolve(1) : prisma.game.count({
        where: { isActive: true }
      })
    ])

    const { totalUsers, activeUsers, recentUsers } = analyticsData
    
    // 格式化平台统计数据
    const platformDistribution = Object.values(Platform).map(platform => {
      const stat = platformStats.find(s => s.platform === platform)
      return {
        platform,
        count: stat?._count.id || 0,
        percentage: totalUsers > 0 ? ((stat?._count.id || 0) / totalUsers * 100).toFixed(1) : '0.0'
      }
    })
    
    // 计算增长率（简化版本，实际应该与上一个周期比较）
    const growthRate = totalUsers > 0 ? ((recentUsers / totalUsers) * 100).toFixed(1) : '0.0'
    
    const analytics = {
      overview: {
        totalUsers,
        activeUsers,
        recentUsers,
        totalGames,
        growthRate: `${growthRate}%`,
        activeRate: totalUsers > 0 ? `${((activeUsers / totalUsers) * 100).toFixed(1)}%` : '0.0%'
      },
      platformDistribution,
      timeRange: {
        days,
        startDate: startDate.toISOString(),
        endDate: new Date().toISOString()
      }
    }
    
    // 缓存分析数据
    await AnalyticsCache.setAnalytics(cacheKey, analytics)
    
    return NextResponse.json({
      success: true,
      data: analytics
    })
    
  } catch (error) {
    console.error('Analytics API error:', error)
    const apiError = handleApiError(error)
    return NextResponse.json(
      { success: false, error: apiError },
      { status: 500 }
    )
  }
}