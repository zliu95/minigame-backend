'use client';

import { useState, useEffect } from 'react';
import { LeaderboardTable } from '@/components/leaderboards/LeaderboardTable';

interface Game {
  id: string;
  name: string;
  shortName: string;
  isActive: boolean;
}

export default function LeaderboardsPage() {
  const [games, setGames] = useState<Game[]>([]);
  const [selectedGameId, setSelectedGameId] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchGames();
  }, []);

  const fetchGames = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch('/api/games');
      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error?.message || '获取游戏列表失败');
      }
      
      setGames(result.data.games);
      
      // 自动选择第一个游戏
      if (result.data.games.length > 0) {
        setSelectedGameId(result.data.games[0].id);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '获取游戏列表失败');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-8">
        <div className="text-gray-500">加载中...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-md p-4">
        <div className="text-red-800">错误: {error}</div>
      </div>
    );
  }

  if (games.length === 0) {
    return (
      <div className="text-center py-8">
        <div className="text-gray-500 mb-4">暂无游戏数据</div>
        <p className="text-sm text-gray-400">
          请先在游戏管理页面创建游戏
        </p>
      </div>
    );
  }

  const selectedGame = games.find(game => game.id === selectedGameId);

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">排行榜管理</h1>
        
        {/* 游戏选择器 */}
        <div className="flex items-center space-x-4">
          <label className="text-sm font-medium text-gray-700">选择游戏:</label>
          <select
            value={selectedGameId}
            onChange={(e) => setSelectedGameId(e.target.value)}
            className="border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {games.map((game) => (
              <option key={game.id} value={game.id}>
                {game.name} ({game.shortName})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* 排行榜表格 */}
      {selectedGameId && (
        <LeaderboardTable
          gameId={selectedGameId}
          gameName={selectedGame?.name}
        />
      )}
    </div>
  );
}