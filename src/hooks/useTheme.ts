import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { lightTheme, darkTheme, AppTheme } from '../theme';
import { AuthService } from '../services/AuthService';

interface ThemeState {
  isDarkMode: boolean;
  theme: AppTheme;
  toggleTheme: () => void;
  setDarkMode: (isDark: boolean) => void;
  loadTheme: () => Promise<void>;
}

export const useThemeStore = create<ThemeState>((set, get) => ({
  isDarkMode: false,
  theme: lightTheme,
  toggleTheme: async () => {
    const newIsDarkMode = !get().isDarkMode;
    const newTheme = newIsDarkMode ? 'dark' : 'light';

    set({
      isDarkMode: newIsDarkMode,
      theme: newIsDarkMode ? darkTheme : lightTheme,
    });

    await AsyncStorage.setItem('theme', newTheme);
    await AuthService.updateThemePreference(newTheme);
  },
  setDarkMode: async (isDark: boolean) => {
    const newTheme = isDark ? 'dark' : 'light';

    set({
      isDarkMode: isDark,
      theme: isDark ? darkTheme : lightTheme,
    });

    await AsyncStorage.setItem('theme', newTheme);
    await AuthService.updateThemePreference(newTheme);
  },
  loadTheme: async () => {
    const storedTheme = await AsyncStorage.getItem('theme');
    if (storedTheme) {
      const isDark = storedTheme === 'dark';
      set({
        isDarkMode: isDark,
        theme: isDark ? darkTheme : lightTheme,
      });
    }
  },
}));
