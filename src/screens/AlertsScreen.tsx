import React, { useMemo } from 'react';
import { View, Text, StyleSheet, SectionList } from 'react-native';
import { useTheme } from 'react-native-paper';
import { AlertBanner } from '../components/AlertBanner';
import { useFinanceStore } from '../store/financeStore';
import { spacing, typography } from '../theme';
import { Alert } from '../types';
import { format, isToday, isYesterday, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export const AlertsScreen = () => {
  const { alerts, markAlertAsRead } = useFinanceStore();
  const theme = useTheme();

  const activeAlerts = alerts.filter(a => !a.isRead);

  const sections = useMemo(() => {
    const groups: { [key: string]: Alert[] } = {};

    activeAlerts.forEach(alert => {
      const date = parseISO(alert.createdAt);
      let title = format(date, "d 'de' MMMM", { locale: ptBR });

      if (isToday(date)) {
        title = 'Hoje';
      } else if (isYesterday(date)) {
        title = 'Ontem';
      }

      if (!groups[title]) {
        groups[title] = [];
      }
      groups[title].push(alert);
    });

    return Object.entries(groups).map(([title, data]) => ({
      title,
      data: data.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
    }));
  }, [activeAlerts]);

  const renderAlert = ({ item }: { item: Alert }) => (
    <AlertBanner
      alert={item}
      onDismiss={() => markAlertAsRead(item.id)}
    />
  );

  const renderSectionHeader = ({ section: { title } }: { section: { title: string } }) => (
    <Text style={[styles.sectionHeader, { color: theme.colors.onSurfaceVariant }]}>
      {title}
    </Text>
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <SectionList
        sections={sections}
        renderItem={renderAlert}
        renderSectionHeader={renderSectionHeader}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.list}
        stickySectionHeadersEnabled={false}
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
  sectionHeader: {
    ...typography.label,
    marginTop: spacing.md,
    marginBottom: spacing.sm,
    textTransform: 'uppercase',
    fontSize: 12,
    fontWeight: 'bold',
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
