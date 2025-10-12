import React from 'react';
import { View, Text, StyleSheet, FlatList } from 'react-native';
import { Card } from '../components/Card';
import { AlertBanner } from '../components/AlertBanner';
import { useFinanceStore } from '../store/financeStore';
import { theme, spacing, typography } from '../theme';
import { Alert } from '../types';

export const AlertsScreen = () => {
  const { alerts, markAlertAsRead } = useFinanceStore();

  const renderAlert = ({ item }: { item: Alert }) => (
    <AlertBanner
      alert={item}
      onDismiss={() => markAlertAsRead(item.id)}
    />
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={alerts}
        renderItem={renderAlert}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyText}>
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
    backgroundColor: theme.colors.background,
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
    color: theme.colors.onSurfaceVariant,
    textAlign: 'center',
  },
});
