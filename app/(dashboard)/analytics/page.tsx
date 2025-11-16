'use client';

import { useState, useEffect } from 'react';
import { StatCard } from '@/components/charts/StatCard';
import { PlatformChart } from '@/components/charts/PlatformChart';
import { Button } from '@/components/ui/Button';

interface AnalyticsData {
  overview: {
    totalUsers: number;
    activeUsers: number;
    recentUsers: number;
    totalGames: number;
    growthRate: string;
    activeRate: string;
  };
  platformDistribution: Array<{
    platform: string;
    count: number;
    percentage: string;
  }>;
  timeRange: {
    days: number;
    startDate: string;
    endDate: string;
  };
}

interface Game {
  id: string;
  name: string;
  shortName: string;
}

export default function AnalyticsPage() {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [games, setGames] = useState<Game[]>([]);
  const [selectedGameId, setSelectedGameId] = useState<string>('');
  const [timeRange, setTimeRange] = useState<number>(30);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchGames = async () => {
    try {
      const response = await fetch('/api/games');
      if (!response.ok) throw new Error('Failed to fetch games');
      const data = await response.json();
      setGames(data.games || []);
    } catch (err) {
      console.error('Error fetching games:', err);
    }
  };

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const params = new URLSearchParams({
        days: timeRange.toString()
      });
      
      if (selectedGameId) {
        params.append('gameId', selectedGameId);
      }
      
      const response = await fetch(`/api/analytics/overview?${params}`);
      if (!response.ok) {
        throw new Error('Failed to fetch analytics data');
      }
      
      const result = await response.json();
      if (result.success) {
        setAnalytics(result.data);
      } else {
        throw new Error(result.error?.message || 'Unknown error');
      }
    } catch (err) {
      console.error('Error fetching analytics:', err);
      setError(err instanceof Error ? err.message : 'Failed to load analytics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGames();
  }, []);

  useEffect(() => {
    fetchAnalytics();
  }, [selectedGameId, timeRange]);

  const handleRefresh = () => {
    fetchAnalytics();
  };

  if (loading && !analytics) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <div className="flex">
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">
                加载失败
              </h3>
              <div className="mt-2 text-sm text-red-700">
                {error}
              </div>
              <div className="mt-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleRefresh}
                >
                  重试
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">数据分析</h1>
        <Button onClick={handleRefresh} disabled={loading}>
          {loading ? '刷新中...' : '刷新数据'}
        </Button>
      </div>

      {/* 筛选器 */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="flex flex-wrap gap-4 items-center">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              游戏筛选
            </label>
            <select
              value={selectedGameId}
              onChange={(e) => setSelectedGameId(e.target.value)}
              className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">全部游戏</option>
              {games.map((game) => (
                <option key={game.id} value={game.id}>
                  {game.name}
                </option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              时间范围
            </label>
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(Number(e.target.value))}
              className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value={7}>最近7天</option>
              <option value={30}>最近30天</option>
              <option value={90}>最近90天</option>
              <option value={365}>最近一年</option>
            </select>
          </div>
        </div>
      </div>

      {analytics && (
        <>
          {/* 统计卡片 */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <StatCard
              title="总用户数"
              value={analytics.overview.totalUsers.toLocaleString()}
              icon="👥"
              subtitle={selectedGameId ? '当前游戏' : '全部游戏'}
            />
            <StatCard
              title="活跃用户"
              value={analytics.overview.activeUsers.toLocaleString()}
              icon="🔥"
              subtitle={`活跃率 ${analytics.overview.activeRate}`}
            />
            <StatCard
              title="新增用户"
              value={analytics.overview.recentUsers.toLocaleString()}
              icon="📈"
              subtitle={`最近${timeRange}天`}
              trend={{
                value: analytics.overview.growthRate,
                isPositive: parseFloat(analytics.overview.growthRate) >= 0
              }}
            />
            <StatCard
              title="游戏数量"
              value={analytics.overview.totalGames.toLocaleString()}
              icon="🎮"
              subtitle={selectedGameId ? '当前选中' : '活跃游戏'}
            />
          </div>

          {/* 平台分布图表 */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <PlatformChart data={analytics.platformDistribution} />
            
            {/* 数据概览 */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">数据概览</h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="text-sm text-gray-600">统计时间范围</span>
                  <span className="text-sm font-medium text-gray-900">
                    最近{analytics.timeRange.days}天
                  </span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="text-sm text-gray-600">数据更新时间</span>
                  <span className="text-sm font-medium text-gray-900">
                    {new Date(analytics.timeRange.endDate).toLocaleString('zh-CN')}
                  </span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="text-sm text-gray-600">用户增长率</span>
                  <span className={`text-sm font-medium ${
                    parseFloat(analytics.overview.growthRate) >= 0 
                      ? 'text-green-600' 
                      : 'text-red-600'
                  }`}>
                    {analytics.overview.growthRate}
                  </span>
                </div>
                <div className="flex justify-between items-center py-2">
                  <span className="text-sm text-gray-600">用户活跃率</span>
                  <span className="text-sm font-medium text-blue-600">
                    {analytics.overview.activeRate}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}