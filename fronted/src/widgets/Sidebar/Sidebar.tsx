import { Bot, FolderKanban, Brain, Target, Settings, Sparkles, Wand2, X, ChevronLeft, ChevronRight } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/shared/ui/shadcn/avatar';
import { Button } from '@/shared/ui/shadcn/button';
import { Badge } from '@/shared/ui/shadcn/badge';
import type { AppPage } from '@/shared/types/app';
import { useUser } from '@/features/auth/hooks/useUser';

interface SidebarProps {
  currentPage: AppPage;
  onNavigate: (page: AppPage) => void;
  isOpen?: boolean;
  onClose?: () => void;
  collapsed?: boolean;
  onToggleCollapse?: () => void;
}

const menuItems: Array<{ id: AppPage; label: string; icon: typeof FolderKanban; isComingSoon?: boolean }> = [
  { id: 'assistant', label: 'AI Assistant', icon: Bot },
  { id: 'career-generator', label: 'AI 커리어 생성기', icon: Wand2 },
  { id: 'projects', label: 'Projects', icon: FolderKanban },
  { id: 'skills', label: 'Skills & Insights', icon: Brain, isComingSoon: true },
  { id: 'goals', label: 'Goals', icon: Target, isComingSoon: true },
  { id: 'settings', label: 'Settings', icon: Settings },
];

export default function Sidebar({ currentPage, onNavigate, isOpen = false, onClose, collapsed = false, onToggleCollapse }: SidebarProps) {
  const { data: user, isLoading: isUserLoading } = useUser();
  
  const handleNavigate = (page: AppPage) => {
    onNavigate(page);
    if (onClose) onClose();
  };

  return (
    <>
      {/* Overlay for mobile */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={onClose}
        />
      )}
      
      <div className={`${collapsed ? 'w-20' : 'w-72'} h-screen bg-gradient-to-b from-[#0F172A] via-[#1E293B] to-[#0F172A] border-r border-[#334155] flex flex-col fixed left-0 top-0 shadow-2xl z-50 transition-all duration-300 ${
        isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
      }`}>
        {/* Close button for mobile */}
        <Button
          variant="ghost"
          size="icon"
          onClick={onClose}
          className="absolute top-4 right-4 md:hidden text-white hover:bg-white/10 rounded-lg"
        >
          <X className="w-5 h-5" />
        </Button>

        {/* Logo & Collapse - Enhanced */}
        <div className={`p-8 pb-6 ${collapsed ? 'px-4' : ''}`}>
          <div className={`flex items-center ${collapsed ? 'justify-center' : 'gap-4'} group cursor-pointer`}>
            <div className={`${collapsed ? 'w-12 h-12' : 'w-14 h-14'} bg-white/10 rounded-xl flex items-center justify-center shadow-lg transition-all duration-300 group-hover:scale-105 group-hover:bg-white/15 overflow-hidden`}>
              <img src="/유령.png" alt="Next ME" className={`${collapsed ? 'w-8 h-8' : 'w-10 h-10'} object-cover`} />
            </div>
            {!collapsed && (
              <div>
                <div className="text-white text-2xl tracking-tight" style={{ fontFamily: 'Noto Sans KR', fontWeight: 700 }}>
                  Next ME
                </div>
                <div className="text-gray-400 text-xs tracking-wide">AI Career Platform</div>
              </div>
            )}
          </div>
          {/* Collapse toggle (desktop only) */}
          {onToggleCollapse && (
            <div className={`hidden md:flex ${collapsed ? 'justify-center' : 'justify-end'} mt-4`}>
              <Button
                variant="ghost"
                size="icon"
                onClick={onToggleCollapse}
                className="text-white hover:bg-white/10 rounded-lg"
                title={collapsed ? '사이드바 펼치기' : '사이드바 접기'}
              >
                {collapsed ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
              </Button>
            </div>
          )}
        </div>

      {/* Divider */}
      <div className={`${collapsed ? 'mx-3' : 'mx-6'} h-px bg-gradient-to-r from-transparent via-[#334155] to-transparent mb-2`}></div>

      {/* Menu Items - Enhanced */}
      <nav className={`flex-1 ${collapsed ? 'px-2' : 'px-4'} py-2 overflow-y-auto`}>
        <div className="space-y-1">
           {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = !item.isComingSoon && currentPage === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  if (item.isComingSoon) {
                    window.alert('해당 기능은 곧 제공될 예정입니다. 조금만 기다려 주세요!');
                    return;
                  }
                  handleNavigate(item.id);
                }}
                className={`w-full group relative flex items-center ${collapsed ? 'justify-center' : 'gap-3'} px-4 py-3.5 rounded-lg transition-all duration-200 ${
                  isActive
                    ? 'bg-white/10 text-white shadow-lg'
                    : 'text-gray-400 hover:bg-white/5 hover:text-white'
                }`}
                title={collapsed ? item.label : undefined}
              >
                {/* Active indicator */}
                {isActive && !collapsed && (
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-white rounded-r-full"></div>
                )}
                
                <div className={`p-2 rounded-lg transition-all duration-200 ${
                  isActive 
                    ? 'bg-white/20' 
                    : 'group-hover:bg-white/10'
                }`}>
                  <Icon className={`${collapsed ? 'w-5 h-5' : 'w-5 h-5'}`} />
                </div>
                
                 {!collapsed && (
                   <span className="flex-1 text-left font-medium">
                    {item.label}
                    {item.isComingSoon && (
                      <span className="ml-2 text-xs text-gray-500/80">(Coming Soon)</span>
                    )}
                  </span>
                 )}
              </button>
            );
          })}
        </div>
      </nav>



      {/* Profile - Enhanced */}
      <div className={`${collapsed ? 'p-2' : 'p-4'} border-t border-[#334155]`}>
        <div
          className={`flex items-center ${collapsed ? 'justify-center' : 'gap-3'} p-3 rounded-lg bg-white/5 hover:bg-white/10 cursor-pointer transition-all duration-200 group`}
          onClick={() => handleNavigate('settings')}
        >
          <Avatar className="ring-2 ring-white/20 w-11 h-11">
            <AvatarImage 
              src={user?.avatar_url || (user?.name ? `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(user.name)}&gender=female` : '/유령.png')} 
            />
            <AvatarFallback className="bg-white/10 text-white">
              {user?.name ? user.name.charAt(0) : '?'}
            </AvatarFallback>
          </Avatar>
          {!collapsed && (
            <>
              <div className="flex-1 min-w-0">
                <div className="text-white font-medium truncate">
                  {isUserLoading ? '로딩 중...' : user?.name ? `${user.name}님` : '사용자'}
                </div>
                {user?.goals && user.goals.length > 0 && (
                  <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                    {user.goals.slice(0, 2).map((goal: string, index: number) => (
                      <Badge
                        key={index}
                        variant="secondary"
                        className="text-xs py-0.5 px-2 bg-white/10 text-white border-white/20"
                      >
                        {goal}
                      </Badge>
                    ))}
                    {user.goals.length > 2 && (
                      <Badge
                        variant="secondary"
                        className="text-xs py-0.5 px-2 bg-white/10 text-white border-white/20"
                      >
                        +{user.goals.length - 2}
                      </Badge>
                    )}
                  </div>
                )}
              </div>
              <Settings className="w-4 h-4 text-gray-400 group-hover:text-white transition-colors" />
            </>
          )}
        </div>
      </div>
    </div>
    </>
  );
}