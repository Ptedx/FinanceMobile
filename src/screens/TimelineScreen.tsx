import React, { useMemo, useState } from 'react';
import { View, StyleSheet, SectionList, TouchableOpacity, Alert, Platform, ScrollView } from 'react-native';
import { Text, useTheme, Icon, SegmentedButtons, TextInput, IconButton, Button, Portal, Modal } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { useFinanceStore } from '../store/financeStore';
import { spacing, AppTheme } from '../theme';
import { format, parseISO, differenceInHours, startOfDay, endOfDay, isWithinInterval, addMonths, subMonths, startOfMonth, endOfMonth, isSameMonth, getDate, differenceInDays, addDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { getCategoryIcon } from '../constants';
import DateTimePicker from '@react-native-community/datetimepicker';
import { formatCurrency } from '../utils/formatters';

export const TimelineScreen = () => {
    const theme = useTheme<AppTheme>();
    const navigation = useNavigation<any>();
    const { expenses, incomes, loadExpenses, loadIncomes } = useFinanceStore();

    // Refresh Logic
    const [refreshing, setRefreshing] = useState(false);

    // Filter State
    const [filter, setFilter] = useState<'all' | 'recurring'>('all');

    // Date Filters
    const [currentDate, setCurrentDate] = useState(new Date()); // Tracks "Visualized Month"
    const [startDate, setStartDate] = useState<Date | undefined>(undefined);
    const [endDate, setEndDate] = useState<Date | undefined>(undefined);

    // Month Picker State
    const [showMonthPicker, setShowMonthPicker] = useState(false);
    const [pickerYear, setPickerYear] = useState(new Date().getFullYear());

    // Constants for Picker
    const MONTHS = [
        "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
        "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
    ];
    const YEARS = Array.from({ length: 10 }, (_, i) => new Date().getFullYear() - 5 + i);

    // UI Visuals
    const [showStartDatePicker, setShowStartDatePicker] = useState(false);
    const [showEndDatePicker, setShowEndDatePicker] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [showFilterOptions, setShowFilterOptions] = useState(false);

    // Handlers
    const handleMonthSelect = (monthIndex: number) => {
        const newDate = new Date(pickerYear, monthIndex, 1);
        setCurrentDate(newDate);
        setStartDate(undefined);
        setEndDate(undefined);
        setShowMonthPicker(false);
    };

    const handlePreviousMonth = () => {
        setStartDate(undefined);
        setEndDate(undefined);
        setCurrentDate(subMonths(currentDate, 1));
    };

    const handleNextMonth = () => {
        setStartDate(undefined);
        setEndDate(undefined);
        setCurrentDate(addMonths(currentDate, 1));
    };

    const onRefresh = async () => {
        setRefreshing(true);
        try {
            const startDateStr = format(startOfMonth(currentDate), 'yyyy-MM-dd');
            const endDateStr = format(endOfMonth(currentDate), 'yyyy-MM-dd');
            await Promise.all([
                loadExpenses(startDateStr, endDateStr),
                loadIncomes(startDateStr, endDateStr)
            ]);
        } catch (error) {
            console.error("Failed to refresh", error);
        } finally {
            setRefreshing(false);
        }
    };

    const onStartDateChange = (event: any, selectedDate?: Date) => {
        setShowStartDatePicker(Platform.OS === 'ios');
        if (selectedDate) setStartDate(selectedDate);
    };

    const onEndDateChange = (event: any, selectedDate?: Date) => {
        setShowEndDatePicker(Platform.OS === 'ios');
        if (selectedDate) setEndDate(selectedDate);
    };

    const formatDate = (date?: Date) => {
        if (!date) return 'Selecionar';
        return format(date, 'dd/MM/yyyy');
    };

    const handleEdit = (item: any) => {
        const transactionDate = new Date(item.date);
        const now = new Date();
        const hoursDiff = differenceInHours(now, transactionDate);

        if (hoursDiff > 24) {
            Alert.alert("Edição Indisponível", "Apenas transações das últimas 24h podem ser editadas.");
            return;
        }

        if (item.type === 'expense') navigation.navigate('AddExpense', { expense: item });
        else navigation.navigate('AddIncome', { income: item });
    };

    // Helper for compact currency
    const formatCompact = (value: number) => {
        if (value === 0) return '';
        if (value >= 1000000) return `R$${(value / 1000000).toFixed(1)}M`;
        if (value >= 1000) return `R$${(value / 1000).toFixed(0)}k`;
        return `R$${value.toFixed(0)}`;
    };

    // Data Processing
    const processedData = useMemo(() => {
        let allTransactions = [
            ...expenses.map(e => ({ ...e, type: 'expense' as const })),
            ...incomes.map(i => ({ ...i, type: 'income' as const })),
        ];

        if (filter === 'recurring') {
            allTransactions = allTransactions.filter(t => t.isRecurring);
        }

        const effectiveStart = startDate ? startOfDay(startDate) : startOfMonth(currentDate);
        const effectiveEnd = endDate ? endOfDay(endDate) : endOfMonth(currentDate);

        let filtered = allTransactions.filter(t => {
            const tDate = parseISO(t.date);

            if (searchQuery.trim()) {
                const query = searchQuery.toLowerCase().trim();
                const descriptionMatch = (t.description || '').toLowerCase().includes(query);
                const categoryMatch = (t.category || '').toLowerCase().includes(query);
                if (!descriptionMatch && !categoryMatch) return false;
            }

            return isWithinInterval(tDate, { start: effectiveStart, end: effectiveEnd });
        });

        filtered.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

        const totalIncome = filtered.filter(t => t.type === 'income').reduce((sum, t) => sum + t.value, 0);
        const totalExpense = filtered.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.value, 0);

        const sections = Object.entries(filtered.reduce((acc, transaction) => {
            const date = parseISO(transaction.date);
            const title = format(date, "dd 'de' MMMM, yyyy", { locale: ptBR });
            if (!acc[title]) acc[title] = [];
            acc[title].push(transaction);
            return acc;
        }, {} as Record<string, typeof filtered>)).map(([title, data]) => ({ title, data }));

        // Adaptive Chart Logic
        const today = new Date();
        const isCurrentMonthView = isSameMonth(currentDate, today) && !startDate && !endDate;
        const chartEnd = isCurrentMonthView ? endOfDay(today) : effectiveEnd;
        const daysDiff = differenceInDays(chartEnd, effectiveStart);
        const chartData = [];

        if (daysDiff === 0) {
            const currentHour = isCurrentMonthView ? today.getHours() : 23;
            const bucketSizeHours = 3;
            for (let i = 0; i < 24; i += bucketSizeHours) {
                if (i > currentHour && isCurrentMonthView) break;
                const label = `${i}h`;
                const bucketTransactions = filtered.filter(t => {
                    const h = parseISO(t.date).getHours();
                    const d = parseISO(t.date);
                    return isWithinInterval(d, { start: effectiveStart, end: effectiveEnd }) && getDate(d) === getDate(effectiveStart) && h >= i && h < i + bucketSizeHours;
                });
                const income = bucketTransactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.value, 0);
                const expense = bucketTransactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.value, 0);
                chartData.push({ label, income, expense });
            }
        } else {
            const totalDays = daysDiff + 1;
            const targetBars = 7;
            const bucketSize = Math.max(1, Math.ceil(totalDays / targetBars));
            const numBuckets = Math.ceil(totalDays / bucketSize);

            for (let i = 0; i < numBuckets; i++) {
                const bucketStart = addDays(effectiveStart, i * bucketSize);
                const bucketEnd = endOfDay(addDays(bucketStart, bucketSize - 1));
                const actualBucketEnd = bucketEnd > chartEnd ? chartEnd : bucketEnd;
                if (bucketStart > chartEnd) break;

                let label = "";
                if (bucketSize === 1) {
                    label = format(bucketStart, 'dd');
                } else {
                    label = format(bucketStart, 'dd');
                }

                const bucketTransactions = filtered.filter(t => {
                    const tDate = parseISO(t.date);
                    return tDate >= bucketStart && tDate <= actualBucketEnd;
                });

                const income = bucketTransactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.value, 0);
                const expense = bucketTransactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.value, 0);
                chartData.push({ label, income, expense });
            }
        }

        const maxVal = Math.max(...chartData.map(d => Math.max(d.income, d.expense)), 100);
        const isCustomPeriod = !!(startDate || endDate);

        return { sections, totalIncome, totalExpense, chartData, maxVal, isCustomPeriod, effectiveStart, effectiveEnd };
    }, [expenses, incomes, filter, startDate, endDate, searchQuery, currentDate]);

    const renderItem = ({ item }: { item: any }) => {
        const isExpense = item.type === 'expense';
        const iconColor = isExpense ? '#FF5252' : '#4CAF50';
        const bgIconColor = isExpense ? '#FFEBEE' : '#E8F5E9';

        return (
            <TouchableOpacity onPress={() => handleEdit(item)}>
                <View style={styles.itemContainer}>
                    <View style={[styles.iconBox, { backgroundColor: bgIconColor }]}>
                        <Icon source={getCategoryIcon(item.category)} size={24} color={iconColor} />
                    </View>
                    <View style={styles.itemContent}>
                        <Text style={styles.itemTitle}>{item.description || item.category}</Text>
                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                            <Text style={styles.itemDate}>{format(parseISO(item.date), "dd/MM HH:mm")}</Text>
                            {item.isRecurring && (
                                <View style={styles.recurringFlag}>
                                    <Icon source="refresh" size={10} color={theme.colors.primary} />
                                </View>
                            )}
                        </View>
                    </View>
                    <Text style={[styles.itemAmount, { color: isExpense ? '#D32F2F' : '#388E3C' }]}>
                        {isExpense ? '-' : '+'} {formatCurrency(item.value)}
                    </Text>
                </View>
            </TouchableOpacity>
        );
    };

    const styles = createStyles(theme);

    return (
        <View style={styles.container}>
            <SectionList
                sections={processedData.sections}
                renderItem={renderItem}
                refreshing={refreshing}
                onRefresh={onRefresh}
                keyExtractor={item => item.id}
                stickySectionHeadersEnabled={false}
                contentContainerStyle={styles.listContent}
                renderSectionHeader={({ section: { title } }) => (
                    <Text style={styles.sectionHeader}>{title.toUpperCase()}</Text>
                )}
                ListEmptyComponent={
                    <View style={styles.emptyState}>
                        <Icon source="file-document-outline" size={64} color={theme.colors.outline} />
                        <Text style={styles.emptyText}>Nenhuma transação neste período.</Text>
                    </View>
                }
                ListHeaderComponent={() => (
                    <View>
                        {/* Header Controls */}
                        <View style={styles.headerControls}>
                            <IconButton icon="chevron-left" onPress={handlePreviousMonth} size={24} />

                            <View style={{ alignItems: 'center', flexDirection: 'column' }}>
                                <TouchableOpacity onPress={() => { setPickerYear(currentDate.getFullYear()); setShowMonthPicker(true); }}>
                                    <Text style={styles.headerTitle}>
                                        {processedData.isCustomPeriod ? 'Período Personalizado' : format(currentDate, 'MMMM yyyy', { locale: ptBR })}
                                    </Text>
                                </TouchableOpacity>

                                {processedData.isCustomPeriod && (
                                    <Text style={styles.headerSubtitle}>
                                        {format(processedData.effectiveStart, 'dd/MM')} - {format(processedData.effectiveEnd, 'dd/MM')}
                                    </Text>
                                )}

                                <TouchableOpacity onPress={() => setShowFilterOptions(!showFilterOptions)} style={{ padding: 4 }}>
                                    <Icon source={showFilterOptions ? "chevron-up" : "chevron-down"} size={20} color={theme.colors.onSurfaceVariant} />
                                </TouchableOpacity>
                            </View>

                            <IconButton icon="chevron-right" onPress={handleNextMonth} size={24} />
                        </View>

                        {/* Collapsible Filters */}
                        {showFilterOptions && (
                            <View style={styles.filterOptionsContainer}>
                                <Text style={styles.filterLabel}>Filtrar por data:</Text>
                                <View style={styles.dateRow}>
                                    <TouchableOpacity onPress={() => setShowStartDatePicker(true)} style={styles.dateButton}>
                                        <Icon source="calendar" size={18} color={theme.colors.primary} />
                                        <Text style={styles.dateButtonText}>{formatDate(startDate)}</Text>
                                    </TouchableOpacity>
                                    <Text>-</Text>
                                    <TouchableOpacity onPress={() => setShowEndDatePicker(true)} style={styles.dateButton}>
                                        <Icon source="calendar" size={18} color={theme.colors.primary} />
                                        <Text style={styles.dateButtonText}>{formatDate(endDate)}</Text>
                                    </TouchableOpacity>
                                    {(startDate || endDate) && (
                                        <IconButton icon="close-circle" size={20} onPress={() => { setStartDate(undefined); setEndDate(undefined); }} />
                                    )}
                                </View>
                            </View>
                        )}

                        {/* Month Picker Modal */}
                        <Portal>
                            <Modal visible={showMonthPicker} onDismiss={() => setShowMonthPicker(false)} contentContainerStyle={styles.modalContainer}>
                                <View style={styles.pickerContent}>
                                    <Text style={styles.pickerTitle}>Selecionar Período</Text>

                                    <View style={styles.pickerRow}>
                                        <View style={styles.pickerColumn}>
                                            <Text style={styles.columnHeader}>Ano</Text>
                                            <ScrollView style={{ maxHeight: 200 }} showsVerticalScrollIndicator={false}>
                                                {YEARS.map(year => (
                                                    <TouchableOpacity
                                                        key={year}
                                                        onPress={() => setPickerYear(year)}
                                                        style={[styles.pickerItem, pickerYear === year && styles.pickerItemSelected]}
                                                    >
                                                        <Text style={[styles.pickerItemText, pickerYear === year && styles.pickerItemTextSelected]}>
                                                            {year}
                                                        </Text>
                                                    </TouchableOpacity>
                                                ))}
                                            </ScrollView>
                                        </View>

                                        <View style={styles.pickerDivider} />

                                        <View style={styles.pickerColumn}>
                                            <Text style={styles.columnHeader}>Mês</Text>
                                            <ScrollView style={{ maxHeight: 200 }} showsVerticalScrollIndicator={false}>
                                                {MONTHS.map((month, index) => (
                                                    <TouchableOpacity
                                                        key={month}
                                                        onPress={() => handleMonthSelect(index)}
                                                        style={[styles.pickerItem, (currentDate.getMonth() === index && currentDate.getFullYear() === pickerYear) && styles.pickerItemSelected]}
                                                    >
                                                        <Text style={[
                                                            styles.pickerItemText,
                                                            (currentDate.getMonth() === index && currentDate.getFullYear() === pickerYear) && styles.pickerItemTextSelected
                                                        ]}>
                                                            {month}
                                                        </Text>
                                                    </TouchableOpacity>
                                                ))}
                                            </ScrollView>
                                        </View>
                                    </View>

                                    <Button mode="text" onPress={() => setShowMonthPicker(false)} style={{ marginTop: 16 }}>
                                        Cancelar
                                    </Button>
                                </View>
                            </Modal>
                        </Portal>

                        {/* Summary Cards */}
                        <View style={styles.summaryContainer}>
                            <View style={[styles.summaryCard, { backgroundColor: '#4361EE' }]}>
                                <View style={styles.summaryIconBg}>
                                    <Icon source="arrow-up" color="#4361EE" size={20} />
                                </View>
                                <View>
                                    <Text style={styles.summaryLabel}>Receitas</Text>
                                    <Text style={styles.summaryValue}>{formatCurrency(processedData.totalIncome)}</Text>
                                </View>
                            </View>

                            <View style={[styles.summaryCard, { backgroundColor: '#FFB703' }]}>
                                <View style={[styles.summaryIconBg, { backgroundColor: 'rgba(255,255,255,0.9)' }]}>
                                    <Icon source="arrow-down" color="#FFB703" size={20} />
                                </View>
                                <View>
                                    <Text style={[styles.summaryLabel, { color: 'black' }]}>Despesas</Text>
                                    <Text style={[styles.summaryValue, { color: 'black' }]}>{formatCurrency(processedData.totalExpense)}</Text>
                                </View>
                            </View>
                        </View>

                        {/* Adaptive Chart */}
                        <View style={styles.chartContainer}>
                            <Text style={styles.chartTitle}>Fluxo do Período</Text>
                            {processedData.chartData.every(d => d.income === 0 && d.expense === 0) ? (
                                <Text style={{ textAlign: 'center', color: theme.colors.outline, margin: 20 }}>Sem dados para o gráfico</Text>
                            ) : (
                                <View style={styles.chartRow}>
                                    {processedData.chartData.map((data, index) => {
                                        const incomeHeight = (data.income / processedData.maxVal) * 100;
                                        const expenseHeight = (data.expense / processedData.maxVal) * 100;

                                        return (
                                            <View key={index} style={styles.chartBarGroup}>
                                                <View style={styles.barsArea}>
                                                    <View style={{ height: '100%', justifyContent: 'flex-end', alignItems: 'center' }}>
                                                        {data.income > 0 && (
                                                            <Text style={styles.barValueLabel}>{formatCompact(data.income)}</Text>
                                                        )}
                                                        <View style={[styles.bar, { height: `${Math.max(incomeHeight, 2)}%`, backgroundColor: theme.dark ? '#004D33' : '#4361EE' }]} />
                                                    </View>

                                                    <View style={{ height: '100%', justifyContent: 'flex-end', alignItems: 'center', marginLeft: 4 }}>
                                                        {data.expense > 0 && (
                                                            <Text style={styles.barValueLabel}>{formatCompact(data.expense)}</Text>
                                                        )}
                                                        <View style={[styles.bar, { height: `${Math.max(expenseHeight, 2)}%`, backgroundColor: theme.dark ? '#8B2E2E' : '#FFB703' }]} />
                                                    </View>
                                                </View>
                                                <Text style={styles.barLabel}>{data.label}</Text>
                                            </View>
                                        );
                                    })}
                                </View>
                            )}
                        </View>

                        {/* Filters & Search - Persistent */}
                        <View style={styles.filterSection}>
                            <SegmentedButtons
                                value={filter}
                                onValueChange={(value: string) => setFilter(value as 'all' | 'recurring')}
                                buttons={[
                                    { value: 'all', label: 'Todos' },
                                    { value: 'recurring', label: 'Recorrentes' },
                                ]}
                                style={{ marginBottom: spacing.sm }}
                                theme={{ colors: { secondaryContainer: theme.colors.primaryContainer, onSecondaryContainer: theme.colors.onPrimaryContainer } }}
                            />
                            <TextInput
                                mode="outlined"
                                value={searchQuery}
                                onChangeText={setSearchQuery}
                                placeholder="Buscar transações..."
                                style={styles.searchInput}
                                right={searchQuery ? <TextInput.Icon icon="close" onPress={() => setSearchQuery('')} /> : <TextInput.Icon icon="magnify" />}
                                dense
                                theme={{ roundness: 12 }}
                            />
                        </View>

                        {showStartDatePicker && <DateTimePicker value={startDate || new Date()} mode="date" onChange={onStartDateChange} />}
                        {showEndDatePicker && <DateTimePicker value={endDate || new Date()} mode="date" onChange={onEndDateChange} />}
                    </View>
                )}
            />
        </View>
    );
};

const createStyles = (theme: AppTheme) => StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: theme.colors.background,
        paddingTop: Platform.OS === 'android' ? 30 : 0,
    },
    listContent: {
        paddingBottom: 80,
    },
    headerControls: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: spacing.sm,
        paddingHorizontal: spacing.sm,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        textTransform: 'capitalize',
        color: theme.colors.onSurface,
    },
    headerSubtitle: {
        fontSize: 12,
        color: theme.colors.primary,
    },
    filterOptionsContainer: {
        backgroundColor: theme.colors.surface,
        padding: spacing.md,
        marginHorizontal: spacing.md,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: theme.colors.outlineVariant,
        marginBottom: spacing.md,
    },
    filterLabel: {
        fontSize: 12,
        color: theme.colors.onSurfaceVariant,
        marginBottom: 8,
    },
    dateRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    dateButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: theme.colors.elevation.level1,
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 8,
        gap: 6,
    },
    dateButtonText: {
        fontSize: 14,
        color: theme.colors.onSurface,
    },
    summaryContainer: {
        flexDirection: 'row',
        gap: spacing.md,
        paddingHorizontal: spacing.md,
        marginBottom: spacing.lg,
    },
    summaryCard: {
        flex: 1,
        borderRadius: 20,
        padding: 16,
        paddingVertical: 20,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        elevation: 2,
    },
    summaryIconBg: {
        width: 36,
        height: 36,
        borderRadius: 12,
        backgroundColor: 'rgba(255,255,255,0.2)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    summaryLabel: {
        color: 'rgba(255,255,255,0.8)',
        fontSize: 12,
        fontWeight: '600',
    },
    summaryValue: {
        color: 'white',
        fontSize: 16,
        fontWeight: 'bold',
    },
    chartContainer: {
        backgroundColor: theme.colors.surface,
        marginHorizontal: spacing.md,
        padding: spacing.md,
        borderRadius: 20,
        marginBottom: spacing.lg,
        borderWidth: 1,
        borderColor: theme.colors.outlineVariant,
    },
    chartTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        marginBottom: spacing.md,
        color: theme.colors.onSurface,
    },
    chartRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-end',
        height: 120,
    },
    chartBarGroup: {
        alignItems: 'center',
        height: '100%',
        justifyContent: 'flex-end',
        flex: 1,
    },
    barsArea: {
        flexDirection: 'row',
        alignItems: 'flex-end',
        height: '80%',
    },
    bar: {
        width: 8,
        borderRadius: 4,
    },
    barLabel: {
        marginTop: 8,
        fontSize: 10,
        color: theme.colors.onSurfaceVariant,
    },
    filterSection: {
        paddingHorizontal: spacing.md,
        marginBottom: spacing.sm,
    },
    searchInput: {
        backgroundColor: theme.colors.surface,
    },
    itemContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: theme.colors.surface,
        padding: 16,
        marginHorizontal: spacing.md,
        marginBottom: spacing.sm,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: theme.colors.outlineVariant,
    },
    iconBox: {
        width: 48,
        height: 48,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    itemContent: {
        flex: 1,
    },
    itemTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: theme.colors.onSurface,
        marginBottom: 2,
    },
    itemDate: {
        fontSize: 12,
        color: theme.colors.onSurfaceVariant,
    },
    itemAmount: {
        fontSize: 16,
        fontWeight: 'bold',
    },
    sectionHeader: {
        marginLeft: spacing.lg,
        marginTop: spacing.sm,
        marginBottom: spacing.xs,
        fontSize: 12,
        color: theme.colors.onSurfaceVariant,
    },
    emptyState: {
        alignItems: 'center',
        marginTop: 40,
        gap: 10,
    },
    emptyText: {
        color: theme.colors.onSurfaceVariant,
    },
    recurringFlag: {
        marginLeft: 6,
        padding: 2,
        backgroundColor: theme.colors.secondaryContainer,
        borderRadius: 4,
    },
    modalContainer: {
        backgroundColor: 'rgba(0,0,0,0.5)',
        flex: 1,
        justifyContent: 'center',
        padding: 20
    },
    pickerContent: {
        backgroundColor: theme.colors.background,
        borderRadius: 20,
        padding: 20,
        alignItems: 'center',
        elevation: 5,
    },
    pickerTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 20,
        color: theme.colors.onSurface,
    },
    pickerRow: {
        flexDirection: 'row',
        height: 200,
        width: '100%',
    },
    pickerColumn: {
        flex: 1,
        alignItems: 'center',
    },
    columnHeader: {
        fontSize: 14,
        fontWeight: '600',
        color: theme.colors.primary,
        marginBottom: 10,
        textTransform: 'uppercase',
    },
    pickerDivider: {
        width: 1,
        backgroundColor: theme.colors.outlineVariant,
        marginHorizontal: 10,
    },
    pickerItem: {
        height: 48,
        justifyContent: 'center',
        paddingHorizontal: 16,
        borderRadius: 8,
        marginVertical: 0,
        width: '100%',
    },
    pickerItemSelected: {
        backgroundColor: theme.colors.primaryContainer,
    },
    pickerItemText: {
        fontSize: 16,
        color: theme.colors.onSurfaceVariant,
    },
    pickerItemTextSelected: {
        color: theme.colors.primary,
        fontWeight: 'bold',
    },
    barValueLabel: {
        fontSize: 9,
        color: theme.colors.onSurfaceVariant,
        marginBottom: 2,
    },
});
