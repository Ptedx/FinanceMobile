import React, { useMemo } from 'react';
import { View, StyleSheet, SectionList } from 'react-native';
import { Text, useTheme, Icon } from 'react-native-paper';
import { useFinanceStore } from '../store/financeStore';
import { spacing, typography } from '../theme';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { getCategoryIcon, getCategoryColor } from '../constants';

export const TimelineScreen = () => {
    const theme = useTheme();
    const { expenses, incomes } = useFinanceStore();

    const sections = useMemo(() => {
        const allTransactions = [
            ...expenses.map(e => ({ ...e, type: 'expense' as const })),
            ...incomes.map(i => ({ ...i, type: 'income' as const })),
        ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

        const grouped = allTransactions.reduce((acc, transaction) => {
            const date = parseISO(transaction.date);
            const title = format(date, "dd 'de' MMMM, yyyy", { locale: ptBR });

            if (!acc[title]) {
                acc[title] = [];
            }
            acc[title].push(transaction);
            return acc;
        }, {} as Record<string, typeof allTransactions>);

        return Object.entries(grouped).map(([title, data]) => ({
            title,
            data,
        }));
    }, [expenses, incomes]);

    const renderItem = ({ item }: { item: any }) => {
        const isExpense = item.type === 'expense';
        const color = isExpense ? theme.colors.error : theme.colors.success;
        const icon = isExpense ? getCategoryIcon(item.category) : 'cash';
        const iconColor = isExpense ? getCategoryColor(item.category) : theme.colors.success;

        return (
            <View style={styles.card}>
                <View style={styles.iconContainer}>
                    <View style={[styles.iconCircle, { backgroundColor: iconColor + '20' }]}>
                        <Icon source={icon} size={24} color={iconColor} />
                    </View>
                </View>
                <View style={styles.contentContainer}>
                    <Text style={styles.description}>{item.description || item.category}</Text>
                    <Text style={styles.category}>{isExpense ? 'Despesa' : 'Receita'}</Text>
                </View>
                <View style={styles.amountContainer}>
                    <Text style={[styles.amount, { color }]}>
                        {isExpense ? '-' : '+'} R$ {item.value.toFixed(2)}
                    </Text>
                </View>
            </View>
        );
    };

    const styles = createStyles(theme);

    return (
        <View style={styles.container}>
            {sections.length === 0 ? (
                <View style={styles.emptyState}>
                    <Icon source="history" size={64} color={theme.colors.outline} />
                    <Text style={styles.emptyText}>Nenhuma transação registrada.</Text>
                </View>
            ) : (
                <SectionList
                    sections={sections}
                    renderItem={renderItem}
                    renderSectionHeader={({ section: { title } }) => (
                        <Text style={styles.sectionHeader}>{title}</Text>
                    )}
                    keyExtractor={item => item.id}
                    contentContainerStyle={styles.listContent}
                    stickySectionHeadersEnabled={false}
                />
            )}
        </View>
    );
};

const createStyles = (theme: any) => StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: theme.colors.background,
    },
    listContent: {
        padding: spacing.md,
    },
    sectionHeader: {
        ...typography.label,
        color: theme.colors.onSurfaceVariant,
        marginTop: spacing.md,
        marginBottom: spacing.sm,
        textTransform: 'uppercase',
    },
    card: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: theme.colors.surface,
        padding: spacing.md,
        marginBottom: spacing.sm,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: theme.colors.outline,
    },
    iconContainer: {
        marginRight: spacing.md,
    },
    iconCircle: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
    },
    contentContainer: {
        flex: 1,
    },
    description: {
        ...typography.body,
        fontWeight: '500',
        color: theme.colors.onSurface,
    },
    category: {
        ...typography.caption,
        color: theme.colors.onSurfaceVariant,
    },
    amountContainer: {
        alignItems: 'flex-end',
    },
    amount: {
        ...typography.body,
        fontWeight: 'bold',
    },
    emptyState: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        gap: spacing.md,
    },
    emptyText: {
        ...typography.body,
        color: theme.colors.onSurfaceVariant,
    },
});
