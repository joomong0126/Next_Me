import React, { useState } from 'react';
import { Bell, Moon, Sun, Menu, LogOut } from 'lucide-react';
import { Button } from '@/shared/ui/shadcn/button';
import { Badge } from '@/shared/ui/shadcn/badge';
import { Popover, PopoverContent, PopoverTrigger } from '@/shared/ui/shadcn/popover';

interface HeaderProps {
  breadcrumb: string;
  darkMode: boolean;
  onToggleDarkMode: () => void;
  sidebarCollapsed?: boolean;
  onMenuClick?: () => void;
  onQuickAction?: () => void;
  onLogout?: () => void;
}

const notifications = [
  {
    id: 1,
    type: 'goal',
    title: '목표 마일스톤 달성!',
    message: '데이터 분석 역량 강화 목표가 75%를 달성했습니다.',
    time: '5분 전',
    read: false,
  },
  {
    id: 2,
    type: 'insight',
    title: 'AI 인사이트',
    message: '새로운 스킬 추천이 도착했습니다.',
    time: '1시간 전',
    read: false,
  },
  {
    id: 3,
    type: 'achievement',
    title: '새 업적 획득!',
    message: '캠페인 마스터 업적을 달성했습니다.',
    time: '3시간 전',
    read: true,
  },
];

export default function Header({ breadcrumb, darkMode, onToggleDarkMode, sidebarCollapsed = false, onMenuClick, onQuickAction, onLogout }: HeaderProps) {
  const [notificationOpen, setNotificationOpen] = useState(false);

  return (
    <header className={`h-16 md:h-20 bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl border-b border-gray-200/50 dark:border-gray-700/50 fixed top-0 left-0 ${sidebarCollapsed ? 'md:left-20' : 'md:left-72'} right-0 z-30 shadow-sm`}>
      <div className="h-full px-4 md:px-8 flex items-center justify-between gap-2 md:gap-0">
        {/* Mobile Menu & Breadcrumb */}
        <div className="flex items-center gap-2 md:gap-3 min-w-0 flex-1">
          {/* Hamburger Menu - Mobile Only */}
          <Button
            variant="ghost"
            size="icon"
            onClick={onMenuClick}
            className="md:hidden h-10 w-10 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 flex-shrink-0"
          >
            <Menu className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          </Button>

          {/* Breadcrumb */}
          <div className="flex items-center gap-2 md:gap-3 min-w-0">
            <div className="text-lg md:text-2xl text-gray-900 dark:text-white font-semibold tracking-tight truncate">
              {breadcrumb}
            </div>
          </div>
        </div>

        {/* Right Section */}
        <div className="flex items-center gap-1.5 md:gap-3 flex-shrink-0">
          {/* Notifications - Enhanced */}
          <Popover open={notificationOpen} onOpenChange={setNotificationOpen}>
            <PopoverTrigger 
              className="relative h-10 w-10 md:h-12 md:w-12 rounded-lg md:rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition-all hover:scale-105 inline-flex items-center justify-center"
            >
              <Bell className="w-4 h-4 md:w-5 md:h-5 text-gray-600 dark:text-gray-400" />
              <Badge className="absolute -top-1 -right-1 w-5 h-5 md:w-6 md:h-6 flex items-center justify-center p-0 bg-gradient-to-r from-red-500 to-pink-500 text-white border-2 border-white dark:border-gray-800 text-xs font-semibold animate-pulse">
                {notifications.filter(n => !n.read).length}
              </Badge>
            </PopoverTrigger>
            <PopoverContent className="w-80 md:w-96 p-0 rounded-lg" align="end">
              <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                <h3 className="font-semibold text-gray-900 dark:text-white">알림</h3>
              </div>
              <div className="max-h-96 overflow-y-auto">
                {notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`p-4 border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors cursor-pointer ${
                      !notification.read ? 'bg-blue-50/50 dark:bg-blue-950/20' : ''
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 ${!notification.read ? 'bg-blue-500' : 'bg-gray-300 dark:bg-gray-600'}`} />
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-1">
                          {notification.title}
                        </h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                          {notification.message}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-500">
                          {notification.time}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="p-3 border-t border-gray-200 dark:border-gray-700">
                <Button 
                  variant="ghost" 
                  className="w-full text-sm rounded-lg"
                  onClick={() => {
                    setNotificationOpen(false);
                    alert('모든 알림 페이지는 준비 중입니다.');
                  }}
                >
                  모든 알림 보기
                </Button>
              </div>
            </PopoverContent>
          </Popover>

          {/* Dark Mode Toggle - Enhanced */}
          <Button
            variant="ghost"
            size="icon"
            onClick={onToggleDarkMode}
            className="h-10 w-10 md:h-12 md:w-12 rounded-lg md:rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition-all hover:scale-105 hover:rotate-12"
          >
            {darkMode ? (
              <Sun className="w-4 h-4 md:w-5 md:h-5 text-yellow-500" />
            ) : (
              <Moon className="w-4 h-4 md:w-5 md:h-5 text-blue-600" />
            )}
          </Button>

          {/* Logout Button - Enhanced */}
          <Button
            variant="ghost"
            size="icon"
            onClick={onLogout}
            className="h-10 w-10 md:h-12 md:w-12 rounded-lg md:rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition-all hover:scale-105 hover:rotate-12"
          >
            <LogOut className="w-4 h-4 md:w-5 md:h-5 text-gray-600 dark:text-gray-400" />
          </Button>
        </div>
      </div>
    </header>
  );
}