import React, { useState, useEffect, useMemo } from 'react';
import { View, StyleSheet, TouchableOpacity, ScrollView, Modal } from 'react-native';
import { Text, useTheme, Icon, Button, TextInput, IconButton, SegmentedButtons, ActivityIndicator } from 'react-native-paper';
import { Expense } from '../types';
import { db } from '../services/database';
import { spacing, typography } from '../theme';
import { formatCurrency } from '../utils/formatters';
import { format, parseISO, startOfDay, endOfDay, isWithinInterval } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { getCategoryIcon, getCategoryColor } from '../constants';
import DateTimePicker from '@react-native-community/datetimepicker';

interface CreditCardTransactionsProps {
    cardId: string;
}

export const CreditCardTransactions = ({ cardId }: CreditCardTransactionsProps) => {
    const theme = useTheme();
    const [expenses, setExpenses] = useState<Expense[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [modalVisible, setModalVisible] = useState(false);

    // Filter States
    const [filter, setFilter] = useState<'all' | 'recurring'>('all');
    const [startDate, setStartDate] = useState<Date | undefined>(undefined);
    const [endDate, setEndDate] = useState<Date | undefined>(undefined);
    const [searchQuery, setSearchQuery] = useState('');

    // Temporary Filter States (for Modal)
    const [tempFilter, setTempFilter] = useState<'all' | 'recurring'>('all');
    const [tempStartDate, setTempStartDate] = useState<Date | undefined>(undefined);
    const [tempEndDate, setTempEndDate] = useState<Date | undefined>(undefined);
    const [tempSearchQuery, setTempSearchQuery] = useState('');

    const [showStartDatePicker, setShowStartDatePicker] = useState(false);
    const [showEndDatePicker, setShowEndDatePicker] = useState(false);

    useEffect(() => {
        loadExpenses();
    }, [cardId]);

    const loadExpenses = async () => {
        setIsLoading(true);
        try {
            // Fetch all expenses for this card. 
            // We might want to limit this if there are too many, but for now fetch all.
            const data = await db.getExpenses(undefined, undefined, cardId);
            setExpenses(data);
        } catch (error) {
            console.error("Failed to load card expenses", error);
        } finally {
            setIsLoading(false);
        }
    };

    const openModal = () => {
        setTempFilter(filter);
        setTempStartDate(startDate);
        setTempEndDate(endDate);
        setTempSearchQuery(searchQuery);
        setModalVisible(true);
    };

    const applyFilters = () => {
        setFilter(tempFilter);
        setStartDate(tempStartDate);
        setEndDate(tempEndDate);
        setSearchQuery(tempSearchQuery);
        setModalVisible(false);
    };

    const clearFilters = () => {
        setTempFilter('all');
        setTempStartDate(undefined);
        setTempEndDate(undefined);
        setTempSearchQuery('');
    };

    const filteredExpenses = useMemo(() => {
        let result = [...expenses];

        if (filter === 'recurring') {
            result = result.filter(e => e.isRecurring);
        }

        if (startDate || endDate) {
            result = result.filter(e => {
                const eDate = parseISO(e.date);
                if (startDate && endDate) {
                    return isWithinInterval(eDate, { start: startOfDay(startDate), end: endOfDay(endDate) });
                } else if (startDate) {
                    return eDate >= startOfDay(startDate);
                } else if (endDate) {
                    return eDate <= endOfDay(endDate);
                }
                return true;
            });
        }

        if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase().trim();
            result = result.filter(e =>
                (e.description || '').toLowerCase().includes(query) ||
                (e.category || '').toLowerCase().includes(query)
            );
        }

        return result.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }, [expenses, filter, startDate, endDate, searchQuery]);

    const hasActiveFilters = filter !== 'all' || startDate !== undefined || endDate !== undefined || searchQuery !== '';

    const onStartDateChange = (event: any, selectedDate?: Date) => {
        setShowStartDatePicker(false);
        if (selectedDate) setTempStartDate(selectedDate);
    };

    const onEndDateChange = (event: any, selectedDate?: Date) => {
        setShowEndDatePicker(false);
        if (selectedDate) setTempEndDate(selectedDate);
    };

    const formatDate = (date?: Date) => date ? format(date, 'dd/MM/yyyy') : '';

    const styles = StyleSheet.create({
        container: {
            marginTop: spacing.lg,
        },
        header: {
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: spacing.md,
        },
        title: {
            ...typography.h3,
            color: theme.colors.onSurface,
        },
        filterButton: {
            flexDirection: 'row',
            alignItems: 'center',
            gap: 4,
        },
        filterText: {
            ...typography.bodySmall,
            color: theme.colors.primary,
        },
        list: {
            gap: spacing.sm,
        },
        card: {
            flexDirection: 'row',
            alignItems: 'center',
            backgroundColor: theme.colors.surface,
            padding: spacing.md,
            borderRadius: 12,
            borderWidth: 1,
            borderColor: theme.colors.outline,
        },
        iconContainer: {
            marginRight: spacing.md,
        },
        contentContainer: {
            flex: 1,
        },
        description: {
            ...typography.body,
            fontWeight: '500',
            color: theme.colors.onSurface,
        },
        date: {
            ...typography.caption,
            color: theme.colors.onSurfaceVariant,
        },
        amount: {
            ...typography.body,
            fontWeight: 'bold',
            color: theme.colors.error,
        },
        emptyText: {
            textAlign: 'center',
            color: theme.colors.onSurfaceVariant,
            marginTop: spacing.md,
        },
        // Modal Styles
        modalContainer: {
            flex: 1,
            justifyContent: 'flex-end',
            backgroundColor: 'rgba(0,0,0,0.5)',
        },
        modalContent: {
            backgroundColor: theme.colors.surface,
            borderTopLeftRadius: 24,
            borderTopRightRadius: 24,
            padding: spacing.lg,
            maxHeight: '80%',
        },
        modalHeader: {
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: spacing.lg,
        },
        modalTitle: {
            ...typography.h3,
            color: theme.colors.onSurface,
        },
        filterSection: {
            marginBottom: spacing.lg,
        },
        filterLabel: {
            ...typography.label,
            color: theme.colors.onSurfaceVariant,
            marginBottom: spacing.sm,
        },
        dateRow: {
            flexDirection: 'row',
            gap: spacing.md,
        },
        dateInput: {
            flex: 1,
        },
        modalActions: {
            flexDirection: 'row',
            gap: spacing.md,
            marginTop: spacing.lg,
        },
        button: {
            flex: 1,
        },
    });

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.title}>Histórico de Gastos</Text>
                <TouchableOpacity onPress={openModal} style={styles.filterButton}>
                    <Icon source="filter-variant" size={20} color={hasActiveFilters ? theme.colors.primary : theme.colors.onSurfaceVariant} />
                    <Text style={[styles.filterText, { color: hasActiveFilters ? theme.colors.primary : theme.colors.onSurfaceVariant }]}>
                        Filtros {hasActiveFilters ? '(Ativos)' : ''}
                    </Text>
                </TouchableOpacity>
            </View>

            {isLoading ? (
                <ActivityIndicator />
            ) : filteredExpenses.length === 0 ? (
                <Text style={styles.emptyText}>Nenhum gasto encontrado.</Text>
            ) : (
                <View style={styles.list}>
                    {filteredExpenses.map(item => (
                        <View key={item.id} style={styles.card}>
                            <View style={styles.iconContainer}>
                                <Icon source={getCategoryIcon(item.category)} size={24} color={getCategoryColor(item.category)} />
                            </View>
                            <View style={styles.contentContainer}>
                                <Text style={styles.description}>{item.description || item.category}</Text>
                                <Text style={styles.date}>{format(parseISO(item.date), "dd 'de' MMM, yyyy", { locale: ptBR })}</Text>
                            </View>
                            <Text style={styles.amount}>- {formatCurrency(item.value)}</Text>
                        </View>
                    ))}
                </View>
            )}

            <Modal
                visible={modalVisible}
                transparent
                animationType="slide"
                onRequestClose={() => setModalVisible(false)}
            >
                <View style={styles.modalContainer}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Filtrar Gastos</Text>
                            <IconButton icon="close" onPress={() => setModalVisible(false)} />
                        </View>

                        <ScrollView>
                            <View style={styles.filterSection}>
                                <Text style={styles.filterLabel}>Tipo</Text>
                                <SegmentedButtons
                                    value={tempFilter}
                                    onValueChange={val => setTempFilter(val as any)}
                                    buttons={[
                                        { value: 'all', label: 'Todos' },
                                        { value: 'recurring', label: 'Recorrentes' },
                                    ]}
                                />
                            </View>

                            <View style={styles.filterSection}>
                                <Text style={styles.filterLabel}>Período</Text>
                                <View style={styles.dateRow}>
                                    <TouchableOpacity onPress={() => setShowStartDatePicker(true)} style={styles.dateInput}>
                                        <TextInput
                                            mode="outlined"
                                            label="Data Inicial"
                                            value={formatDate(tempStartDate)}
                                            editable={false}
                                            right={<TextInput.Icon icon="calendar" />}
                                        />
                                    </TouchableOpacity>
                                    <TouchableOpacity onPress={() => setShowEndDatePicker(true)} style={styles.dateInput}>
                                        <TextInput
                                            mode="outlined"
                                            label="Data Final"
                                            value={formatDate(tempEndDate)}
                                            editable={false}
                                            right={<TextInput.Icon icon="calendar" />}
                                        />
                                    </TouchableOpacity>
                                </View>
                            </View>

                            <View style={styles.filterSection}>
                                <Text style={styles.filterLabel}>Buscar</Text>
                                <TextInput
                                    mode="outlined"
                                    placeholder="Descrição ou categoria"
                                    value={tempSearchQuery}
                                    onChangeText={setTempSearchQuery}
                                    right={tempSearchQuery ? <TextInput.Icon icon="close" onPress={() => setTempSearchQuery('')} /> : null}
                                />
                            </View>
                        </ScrollView>

                        <View style={styles.modalActions}>
                            <Button mode="outlined" onPress={clearFilters} style={styles.button}>
                                Limpar
                            </Button>
                            <Button mode="contained" onPress={applyFilters} style={styles.button}>
                                Aplicar
                            </Button>
                        </View>
                    </View>
                </View>

                {showStartDatePicker && (
                    <DateTimePicker
                        value={tempStartDate || new Date()}
                        mode="date"
                        onChange={onStartDateChange}
                    />
                )}
                {showEndDatePicker && (
                    <DateTimePicker
                        value={tempEndDate || new Date()}
                        mode="date"
                        onChange={onEndDateChange}
                    />
                )}
            </Modal>
        </View>
    );
};
