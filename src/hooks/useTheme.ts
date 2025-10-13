import { create } from 'zustand';
import { lightTheme, darkTheme, AppTheme } from '../theme';

interface ThemeState {
  isDarkMode: boolean;
  theme: AppTheme;
  toggleTheme: () => void;
  setDarkMode: (isDark: boolean) => void;
}

export const useThemeStore = create<ThemeState>((set) => ({
  isDarkMode: false,
  theme: lightTheme,
  toggleTheme: () =>
    set((state) => ({
      isDarkMode: !state.isDarkMode,
      theme: !state.isDarkMode ? darkTheme : lightTheme,
    })),
  setDarkMode: (isDark: boolean) =>
    set({
      isDarkMode: isDark,
      theme: isDark ? darkTheme : lightTheme,
    }),
}));
