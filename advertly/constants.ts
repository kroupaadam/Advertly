// Storage Keys
export const STORAGE_KEYS = {
  SETTINGS: 'advertly_user_settings',
  PROFILES: 'advertly_profiles',
  STRATEGIES: 'advertly_strategies',
  ACTIVE_PROFILE: 'advertly_active_profile_id',
  CREDITS: 'advertly_credits',
  AUTH: 'advertly_is_authenticated',
  LOGIN_TIMESTAMP: 'advertly_login_timestamp',
  ONBOARDING_COMPLETED: 'advertly_onboarding_completed',
  NOTIFICATIONS: 'advertly_notifications',
  CURRENT_PAGE: 'advertly_current_page',
} as const;

// CSS Classes
export const INPUT_CLASSES = {
  BASE: 'w-full pl-4 pr-4 py-2.5 bg-gray-50/50 border border-gray-200 rounded-lg focus:bg-white focus:border-primary focus:ring-4 focus:ring-primary/5 outline-none transition-all font-medium text-sm text-gray-800',
  WITH_ICON: 'w-full pl-4 pr-12 py-2.5 bg-gray-50/50 border border-gray-200 rounded-lg focus:bg-white focus:border-primary focus:ring-4 focus:ring-primary/5 outline-none transition-all font-medium text-sm text-gray-800',
  LABEL: 'block text-xs font-bold text-gray-500 tracking-wide mb-2 ml-1',
  TEXTAREA: 'w-full p-4 border border-gray-200 rounded-lg focus:border-primary focus:ring-4 focus:ring-primary/5 outline-none transition-all font-medium text-gray-800 resize-none',
} as const;

export const BUTTON_CLASSES = {
  PRIMARY: 'w-full py-4 bg-violet-600 hover:bg-violet-700 text-white rounded-xl font-bold text-sm tracking-wide shadow-xl shadow-violet-600/25 transition-all flex items-center justify-center gap-3 active:scale-[0.98] disabled:opacity-70',
  SECONDARY: 'flex items-center justify-center gap-3 px-4 py-3 border border-gray-200 rounded-xl hover:bg-gray-50 transition-all font-bold text-sm text-gray-700 active:scale-[0.98] disabled:opacity-50',
  SOCIAL: 'flex items-center justify-center gap-3 px-4 py-3 border border-gray-200 rounded-xl hover:bg-gray-50 transition-all font-bold text-sm text-gray-700 active:scale-[0.98] disabled:opacity-50',
} as const;

export const CARD_CLASSES = {
  BASE: 'bg-white rounded-2xl border border-gray-200 p-6 hover:border-gray-300 transition-colors',
  DARK: 'bg-gray-50/50 rounded-2xl border border-gray-200 p-6',
} as const;

// Navigation
export const NAV_ITEMS = [
  { id: 'dashboard', label: 'Přehled', icon: 'LayoutDashboard' },
  { id: 'strategy', label: 'Strategie', icon: 'Lightbulb' },
  { id: 'new-strategy', label: 'Nová strategie', icon: 'Megaphone' },
  { id: 'campaigns', label: 'Kampaně', icon: 'PieChart' },
  { id: 'analytics', label: 'Analýza', icon: 'BarChart3' },
  { id: 'profile', label: 'Profil', icon: 'UserCircle' },
  { id: 'settings', label: 'Nastavení', icon: 'Settings' },
  { id: 'resume-onboarding', label: 'Onboarding', icon: 'Lightbulb' },
] as const;

export type NavItemId = typeof NAV_ITEMS[number]['id'];

// Credits
export const CREDITS_CONFIG = {
  INITIAL: 2000,
  DAILY_BONUS: 100,
  STRATEGY_COST: 500,
  GENERATE_COST: 100,
} as const;
