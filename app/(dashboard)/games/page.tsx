'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { GameList } from '@/components/games/GameList';
import { GameForm } from '@/components/forms/GameForm';
import { GameInput } from '@/lib/validations';

interface Game {
  id: string;
  name: string;
  shortName: string;
  description?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  _count: {
    players: number;
  };
}

interface GameFormData extends GameInput {
  id?: string;
}

export default function GamesPage() {
  const { data: session } = useSession();
  const [games, setGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [formModal, setFormModal] = useState<{
    isOpen: boolean;
    game: GameFormData | null;
  }>({
    isOpen: false,
    game: null,
  });
  const [formLoading, setFormLoading] = useState(false);

  // 获取游戏列表
  const fetchGames = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (searchTerm) {
        params.append('search', searchTerm);
      }
      
      const response = await fetch(`/api/games?${params.toString()}`);
      const result = await response.json();
      
      if (result.success) {
        setGames(result.data.games);
      } else {
        console.error('获取游戏列表失败:', result.message);
      }
    } catch (error) {
      console.error('获取游戏列表失败:', error);
    } finally {
      setLoading(false);
    }
  };

  // 初始加载和搜索变化时重新获取
  useEffect(() => {
    fetchGames();
  }, [searchTerm]);

  // 创建游戏
  const handleCreateGame = () => {
    setFormModal({
      isOpen: true,
      game: null,
    });
  };

  // 编辑游戏
  const handleEditGame = (game: Game) => {
    setFormModal({
      isOpen: true,
      game: {
        id: game.id,
        name: game.name,
        shortName: game.shortName,
        description: game.description,
      },
    });
  };

  // 提交表单
  const handleFormSubmit = async (data: GameInput) => {
    setFormLoading(true);
    try {
      const isEdit = !!formModal.game?.id;
      const url = isEdit ? `/api/games/${formModal.game?.id}` : '/api/games';
      const method = isEdit ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (result.success) {
        setFormModal({ isOpen: false, game: null });
        await fetchGames(); // 重新获取列表
      } else {
        throw new Error(result.message || '操作失败');
      }
    } catch (error: any) {
      throw error;
    } finally {
      setFormLoading(false);
    }
  };

  // 删除游戏
  const handleDeleteGame = async (gameId: string) => {
    const response = await fetch(`/api/games/${gameId}`, {
      method: 'DELETE',
    });

    const result = await response.json();

    if (result.success) {
      await fetchGames(); // 重新获取列表
    } else {
      throw new Error(result.message || '删除失败');
    }
  };

  // 关闭表单
  const handleFormCancel = () => {
    setFormModal({ isOpen: false, game: null });
  };

  if (!session) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="text-lg text-gray-600">请先登录</div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* 页面标题和操作栏 */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">游戏管理</h1>
          <p className="text-gray-600 mt-1">管理游戏信息和排行榜设置</p>
        </div>
        <div className="mt-4 sm:mt-0">
          <Button onClick={handleCreateGame}>
            创建游戏
          </Button>
        </div>
      </div>

      {/* 搜索栏 */}
      <div className="mb-6">
        <Input
          placeholder="搜索游戏名称或英文简称..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-md"
        />
      </div>

      {/* 游戏列表 */}
      <div className="bg-white rounded-lg shadow">
        <GameList
          games={games}
          onEdit={handleEditGame}
          onDelete={handleDeleteGame}
          isLoading={loading}
        />
      </div>

      {/* 游戏表单模态框 */}
      <Modal
        isOpen={formModal.isOpen}
        onClose={handleFormCancel}
        title={formModal.game?.id ? '编辑游戏' : '创建游戏'}
        size="md"
      >
        <GameForm
          initialData={formModal.game || undefined}
          onSubmit={handleFormSubmit}
          onCancel={handleFormCancel}
          isLoading={formLoading}
        />
      </Modal>
    </div>
  );
}