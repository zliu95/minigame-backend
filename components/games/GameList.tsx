'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Table, TableHeader, TableBody, TableRow, TableCell } from '@/components/ui/Table';
import { Modal } from '@/components/ui/Modal';
import { formatDate } from '@/lib/utils';

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

interface GameListProps {
  games: Game[];
  onEdit: (game: Game) => void;
  onDelete: (gameId: string) => Promise<void>;
  isLoading?: boolean;
}

export function GameList({ games, onEdit, onDelete, isLoading }: GameListProps) {
  const [deleteModal, setDeleteModal] = useState<{
    isOpen: boolean;
    game: Game | null;
  }>({
    isOpen: false,
    game: null,
  });
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleDeleteClick = (game: Game) => {
    setDeleteModal({
      isOpen: true,
      game,
    });
  };

  const handleDeleteConfirm = async () => {
    if (!deleteModal.game) return;

    setDeletingId(deleteModal.game.id);
    try {
      await onDelete(deleteModal.game.id);
      setDeleteModal({ isOpen: false, game: null });
    } catch (error) {
      console.error('删除失败:', error);
    } finally {
      setDeletingId(null);
    }
  };

  const handleDeleteCancel = () => {
    setDeleteModal({ isOpen: false, game: null });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (games.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-gray-500 text-lg mb-2">暂无游戏</div>
        <div className="text-gray-400 text-sm">点击"创建游戏"按钮添加第一个游戏</div>
      </div>
    );
  }

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow>
            <TableCell header>游戏名称</TableCell>
            <TableCell header>英文简称</TableCell>
            <TableCell header>状态</TableCell>
            <TableCell header>玩家数量</TableCell>
            <TableCell header>创建时间</TableCell>
            <TableCell header>操作</TableCell>
          </TableRow>
        </TableHeader>
        <TableBody>
          {games.map((game) => (
            <TableRow key={game.id}>
              <TableCell>
                <div>
                  <div className="font-medium text-gray-900">{game.name}</div>
                  {game.description && (
                    <div className="text-sm text-gray-500 mt-1 truncate max-w-xs">
                      {game.description}
                    </div>
                  )}
                </div>
              </TableCell>
              <TableCell>
                <code className="px-2 py-1 bg-gray-100 rounded text-sm">
                  {game.shortName}
                </code>
              </TableCell>
              <TableCell>
                <span
                  className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                    game.isActive
                      ? 'bg-green-100 text-green-800'
                      : 'bg-gray-100 text-gray-800'
                  }`}
                >
                  {game.isActive ? '活跃' : '停用'}
                </span>
              </TableCell>
              <TableCell>
                <span className="text-gray-900 font-medium">
                  {game._count.players.toLocaleString()}
                </span>
              </TableCell>
              <TableCell>
                <span className="text-gray-500">
                  {formatDate(new Date(game.createdAt))}
                </span>
              </TableCell>
              <TableCell>
                <div className="flex space-x-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onEdit(game)}
                  >
                    编辑
                  </Button>
                  <Button
                    size="sm"
                    variant="danger"
                    onClick={() => handleDeleteClick(game)}
                    disabled={game._count.players > 0}
                  >
                    删除
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {/* 删除确认对话框 */}
      <Modal
        isOpen={deleteModal.isOpen}
        onClose={handleDeleteCancel}
        title="确认删除游戏"
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-gray-600">
            确定要删除游戏 <strong>{deleteModal.game?.name}</strong> 吗？
          </p>
          
          {deleteModal.game && deleteModal.game._count.players > 0 && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-sm text-red-600">
                该游戏包含 {deleteModal.game._count.players} 个玩家记录，无法删除。
                请先清理相关数据。
              </p>
            </div>
          )}

          <div className="flex justify-end space-x-3">
            <Button
              variant="outline"
              onClick={handleDeleteCancel}
              disabled={deletingId === deleteModal.game?.id}
            >
              取消
            </Button>
            <Button
              variant="danger"
              onClick={handleDeleteConfirm}
              loading={deletingId === deleteModal.game?.id}
              disabled={deleteModal.game ? deleteModal.game._count.players > 0 : false}
            >
              确认删除
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}