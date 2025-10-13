import React, { useEffect } from 'react';
import { PaperProvider } from 'react-native-paper';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { AppNavigator } from './src/navigation/AppNavigator';
import { useFinanceStore } from './src/store/financeStore';
import { seedDemoData } from './src/utils/seedData';
import { useThemeStore } from './src/hooks/useTheme';
import { StatusBar } from 'expo-status-bar';

export default function App() {
  const initialize = useFinanceStore(state => state.initialize);
  const { theme, isDarkMode } = useThemeStore();

  useEffect(() => {
    const initApp = async () => {
      await initialize();
      await seedDemoData();
    };
    initApp();
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <PaperProvider theme={theme}>
        <StatusBar style={isDarkMode ? "light" : "dark"} />
        <AppNavigator />
      </PaperProvider>
    </GestureHandlerRootView>
  );
}
