import React, { useEffect } from 'react';
import { PaperProvider } from 'react-native-paper';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { AppNavigator } from './src/navigation/AppNavigator';
import { useFinanceStore } from './src/store/financeStore';
import { seedDemoData } from './src/utils/seedData';
import { useThemeStore } from './src/hooks/useTheme';
import { StatusBar } from 'expo-status-bar';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { notificationService } from './src/services/NotificationService';

export default function App() {
  const initialize = useFinanceStore(state => state.initialize);
  const { theme, isDarkMode } = useThemeStore();

  useEffect(() => {
    notificationService.init();
  }, []);

  // Initialization is now handled in AppNavigator when authenticated

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <PaperProvider
        theme={theme}
        settings={{ icon: (props) => <MaterialCommunityIcons {...props} /> }}
      >
        <StatusBar style={isDarkMode ? "light" : "dark"} />
        <AppNavigator />
      </PaperProvider>
    </GestureHandlerRootView>
  );
}
