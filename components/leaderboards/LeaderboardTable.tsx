'use client';

import { useState, useEffect } from 'react';
import { Table, TableHeader, TableBody, TableRow, TableCell } from '@/components/ui/Table';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';

interface Player {
  id: string;
  nickname: string;
  playerId: string;
  avatarUrl?: string;
  score: number;
  duration: number;
  detailsJson?: any;
  platform: 'WECHAT' | 'DOUYIN' | 'IOS_APP' | 'ANDROID_APP';
  location?: {
    country?: string;
    province?: string;
    city?: string;
  };
  createdAt: string;
  updatedAt: string;
}

interface PlayerRanking {
  rank: number;
  player: Player;
}

interface LeaderboardData {
  game: {
    id: string;
    name: string;
    shortName: string;
  };
  rankings: PlayerRanking[];
  pagination: {
    total: number;
    limit: number;
    offset: number;
    hasMore: boolean;
  };
  filters: {
    platform: string | null;
  };
}

interface LeaderboardTableProps {
  gameId: string;
  gameName?: string;
}

const platformNames = {
  WECHAT: '微信小程序',
  DOUYIN: '抖音小程序',
  IOS_APP: 'iOS应用',
  ANDROID_APP: 'Android应用',
};

export function LeaderboardTable({ gameId, gameName }: LeaderboardTableProps) {
  const [data, setData] = useState<LeaderboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPlatform, setSelectedPlatform] = useState<string>('');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);
  const [showPlayerModal, setShowPlayerModal] = useState(false);
  
  const pageSize = 20;

  const fetchLeaderboard = async (platform?: string, page = 1) => {
    try {
      setLoading(true);
      setError(null);
      
      const params = new URLSearchParams({
        limit: pageSize.toString(),
        offset: ((page - 1) * pageSize).toString(),
      });
      
      if (platform) {
        params.append('platform', platform);
      }
      
      const response = await fetch(`/api/leaderboards/${gameId}?${params}`);
      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error?.message || '获取排行榜失败');
      }
      
      setData(result.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : '获取排行榜失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeaderboard(selectedPlatform || undefined, currentPage);
  }, [gameId, selectedPlatform, currentPage]);

  const handlePlatformChange = (platform: string) => {
    setSelectedPlatform(platform);
    setCurrentPage(1);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handlePlayerClick = (player: Player) => {
    setSelectedPlayer(player);
    setShowPlayerModal(true);
  };

  const formatduration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}时${minutes}分${secs}秒`;
    } else if (minutes > 0) {
      return `${minutes}分${secs}秒`;
    } else {
      return `${secs}秒`;
    }
  };

  const formatLocation = (location?: any) => {
    if (!location) return '-';
    const parts = [location.country, location.province, location.city].filter(Boolean);
    return parts.join(' ') || '-';
  };

  if (loading && !data) {
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
        <Button
          onClick={() => fetchLeaderboard(selectedPlatform || undefined, currentPage)}
          className="mt-2"
          variant="outline"
        >
          重试
        </Button>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="text-center py-8 text-gray-500">
        暂无数据
      </div>
    );
  }

  const renderPlayerCell = (ranking: PlayerRanking) => (
    <div className="flex items-center space-x-3">
      {ranking.player.avatarUrl && (
        <img
          src={ranking.player.avatarUrl}
          alt={ranking.player.nickname}
          className="w-10 h-10 rounded-full object-cover"
        />
      )}
      <div>
        <div className="font-medium">{ranking.player.nickname}</div>
        <div className="text-sm text-gray-500">ID: {ranking.player.playerId}</div>
      </div>
    </div>
  );

  const totalPages = Math.ceil(data.pagination.total / pageSize);

  return (
    <div className="space-y-4">
      {/* 游戏信息和筛选器 */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              {data.game.name} 排行榜
            </h2>
            <p className="text-sm text-gray-500">
              总计 {data.pagination.total} 名玩家
            </p>
          </div>
          <Button
            onClick={() => fetchLeaderboard(selectedPlatform || undefined, currentPage)}
            variant="outline"
            disabled={loading}
          >
            {loading ? '刷新中...' : '刷新数据'}
          </Button>
        </div>
        
        {/* 平台筛选 */}
        <div className="flex items-center space-x-4">
          <label className="text-sm font-medium text-gray-700">筛选平台:</label>
          <select
            value={selectedPlatform}
            onChange={(e) => handlePlatformChange(e.target.value)}
            className="border border-gray-300 rounded-md px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">全部平台</option>
            <option value="WECHAT">微信小程序</option>
            <option value="DOUYIN">抖音小程序</option>
            <option value="IOS_APP">iOS应用</option>
            <option value="ANDROID_APP">Android应用</option>
          </select>
        </div>
      </div>

      {/* 排行榜表格 */}
      <div className="bg-white rounded-lg shadow">
        <Table>
          <TableHeader>
            <TableRow>
              <TableCell header>排名</TableCell>
              <TableCell header>玩家信息</TableCell>
              <TableCell header>分值</TableCell>
              <TableCell header>游戏时长</TableCell>
              <TableCell header>来源平台</TableCell>
              <TableCell header>地理位置</TableCell>
              <TableCell header>操作</TableCell>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell className="text-center py-8" colSpan={7}>
                  加载中...
                </TableCell>
              </TableRow>
            ) : data.rankings.length === 0 ? (
              <TableRow>
                <TableCell className="text-center py-8 text-gray-500" colSpan={7}>
                  暂无排行榜数据
                </TableCell>
              </TableRow>
            ) : (
              data.rankings.map((ranking) => (
                <TableRow key={ranking.player.id}>
                  <TableCell>
                    <div className="font-semibold text-lg">
                      #{ranking.rank}
                    </div>
                  </TableCell>
                  <TableCell>
                    {renderPlayerCell(ranking)}
                  </TableCell>
                  <TableCell>
                    <div className="font-semibold text-blue-600">
                      {ranking.player.score.toLocaleString()}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      {formatduration(ranking.player.duration)}
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      {platformNames[ranking.player.platform]}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm text-gray-600">
                      {formatLocation(ranking.player.location)}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Button
                      onClick={() => handlePlayerClick(ranking.player)}
                      variant="outline"
                      size="sm"
                    >
                      查看详情
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
        
        {/* 分页 */}
        {totalPages > 1 && (
          <div className="px-6 py-4 border-t border-gray-200">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-700">
                显示第 {(currentPage - 1) * pageSize + 1} - {Math.min(currentPage * pageSize, data.pagination.total)} 条，
                共 {data.pagination.total} 条记录
              </div>
              <div className="flex space-x-2">
                <Button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  variant="outline"
                  size="sm"
                >
                  上一页
                </Button>
                <span className="px-3 py-1 text-sm text-gray-700">
                  第 {currentPage} / {totalPages} 页
                </span>
                <Button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  variant="outline"
                  size="sm"
                >
                  下一页
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 玩家详情模态框 */}
      <Modal
        isOpen={showPlayerModal}
        onClose={() => setShowPlayerModal(false)}
        title="玩家详情"
      >
        {selectedPlayer && (
          <div className="space-y-4">
            <div className="flex items-center space-x-4">
              {selectedPlayer.avatarUrl && (
                <img
                  src={selectedPlayer.avatarUrl}
                  alt={selectedPlayer.nickname}
                  className="w-16 h-16 rounded-full object-cover"
                />
              )}
              <div>
                <h3 className="text-lg font-semibold">{selectedPlayer.nickname}</h3>
                <p className="text-gray-600">ID: {selectedPlayer.playerId}</p>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">分值</label>
                <p className="text-lg font-semibold text-blue-600">
                  {selectedPlayer.score.toLocaleString()}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">游戏时长</label>
                <p className="text-sm">{formatduration(selectedPlayer.duration)}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">来源平台</label>
                <p className="text-sm">{platformNames[selectedPlayer.platform]}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">地理位置</label>
                <p className="text-sm">{formatLocation(selectedPlayer.location)}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">注册时间</label>
                <p className="text-sm">
                  {new Date(selectedPlayer.createdAt).toLocaleString('zh-CN')}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">最后更新</label>
                <p className="text-sm">
                  {new Date(selectedPlayer.updatedAt).toLocaleString('zh-CN')}
                </p>
              </div>
            </div>
            
            {selectedPlayer.detailsJson && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">详情信息</label>
                <pre className="bg-gray-100 p-3 rounded text-xs overflow-auto max-h-40">
                  {JSON.stringify(selectedPlayer.detailsJson, null, 2)}
                </pre>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}