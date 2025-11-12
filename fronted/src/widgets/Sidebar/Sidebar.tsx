import { Bot, FolderKanban, Brain, Target, Settings, Sparkles, Wand2, X } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/shared/ui/shadcn/avatar';
import { Button } from '@/shared/ui/shadcn/button';
import type { AppPage } from '@/shared/types/app';

interface SidebarProps {
  currentPage: AppPage;
  onNavigate: (page: AppPage) => void;
  isOpen?: boolean;
  onClose?: () => void;
}

const menuItems: Array<{ id: AppPage; label: string; icon: typeof FolderKanban; isComingSoon?: boolean }> = [
  { id: 'assistant', label: 'AI Assistant', icon: Bot },
  { id: 'career-generator', label: 'AI 커리어 생성기', icon: Wand2 },
  { id: 'projects', label: 'Projects', icon: FolderKanban },
  { id: 'skills', label: 'Skills & Insights', icon: Brain, isComingSoon: true },
  { id: 'goals', label: 'Goals', icon: Target, isComingSoon: true },
  { id: 'settings', label: 'Settings', icon: Settings },
];

export default function Sidebar({ currentPage, onNavigate, isOpen = false, onClose }: SidebarProps) {
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
      
      <div className={`w-72 h-screen bg-gradient-to-b from-[#0F172A] via-[#1E293B] to-[#0F172A] border-r border-[#334155] flex flex-col fixed left-0 top-0 shadow-2xl z-50 transition-transform duration-300 ${
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

        {/* Logo - Enhanced */}
        <div className="p-8 pb-6">
        <div className="flex items-center gap-4 group cursor-pointer">
          <div className="w-14 h-14 bg-white/10 rounded-xl flex items-center justify-center shadow-lg transition-all duration-300 group-hover:scale-105 group-hover:bg-white/15">
            <Sparkles className="w-7 h-7 text-white" />
          </div>
          <div>
            <div className="text-white text-2xl tracking-tight" style={{ fontFamily: 'Noto Sans KR', fontWeight: 700 }}>
              Next ME
            </div>
            <div className="text-gray-400 text-xs tracking-wide">AI Career Platform</div>
          </div>
        </div>
      </div>

      {/* Divider */}
      <div className="mx-6 h-px bg-gradient-to-r from-transparent via-[#334155] to-transparent mb-2"></div>

      {/* Menu Items - Enhanced */}
      <nav className="flex-1 px-4 py-2 overflow-y-auto">
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
                className={`w-full group relative flex items-center gap-3 px-4 py-3.5 rounded-lg transition-all duration-200 ${
                  isActive
                    ? 'bg-white/10 text-white shadow-lg'
                    : 'text-gray-400 hover:bg-white/5 hover:text-white'
                }`}
              >
                {/* Active indicator */}
                {isActive && (
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-white rounded-r-full"></div>
                )}
                
                <div className={`p-2 rounded-lg transition-all duration-200 ${
                  isActive 
                    ? 'bg-white/20' 
                    : 'group-hover:bg-white/10'
                }`}>
                  <Icon className="w-5 h-5" />
                </div>
                
                 <span className="flex-1 text-left font-medium">
                  {item.label}
                  {item.isComingSoon && (
                    <span className="ml-2 text-xs text-gray-500/80">(Coming Soon)</span>
                  )}
                </span>
              </button>
            );
          })}
        </div>
      </nav>



      {/* Profile - Enhanced */}
      <div className="p-4 border-t border-[#334155]">
        <div 
          className="flex items-center gap-3 p-3 rounded-lg bg-white/5 hover:bg-white/10 cursor-pointer transition-all duration-200 group"
          onClick={() => handleNavigate('settings')}
        >
          <Avatar className="ring-2 ring-white/20 w-11 h-11">
            <AvatarImage src="https://api.dicebear.com/7.x/avataaars/svg?seed=Yejin" />
            <AvatarFallback className="bg-white/10 text-white">예진</AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <div className="text-white font-medium truncate">예진님</div>
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              <span className="text-gray-400 text-sm">온라인</span>
            </div>
          </div>
          <Settings className="w-4 h-4 text-gray-400 group-hover:text-white transition-colors" />
        </div>
      </div>
    </div>
    </>
  );
}