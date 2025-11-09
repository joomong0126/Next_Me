export interface ThemeColors {
  name: string;
  displayName: string;
  gradient: string;
  light: {
    primary: string;
    primaryLight: string;
    primaryDark: string;
    accent: string;
    accentForeground: string;
    ring: string;
    sidebarPrimary: string;
    sidebarAccentForeground: string;
    chart1: string;
    chart3: string;
    chart5: string;
  };
  dark: {
    primary: string;
    primaryLight: string;
    primaryDark: string;
    accent: string;
    accentForeground: string;
    ring: string;
    sidebarPrimary: string;
    sidebarAccentForeground: string;
    chart1: string;
    chart3: string;
    chart5: string;
  };
}

export const themes: ThemeColors[] = [
  {
    name: 'skyblue',
    displayName: 'Sky Blue',
    gradient: 'from-blue-400 to-blue-600',
    light: {
      primary: '#60A5FA',
      primaryLight: '#93C5FD',
      primaryDark: '#3B82F6',
      accent: '#DBEAFE',
      accentForeground: '#60A5FA',
      ring: '#60A5FA',
      sidebarPrimary: '#60A5FA',
      sidebarAccentForeground: '#60A5FA',
      chart1: '#60A5FA',
      chart3: '#93C5FD',
      chart5: '#BFDBFE',
    },
    dark: {
      primary: '#60A5FA',
      primaryLight: '#93C5FD',
      primaryDark: '#3B82F6',
      accent: '#1E40AF',
      accentForeground: '#93C5FD',
      ring: '#60A5FA',
      sidebarPrimary: '#60A5FA',
      sidebarAccentForeground: '#60A5FA',
      chart1: '#60A5FA',
      chart3: '#93C5FD',
      chart5: '#BFDBFE',
    },
  },
  {
    name: 'purple',
    displayName: 'Purple',
    gradient: 'from-purple-400 to-purple-600',
    light: {
      primary: '#A855F7',
      primaryLight: '#C084FC',
      primaryDark: '#9333EA',
      accent: '#F3E8FF',
      accentForeground: '#A855F7',
      ring: '#A855F7',
      sidebarPrimary: '#A855F7',
      sidebarAccentForeground: '#A855F7',
      chart1: '#A855F7',
      chart3: '#C084FC',
      chart5: '#E9D5FF',
    },
    dark: {
      primary: '#A855F7',
      primaryLight: '#C084FC',
      primaryDark: '#9333EA',
      accent: '#581C87',
      accentForeground: '#C084FC',
      ring: '#A855F7',
      sidebarPrimary: '#A855F7',
      sidebarAccentForeground: '#A855F7',
      chart1: '#A855F7',
      chart3: '#C084FC',
      chart5: '#E9D5FF',
    },
  },
  {
    name: 'green',
    displayName: 'Green',
    gradient: 'from-green-400 to-green-600',
    light: {
      primary: '#10B981',
      primaryLight: '#34D399',
      primaryDark: '#059669',
      accent: '#D1FAE5',
      accentForeground: '#10B981',
      ring: '#10B981',
      sidebarPrimary: '#10B981',
      sidebarAccentForeground: '#10B981',
      chart1: '#10B981',
      chart3: '#6EE7B7',
      chart5: '#A7F3D0',
    },
    dark: {
      primary: '#10B981',
      primaryLight: '#34D399',
      primaryDark: '#059669',
      accent: '#064E3B',
      accentForeground: '#6EE7B7',
      ring: '#10B981',
      sidebarPrimary: '#10B981',
      sidebarAccentForeground: '#10B981',
      chart1: '#10B981',
      chart3: '#6EE7B7',
      chart5: '#A7F3D0',
    },
  },
  {
    name: 'orange',
    displayName: 'Orange',
    gradient: 'from-orange-400 to-orange-600',
    light: {
      primary: '#F59E0B',
      primaryLight: '#FBBf24',
      primaryDark: '#D97706',
      accent: '#FEF3C7',
      accentForeground: '#F59E0B',
      ring: '#F59E0B',
      sidebarPrimary: '#F59E0B',
      sidebarAccentForeground: '#F59E0B',
      chart1: '#F59E0B',
      chart3: '#FCD34D',
      chart5: '#FDE68A',
    },
    dark: {
      primary: '#F59E0B',
      primaryLight: '#FBBF24',
      primaryDark: '#D97706',
      accent: '#78350F',
      accentForeground: '#FCD34D',
      ring: '#F59E0B',
      sidebarPrimary: '#F59E0B',
      sidebarAccentForeground: '#F59E0B',
      chart1: '#F59E0B',
      chart3: '#FCD34D',
      chart5: '#FDE68A',
    },
  },
  {
    name: 'pink',
    displayName: 'Pink',
    gradient: 'from-pink-400 to-pink-600',
    light: {
      primary: '#EC4899',
      primaryLight: '#F472B6',
      primaryDark: '#DB2777',
      accent: '#FCE7F3',
      accentForeground: '#EC4899',
      ring: '#EC4899',
      sidebarPrimary: '#EC4899',
      sidebarAccentForeground: '#EC4899',
      chart1: '#EC4899',
      chart3: '#F9A8D4',
      chart5: '#FBCFE8',
    },
    dark: {
      primary: '#EC4899',
      primaryLight: '#F472B6',
      primaryDark: '#DB2777',
      accent: '#831843',
      accentForeground: '#F9A8D4',
      ring: '#EC4899',
      sidebarPrimary: '#EC4899',
      sidebarAccentForeground: '#EC4899',
      chart1: '#EC4899',
      chart3: '#F9A8D4',
      chart5: '#FBCFE8',
    },
  },
  {
    name: 'indigo',
    displayName: 'Indigo',
    gradient: 'from-indigo-400 to-indigo-600',
    light: {
      primary: '#6366F1',
      primaryLight: '#818CF8',
      primaryDark: '#4F46E5',
      accent: '#E0E7FF',
      accentForeground: '#6366F1',
      ring: '#6366F1',
      sidebarPrimary: '#6366F1',
      sidebarAccentForeground: '#6366F1',
      chart1: '#6366F1',
      chart3: '#A5B4FC',
      chart5: '#C7D2FE',
    },
    dark: {
      primary: '#6366F1',
      primaryLight: '#818CF8',
      primaryDark: '#4F46E5',
      accent: '#312E81',
      accentForeground: '#A5B4FC',
      ring: '#6366F1',
      sidebarPrimary: '#6366F1',
      sidebarAccentForeground: '#6366F1',
      chart1: '#6366F1',
      chart3: '#A5B4FC',
      chart5: '#C7D2FE',
    },
  },
  {
    name: 'red',
    displayName: 'Red',
    gradient: 'from-red-400 to-red-600',
    light: {
      primary: '#EF4444',
      primaryLight: '#F87171',
      primaryDark: '#DC2626',
      accent: '#FEE2E2',
      accentForeground: '#EF4444',
      ring: '#EF4444',
      sidebarPrimary: '#EF4444',
      sidebarAccentForeground: '#EF4444',
      chart1: '#EF4444',
      chart3: '#FCA5A5',
      chart5: '#FECACA',
    },
    dark: {
      primary: '#EF4444',
      primaryLight: '#F87171',
      primaryDark: '#DC2626',
      accent: '#7F1D1D',
      accentForeground: '#FCA5A5',
      ring: '#EF4444',
      sidebarPrimary: '#EF4444',
      sidebarAccentForeground: '#EF4444',
      chart1: '#EF4444',
      chart3: '#FCA5A5',
      chart5: '#FECACA',
    },
  },
  {
    name: 'teal',
    displayName: 'Teal',
    gradient: 'from-teal-400 to-teal-600',
    light: {
      primary: '#14B8A6',
      primaryLight: '#2DD4BF',
      primaryDark: '#0D9488',
      accent: '#CCFBF1',
      accentForeground: '#14B8A6',
      ring: '#14B8A6',
      sidebarPrimary: '#14B8A6',
      sidebarAccentForeground: '#14B8A6',
      chart1: '#14B8A6',
      chart3: '#5EEAD4',
      chart5: '#99F6E4',
    },
    dark: {
      primary: '#14B8A6',
      primaryLight: '#2DD4BF',
      primaryDark: '#0D9488',
      accent: '#134E4A',
      accentForeground: '#5EEAD4',
      ring: '#14B8A6',
      sidebarPrimary: '#14B8A6',
      sidebarAccentForeground: '#14B8A6',
      chart1: '#14B8A6',
      chart3: '#5EEAD4',
      chart5: '#99F6E4',
    },
  },
  {
    name: 'black',
    displayName: 'Black',
    gradient: 'from-gray-700 to-gray-900',
    light: {
      primary: '#1A1A1A',
      primaryLight: '#4A4A4A',
      primaryDark: '#000000',
      accent: '#F5F5F5',
      accentForeground: '#1A1A1A',
      ring: '#1A1A1A',
      sidebarPrimary: '#1A1A1A',
      sidebarAccentForeground: '#1A1A1A',
      chart1: '#1A1A1A',
      chart3: '#6B6B6B',
      chart5: '#A0A0A0',
    },
    dark: {
      primary: '#F5F5F5',
      primaryLight: '#FFFFFF',
      primaryDark: '#E0E0E0',
      accent: '#2D2D2D',
      accentForeground: '#F5F5F5',
      ring: '#F5F5F5',
      sidebarPrimary: '#F5F5F5',
      sidebarAccentForeground: '#F5F5F5',
      chart1: '#F5F5F5',
      chart3: '#C0C0C0',
      chart5: '#909090',
    },
  },
  {
    name: 'white',
    displayName: 'White',
    gradient: 'from-gray-200 to-gray-400',
    light: {
      primary: '#6B7280',
      primaryLight: '#9CA3AF',
      primaryDark: '#4B5563',
      accent: '#F9FAFB',
      accentForeground: '#6B7280',
      ring: '#6B7280',
      sidebarPrimary: '#6B7280',
      sidebarAccentForeground: '#6B7280',
      chart1: '#6B7280',
      chart3: '#9CA3AF',
      chart5: '#D1D5DB',
    },
    dark: {
      primary: '#D1D5DB',
      primaryLight: '#E5E7EB',
      primaryDark: '#9CA3AF',
      accent: '#374151',
      accentForeground: '#D1D5DB',
      ring: '#D1D5DB',
      sidebarPrimary: '#D1D5DB',
      sidebarAccentForeground: '#D1D5DB',
      chart1: '#D1D5DB',
      chart3: '#9CA3AF',
      chart5: '#6B7280',
    },
  },
];

function hexToRgb(hex: string): string {
  // Remove # if present
  hex = hex.replace('#', '');
  
  // Parse hex to RGB
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);
  
  return `${r} ${g} ${b}`;
}

export function applyTheme(themeName: string, isDark: boolean) {
  const theme = themes.find(t => t.name === themeName);
  if (!theme) return;

  const colors = isDark ? theme.dark : theme.light;
  const root = document.documentElement;

  // Apply theme colors as RGB values for Tailwind
  root.style.setProperty('--primary', hexToRgb(colors.primary));
  root.style.setProperty('--ring', hexToRgb(colors.ring));
  root.style.setProperty('--accent', hexToRgb(colors.accent));
  root.style.setProperty('--accent-foreground', hexToRgb(colors.accentForeground));
  root.style.setProperty('--sidebar-primary', hexToRgb(colors.sidebarPrimary));
  root.style.setProperty('--sidebar-accent-foreground', hexToRgb(colors.sidebarAccentForeground));
  root.style.setProperty('--sidebar-ring', hexToRgb(colors.ring));
  root.style.setProperty('--chart-1', hexToRgb(colors.chart1));
  root.style.setProperty('--chart-3', hexToRgb(colors.chart3));
  root.style.setProperty('--chart-5', hexToRgb(colors.chart5));
  
  // Store additional colors as hex for inline styles and compatibility
  root.style.setProperty('--theme-primary', colors.primary);
  root.style.setProperty('--theme-primary-light', colors.primaryLight);
  root.style.setProperty('--theme-primary-dark', colors.primaryDark);
}
