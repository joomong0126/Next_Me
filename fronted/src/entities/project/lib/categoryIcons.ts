import type { LucideIcon } from 'lucide-react';
import {
  BarChart3,
  Briefcase,
  Calendar as CalendarIcon,
  Code,
  FileText,
  Layout,
  Megaphone,
  MessageSquare,
  Palette,
  PenTool,
  Sparkles,
  TrendingUp,
} from 'lucide-react';

export interface CategoryIconInfo {
  icon: LucideIcon;
  gradient: string;
}

const DEFAULT_CATEGORY_KEY = '기타';

const categoryIconMap: Record<string, CategoryIconInfo> = {
  // 마케팅 카테고리
  '브랜드 마케팅': { icon: Megaphone, gradient: 'from-blue-500 to-cyan-500' },
  'SNS 마케팅': { icon: MessageSquare, gradient: 'from-purple-500 to-pink-500' },
  '콘텐츠 마케팅': { icon: PenTool, gradient: 'from-orange-500 to-red-500' },
  '퍼포먼스 마케팅': { icon: TrendingUp, gradient: 'from-green-500 to-emerald-500' },
  'UI/UX 디자인': { icon: Layout, gradient: 'from-indigo-500 to-purple-500' },
  '그래픽 디자인': { icon: Palette, gradient: 'from-pink-500 to-rose-500' },

  // 개발 카테고리
  프론트엔드: { icon: Code, gradient: 'from-blue-500 to-cyan-500' },
  백엔드: { icon: Code, gradient: 'from-purple-500 to-pink-500' },
  풀스택: { icon: Code, gradient: 'from-orange-500 to-red-500' },
  '데이터 분석': { icon: BarChart3, gradient: 'from-green-500 to-emerald-500' },
  'AI/ML': { icon: Sparkles, gradient: 'from-indigo-500 to-purple-500' },
  '모바일 앱': { icon: Code, gradient: 'from-pink-500 to-rose-500' },

  // 기타 도메인 예시
  기획: { icon: CalendarIcon, gradient: 'from-sky-500 to-blue-500' },
  프레젠테이션: { icon: MessageSquare, gradient: 'from-purple-500 to-violet-500' },
  협업: { icon: Briefcase, gradient: 'from-cyan-500 to-blue-500' },
  디자인: { icon: Palette, gradient: 'from-pink-500 to-rose-500' },

  // 기본값
  [DEFAULT_CATEGORY_KEY]: { icon: FileText, gradient: 'from-gray-500 to-gray-600' },
};

export function getCategoryIcon(category: string): CategoryIconInfo {
  return categoryIconMap[category] ?? categoryIconMap[DEFAULT_CATEGORY_KEY];
}

export const CATEGORY_ICON_MAP = categoryIconMap;
export const CATEGORY_ICON_DEFAULT_KEY = DEFAULT_CATEGORY_KEY;


