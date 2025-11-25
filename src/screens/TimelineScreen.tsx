import React, { useMemo, useState } from 'react';
import { View, StyleSheet, SectionList, TouchableOpacity, Alert, Platform } from 'react-native';
import { Text, useTheme, Icon, SegmentedButtons, TextInput, IconButton } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { useFinanceStore } from '../store/financeStore';
import { spacing, typography, AppTheme } from '../theme';
import { format, parseISO, differenceInHours, startOfDay, endOfDay, isWithinInterval } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { getCategoryIcon, getCategoryColor } from '../constants';
import DateTimePicker from '@react-native-community/datetimepicker';

import { formatCurrency } from '../utils/formatters';

export const TimelineScreen = () => {
    const theme = useTheme<AppTheme>();
    const navigation = useNavigation<any>();
    const { expenses, incomes, updateExpense, updateIncome } = useFinanceStore();
    const [filter, setFilter] = useState<'all' | 'recurring'>('all');

    const [startDate, setStartDate] = useState<Date | undefined>(undefined);
    const [endDate, setEndDate] = useState<Date | undefined>(undefined);
    const [showStartDatePicker, setShowStartDatePicker] = useState(false);
    const [showEndDatePicker, setShowEndDatePicker] = useState(false);

    const sections = useMemo(() => {
        let allTransactions = [
            ...expenses.map(e => ({ ...e, type: 'expense' as const })),
            ...incomes.map(i => ({ ...i, type: 'income' as const })),
        ];

        // Filter by recurring
        if (filter === 'recurring') {
            allTransactions = allTransactions.filter(t => t.isRecurring);
        }

        // Filter by date range
        if (startDate || endDate) {
            allTransactions = allTransactions.filter(t => {
                const tDate = parseISO(t.date);

                if (startDate && endDate) {
                    return isWithinInterval(tDate, {
                        start: startOfDay(startDate),
                        end: endOfDay(endDate)
                    });
                } else if (startDate) {
                    return tDate >= startOfDay(startDate);
                } else if (endDate) {
                    return tDate <= endOfDay(endDate);
                }
                return true;
            });
        }

        allTransactions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

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
    }, [expenses, incomes, filter, startDate, endDate]);

    const onStartDateChange = (event: any, selectedDate?: Date) => {
        setShowStartDatePicker(Platform.OS === 'ios');
        if (selectedDate) {
            setStartDate(selectedDate);
        }
    };

    const onEndDateChange = (event: any, selectedDate?: Date) => {
        setShowEndDatePicker(Platform.OS === 'ios');
        if (selectedDate) {
            setEndDate(selectedDate);
        }
    };

    const formatDate = (date?: Date) => {
        if (!date) return '';
        return date.toLocaleDateString('pt-BR');
    };

    const clearDates = () => {
        setStartDate(undefined);
        setEndDate(undefined);
    };

    const handleEdit = (item: any) => {
        const transactionDate = new Date(item.date);
        const now = new Date();
        const hoursDiff = differenceInHours(now, transactionDate);

        if (hoursDiff > 24) {
            if (item.isRecurring) {
                Alert.alert(
                    "Edição Indisponível",
                    "Só é possível editar transações criadas nas últimas 24 horas. Deseja cancelar a recorrência deste item?",
                    [
                        { text: "Voltar", style: "cancel" },
                        {
                            text: "Cancelar Recorrência",
                            style: "destructive",
                            onPress: async () => {
                                try {
                                    if (item.type === 'expense') {
                                        await updateExpense(item.id, { isRecurring: false });
                                    } else {
                                        await updateIncome(item.id, { isRecurring: false });
                                    }
                                    Alert.alert("Sucesso", "Recorrência cancelada.");
                                } catch (error) {
                                    Alert.alert("Erro", "Não foi possível cancelar a recorrência.");
                                }
                            }
                        }
                    ]
                );
            } else {
                Alert.alert(
                    "Edição Indisponível",
                    "Só é possível editar transações criadas nas últimas 24 horas."
                );
            }
            return;
        }

        if (item.type === 'expense') {
            navigation.navigate('AddExpense', { expense: item });
        } else {
            navigation.navigate('AddIncome', { income: item });
        }
    };

    const renderItem = ({ item }: { item: any }) => {
        const isExpense = item.type === 'expense';
        const color = isExpense ? theme.colors.error : theme.colors.success;
        const icon = isExpense ? getCategoryIcon(item.category) : 'cash';
        const iconColor = isExpense ? getCategoryColor(item.category) : theme.colors.success;

        return (
            <TouchableOpacity onPress={() => handleEdit(item)}>
                <View style={styles.card}>
                    <View style={styles.iconContainer}>
                        <View style={[styles.iconCircle, { backgroundColor: iconColor + '20' }]}>
                            <Icon source={icon} size={24} color={iconColor} />
                        </View>
                    </View>
                    <View style={styles.contentContainer}>
                        <Text style={styles.description}>{item.description || item.category}</Text>
                        <View style={styles.categoryRow}>
                            <Text style={styles.category}>{isExpense ? 'Despesa' : 'Receita'}</Text>
                            {item.isRecurring && (
                                <View style={styles.recurringBadge}>
                                    <Icon source="refresh" size={12} color={theme.colors.primary} />
                                    <Text style={styles.recurringText}>Recorrente</Text>
                                </View>
                            )}
                        </View>
                    </View>
                    <View style={styles.amountContainer}>
                        <Text style={[styles.amount, { color }]}>
                            {isExpense ? '-' : '+'} {formatCurrency(item.value)}
                        </Text>
                    </View>
                </View>
            </TouchableOpacity>
        );
    };

    const styles = createStyles(theme);

    return (
        <View style={styles.container}>
            <View style={styles.filterContainer}>
                <SegmentedButtons
                    value={filter}
                    onValueChange={(value: string) => setFilter(value as 'all' | 'recurring')}
                    buttons={[
                        { value: 'all', label: 'Todos' },
                        { value: 'recurring', label: 'Recorrentes' },
                    ]}
                    style={styles.segmentedButton}
                />

                <View style={styles.dateFilterContainer}>
                    <View style={styles.dateInputContainer}>
                        <TouchableOpacity onPress={() => setShowStartDatePicker(true)} style={styles.dateInputWrapper}>
                            <TextInput
                                mode="outlined"
                                value={formatDate(startDate)}
                                placeholder="Data Inicial"
                                style={styles.dateInput}
                                editable={false}
                                right={<TextInput.Icon icon="calendar" onPress={() => setShowStartDatePicker(true)} />}
                                dense
                            />
                        </TouchableOpacity>

                        <TouchableOpacity onPress={() => setShowEndDatePicker(true)} style={styles.dateInputWrapper}>
                            <TextInput
                                mode="outlined"
                                value={formatDate(endDate)}
                                placeholder="Data Final"
                                style={styles.dateInput}
                                editable={false}
                                right={<TextInput.Icon icon="calendar" onPress={() => setShowEndDatePicker(true)} />}
                                dense
                            />
                        </TouchableOpacity>

                        {(startDate || endDate) && (
                            <IconButton
                                icon="close-circle-outline"
                                size={24}
                                onPress={clearDates}
                                style={styles.clearButton}
                            />
                        )}
                    </View>
                </View>

                {showStartDatePicker && (
                    <DateTimePicker
                        testID="startDatePicker"
                        value={startDate || new Date()}
                        mode="date"
                        is24Hour={true}
                        display="default"
                        onChange={onStartDateChange}
                    />
                )}

                {showEndDatePicker && (
                    <DateTimePicker
                        testID="endDatePicker"
                        value={endDate || new Date()}
                        mode="date"
                        is24Hour={true}
                        display="default"
                        onChange={onEndDateChange}
                    />
                )}
            </View>

            {sections.length === 0 ? (
                <View style={styles.emptyState}>
                    <Icon source="history" size={64} color={theme.colors.outline} />
                    <Text style={styles.emptyText}>
                        {filter === 'recurring'
                            ? 'Nenhuma transação recorrente encontrada.'
                            : 'Nenhuma transação registrada.'}
                    </Text>
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
    filterContainer: {
        padding: spacing.md,
        backgroundColor: theme.colors.surface,
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.outline,
    },
    segmentedButton: {
        marginBottom: spacing.sm,
    },
    dateFilterContainer: {
        marginTop: spacing.xs,
    },
    dateInputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.sm,
    },
    dateInputWrapper: {
        flex: 1,
    },
    dateInput: {
        backgroundColor: theme.colors.surface,
        fontSize: 14,
    },
    clearButton: {
        margin: 0,
    },
    categoryRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.sm,
    },
    recurringBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        backgroundColor: theme.colors.primary + '15',
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 4,
    },
    recurringText: {
        ...typography.caption,
        color: theme.colors.primary,
        fontSize: 10,
        fontWeight: 'bold',
    },
});
