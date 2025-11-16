'use client';

import { ReactNode } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';
import { Button } from '@/components/ui/Button';

interface DashboardLayoutProps {
  children: ReactNode;
}

function Navigation() {
  const pathname = usePathname();
  const { data: session } = useSession();

  const navItems = [
    { href: '/games', label: '游戏管理', icon: '🎮' },
    { href: '/leaderboards', label: '排行榜', icon: '🏆' },
    { href: '/analytics', label: '数据分析', icon: '📊' },
  ];

  const handleLogout = () => {
    signOut({ callbackUrl: '/login' });
  };

  return (
    <nav className="bg-white shadow-sm border-r border-gray-200 w-64 min-h-screen flex flex-col">
      <div className="p-6">
        <h2 className="text-xl font-bold text-gray-900">游戏管理后台</h2>
      </div>
      
      <div className="px-3 flex-1">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center px-3 py-2 mb-1 text-sm font-medium rounded-md transition-colors ${
                isActive
                  ? 'bg-blue-100 text-blue-700'
                  : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
              }`}
            >
              <span className="mr-3">{item.icon}</span>
              {item.label}
            </Link>
          );
        })}
      </div>

      {/* 用户信息和登出 */}
      <div className="p-3 border-t border-gray-200">
        {session && (
          <div className="mb-3">
            <div className="text-sm text-gray-600">当前用户</div>
            <div className="text-sm font-medium text-gray-900">
              {session.user?.username || '管理员'}
            </div>
          </div>
        )}
        <Button
          variant="outline"
          size="sm"
          onClick={handleLogout}
          className="w-full"
        >
          退出登录
        </Button>
      </div>
    </nav>
  );
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  return (
    <div className="flex min-h-screen bg-gray-50">
      <Navigation />
      <main className="flex-1">
        {children}
      </main>
    </div>
  );
}