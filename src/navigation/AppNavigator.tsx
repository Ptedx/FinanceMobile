import React, { useEffect } from 'react';
import { View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import { IconButton } from 'react-native-paper';
import { useThemeStore } from '../hooks/useTheme';
import { useAuthStore } from '../store/authStore';

import { DashboardScreen } from '../screens/DashboardScreen';
import { AddExpenseScreen } from '../screens/AddExpenseScreen';
import { AddIncomeScreen } from '../screens/AddIncomeScreen';
import { AddCreditCardScreen } from '../screens/AddCreditCardScreen';
import { BudgetsScreen } from '../screens/BudgetsScreen';
import { GoalsScreen } from '../screens/GoalsScreen';
import { TimelineScreen } from '../screens/TimelineScreen';
import { AlertsScreen } from '../screens/AlertsScreen';
import { LoginScreen } from '../screens/LoginScreen';
import { RegisterScreen } from '../screens/RegisterScreen';
import { SimulationScreen } from '../screens/SimulationScreen';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();
const AuthStack = createStackNavigator();

const TabNavigator = () => {
  const { theme } = useThemeStore();

  return (
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor: theme?.colors?.primary || '#6200ee',
        tabBarInactiveTintColor: theme?.colors?.onSurfaceVariant || '#666666',
        tabBarStyle: {
          backgroundColor: theme?.colors?.surface || '#ffffff',
          borderTopColor: theme?.colors?.outline || '#e0e0e0',
        },
        headerShown: false,
      }}
    >
      <Tab.Screen
        name="Dashboard"
        component={DashboardScreen}
        options={{
          tabBarLabel: 'Início',
          tabBarIcon: ({ color, size }) => (
            <Icon name="home" color={color} size={size} />
          ),
        }}
      />
      <Tab.Screen
        name="Timeline"
        component={TimelineScreen}
        options={{
          tabBarLabel: 'Timeline',
          tabBarIcon: ({ color, size }) => (
            <Icon name="history" color={color} size={size} />
          ),
        }}
      />
      <Tab.Screen
        name="Budgets"
        component={BudgetsScreen}
        options={{
          tabBarLabel: 'Orçamentos',
          tabBarIcon: ({ color, size }) => (
            <Icon name="wallet" color={color} size={size} />
          ),
        }}
      />
      <Tab.Screen
        name="Goals"
        component={GoalsScreen}
        options={{
          tabBarLabel: 'Metas',
          tabBarIcon: ({ color, size }) => (
            <Icon name="flag" color={color} size={size} />
          ),
        }}
      />
    </Tab.Navigator>
  );
};

const AuthNavigator = () => {
  return (
    <AuthStack.Navigator screenOptions={{ headerShown: false }}>
      <AuthStack.Screen name="Login" component={LoginScreen} />
      <AuthStack.Screen name="Register" component={RegisterScreen} />
    </AuthStack.Navigator>
  );
};

import { useFinanceStore } from '../store/financeStore';

// ... imports

import { LoadingScreen } from '../screens/LoadingScreen';
import { ErrorRetryScreen } from '../screens/ErrorRetryScreen';

export const AppNavigator = () => {
  const { theme, toggleTheme, isDarkMode, loadTheme } = useThemeStore();
  const { isAuthenticated, checkAuth, logout } = useAuthStore();
  const { initialize, isLoading, error, isInitialized, retry } = useFinanceStore();

  useEffect(() => {
    checkAuth();
    loadTheme();
  }, []);

  useEffect(() => {
    if (isAuthenticated && !isInitialized) {
      initialize();
    }
  }, [isAuthenticated, isInitialized]);

  if (isAuthenticated) {
    if (error) {
      return <ErrorRetryScreen error={error} onRetry={retry} />;
    }

    if (!isInitialized) {
      return <LoadingScreen />;
    }
  }

  return (
    <NavigationContainer>
      {isAuthenticated ? (
        <Stack.Navigator
          screenOptions={{
            headerStyle: {
              backgroundColor: theme.colors.surface,
            },
            headerTintColor: theme.colors.onSurface,
          }}
        >
          <Stack.Screen
            name="Main"
            component={TabNavigator}
            options={{
              headerShown: true,
              title: 'Miranha Finance',
              headerRight: () => (
                <View style={{ flexDirection: 'row' }}>
                  <IconButton
                    icon={isDarkMode ? "weather-sunny" : "weather-night"}
                    onPress={toggleTheme}
                    iconColor={theme.colors.onSurface}
                  />
                  <IconButton
                    icon="logout"
                    onPress={() => logout()}
                    iconColor={theme.colors.onSurface}
                  />
                </View>
              ),
            }}
          />
          <Stack.Screen
            name="AddExpense"
            component={AddExpenseScreen}
            options={{
              title: 'Adicionar Gasto',
              presentation: 'modal',
            }}
          />
          <Stack.Screen
            name="AddIncome"
            component={AddIncomeScreen}
            options={{
              title: 'Adicionar Receita',
              presentation: 'modal',
            }}
          />
          <Stack.Screen
            name="Alerts"
            component={AlertsScreen}
            options={{
              title: 'Alertas',
            }}
          />
          <Stack.Screen
            name="AddCreditCard"
            component={AddCreditCardScreen}
            options={{
              title: 'Adicionar Cartão',
              presentation: 'modal',
            }}
          />
          <Stack.Screen
            name="Simulation"
            component={SimulationScreen}
            options={{
              headerShown: false,
            }}
          />
        </Stack.Navigator>
      ) : (
        <AuthNavigator />
      )}
    </NavigationContainer>
  );
};


