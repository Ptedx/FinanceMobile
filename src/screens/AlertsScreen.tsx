import React from 'react';
import { View, Text, StyleSheet, FlatList } from 'react-native';
import { useTheme } from 'react-native-paper';
import { Card } from '../components/Card';
import { AlertBanner } from '../components/AlertBanner';
import { useFinanceStore } from '../store/financeStore';
import { spacing, typography } from '../theme';
import { Alert } from '../types';

export const AlertsScreen = () => {
  const { alerts, markAlertAsRead } = useFinanceStore();
  const theme = useTheme();

  const renderAlert = ({ item }: { item: Alert }) => (
    <AlertBanner
      alert={item}
      onDismiss={() => markAlertAsRead(item.id)}
    />
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <FlatList
        data={alerts}
        renderItem={renderAlert}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={[styles.emptyText, { color: theme.colors.onSurfaceVariant }]}>
              Nenhum alerta no momento.{'\n'}
              Você receberá alertas quando seus gastos se aproximarem dos limites.
            </Text>
          </View>
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  list: {
    padding: spacing.md,
  },
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
    marginTop: spacing.xxl,
  },
  emptyText: {
    ...typography.body,
    textAlign: 'center',
  },
});
