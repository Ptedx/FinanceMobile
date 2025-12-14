import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions, Platform } from 'react-native';
import { IconButton, FAB, useTheme, SegmentedButtons, Icon, Button, Portal, Modal } from 'react-native-paper';
import { Card } from '../components/Card';
import { ProgressBar } from '../components/ProgressBar';
import { AlertBanner } from '../components/AlertBanner';
import { AnimatedBarChart } from '../components/AnimatedBarChart';
import { NetWorthChart } from '../components/NetWorthChart';
import { TransactionTypeSheet } from '../components/TransactionTypeSheet';
import { useFinanceStore } from '../store/financeStore';
import { useAuthStore } from '../store/authStore';
import { useFinanceEngine } from '../hooks/useFinanceEngine';
import { spacing, typography } from '../theme';
import { getCategoryColor, getCategoryLabel, getCategoryIcon, INCOME_CATEGORIES } from '../constants';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { getInvoiceDates, isExpenseInInvoice } from '../utils/creditCardUtils';
import { formatCurrency } from '../utils/formatters';
import { db } from '../services/database';
import * as Clipboard from 'expo-clipboard';
import { LinearGradient } from 'expo-linear-gradient';

import { LoadingScreen } from './LoadingScreen';
import { ErrorRetryScreen } from './ErrorRetryScreen';

const { width } = Dimensions.get('window');

export const DashboardScreen = ({ navigation }: any) => {
    const theme = useTheme();
    const { user } = useAuthStore();
    const { alerts, markAlertAsRead, goals, isLoading, error, retry, isValuesVisible, toggleValuesVisibility, creditCards, expenses, incomes, invoicePayments } = useFinanceStore();
    const [selectedPeriod, setSelectedPeriod] = useState<'1D' | '7D' | '1M' | '3M' | '6M' | '1Y' | 'ALL'>('7D');

    const [dismissedAlerts, setDismissedAlerts] = useState<string[]>([]);
    const [sheetVisible, setSheetVisible] = useState(false);

    const { dashboardData, getSpendingInsights, getNetWorthHistory } = useFinanceEngine();

    if (isLoading) return <LoadingScreen />;
    if (error) return <ErrorRetryScreen error={error} onRetry={retry} />;

    const insights = getSpendingInsights();
    const netWorthHistory = getNetWorthHistory(selectedPeriod);

    const categoryData = Object.entries(insights.categoryBreakdown)
        .map(([category, amount]) => ({
            category: category as any,
            label: getCategoryLabel(category as any),
            value: amount,
            color: getCategoryColor(category as any),
            percentage: 0,
        }))
        .sort((a, b) => b.value - a.value);

    // Limit category data to top 5 to avoid overcrowding
    const topCategoryData = categoryData.slice(0, 5);

    const unreadAlerts = alerts
        .filter(a => !a.isRead && !dismissedAlerts.includes(a.id))
        .slice(0, 3);

    const activeGoals = goals
        .map(g => ({ ...g, progress: g.currentAmount / g.targetAmount }))
        .filter(g => g.progress >= 0.5 && g.progress < 1)
        .sort((a, b) => b.progress - a.progress);

    const formatValue = (value: number) => {
        if (!isValuesVisible) return 'R$ ••••••';
        return formatCurrency(value);
    };

    const getGreeting = () => {
        const hour = new Date().getHours();
        const userName = user?.name?.split(' ')[0] || 'Usuário';
        if (hour >= 5 && hour < 12) return `Bom dia, ${userName}!`;
        if (hour >= 12 && hour < 18) return `Boa tarde, ${userName}!`;
        return `Boa noite, ${userName}!`;
    };

    const styles = createStyles(theme);

    return (
        <View style={styles.container}>
            {/* Blue Background Header Area */}
            <View style={styles.headerBackground}>
                <View style={styles.headerTopRow}>
                    <View>
                        <Text style={styles.greetingText}>{getGreeting()}</Text>
                        <Text style={styles.dateText}>
                            {format(new Date(), "EEEE, d 'de' MMMM", { locale: ptBR })}
                        </Text>
                    </View>
                    <View style={styles.headerIcons}>
                        <TouchableOpacity onPress={toggleValuesVisibility} style={styles.iconButton}>
                            <Icon source={isValuesVisible ? "eye" : "eye-off"} size={22} color="white" />
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => navigation.navigate('Alerts')} style={styles.iconButton}>
                            <Icon source="bell-outline" size={22} color="white" />
                            {unreadAlerts.length > 0 && <View style={styles.badge} />}
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => navigation.navigate('Settings')} style={styles.iconButton}>
                            <Icon source="cog-outline" size={22} color="white" />
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Main Balance Display - Centered in Blue Area */}
                <View style={styles.balanceContainer}>
                    <Text style={styles.balanceLabel}>Saldo Disponível</Text>
                    <Text style={styles.balanceValue}>{formatValue(dashboardData.availableBalance)}</Text>

                    <Text style={styles.netWorthLabel}>
                        Patrimônio: <Text style={styles.netWorthValue}>{formatValue(dashboardData.netWorth)}</Text>
                    </Text>

                    <View style={styles.miniStatsContainer}>
                        <View style={styles.miniStat}>
                            <Icon source="arrow-up-circle" size={16} color="#A5F3A5" />
                            <Text style={styles.miniStatLabel}>Receitas</Text>
                            <Text style={styles.miniStatValue}>{formatValue(dashboardData.monthlyIncome)}</Text>
                        </View>
                        <View style={styles.miniStatSeparator} />
                        <View style={styles.miniStat}>
                            <Icon source="arrow-down-circle" size={16} color="#FFB4AB" />
                            <Text style={styles.miniStatLabel}>Despesas</Text>
                            <Text style={styles.miniStatValue}>{formatValue(dashboardData.monthlyTotal)}</Text>
                        </View>
                    </View>
                </View>
            </View>

            {/* White Sheet Content 'Pulling Up' */}
            <View style={styles.contentSheet}>
                <ScrollView
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={styles.scrollContent}
                >
                    {/* Alerts Banner inside scroll */}
                    {unreadAlerts.map(alert => (
                        <AlertBanner key={alert.id} alert={alert} onDismiss={() => {
                            setDismissedAlerts(prev => [...prev, alert.id]);
                            markAlertAsRead(alert.id);
                        }} />
                    ))}

                    {/* Quick Actions / Summary Chips */}
                    {/* Could be replaced by "Services" icons if desired, but sticking to summary for now */}

                    {/* Charts Section */}
                    <View style={styles.sectionContainer}>
                        <View style={styles.sectionHeader}>
                            <Text style={styles.sectionTitle}>Análise Patrimonial</Text>
                            <TouchableOpacity onPress={() => navigation.navigate('Simulation')}>
                                <Text style={styles.linkText}>Simular</Text>
                            </TouchableOpacity>
                        </View>

                        <View style={styles.chartWrapper}>
                            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: spacing.md }}>
                                <SegmentedButtons
                                    value={selectedPeriod}
                                    onValueChange={value => setSelectedPeriod(value as any)}
                                    buttons={[
                                        { value: '7D', label: '7D' },
                                        { value: '1M', label: '1M' },
                                        { value: '3M', label: '3M' },
                                        { value: '1Y', label: '1A' },
                                    ]}
                                    density="small"
                                    style={{ marginBottom: 8 }}
                                />
                            </ScrollView>

                            {netWorthHistory.length > 1 && (
                                <NetWorthChart data={netWorthHistory} period={selectedPeriod} hideValues={!isValuesVisible} />
                            )}
                        </View>
                    </View>

                    {/* Credit Cards Section */}
                    <View style={styles.sectionContainer}>
                        <View style={styles.sectionHeader}>
                            <Text style={styles.sectionTitle}>Cartões</Text>
                            <TouchableOpacity onPress={() => navigation.navigate('AddCreditCard')}>
                                <Icon source="plus-circle-outline" size={24} color={theme.colors.primary} />
                            </TouchableOpacity>
                        </View>

                        {creditCards.length === 0 ? (
                            <Text style={styles.emptyText}>Nenhum cartão cadastrado.</Text>
                        ) : (
                            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: spacing.md, paddingHorizontal: 4 }}>
                                {creditCards.map(card => {
                                    const { startDate, endDate } = getInvoiceDates(card.closingDay);
                                    const invoice = expenses
                                        .filter(e => e.creditCardId === card.id && isExpenseInInvoice(new Date(e.date), startDate, endDate))
                                        .reduce((sum, e) => sum + e.value, 0);

                                    const payments = invoicePayments
                                        .filter(p => p.creditCardId === card.id && isExpenseInInvoice(new Date(p.date), startDate, endDate))
                                        .reduce((sum, p) => sum + p.amount, 0);

                                    const remainingInvoice = Math.max(0, invoice - payments);

                                    // Accessibility: Ensure high contrast.
                                    // If card has custom color, we try to use it, else default to a specific set.
                                    const cardBg = card.color || theme.colors.surfaceVariant;
                                    const isLight = true; // simplifying logic, could use color utils to check contrast
                                    // Forcing a secure style:

                                    return (
                                        <TouchableOpacity
                                            key={card.id}
                                            style={[styles.cardItem, { backgroundColor: theme.colors.elevation.level2 }]}
                                            onPress={() => navigation.navigate('AddCreditCard', { card: card })}
                                        >
                                            <View style={styles.cardHeader}>
                                                <Text style={[styles.cardName, { color: theme.colors.onSurface }]}>{card.name}</Text>
                                                <Icon source={card.type === 'visa' ? 'credit-card' : 'credit-card-outline'} size={24} color={theme.colors.secondary} />
                                            </View>

                                            <Text style={styles.cardLast4}>•••• {card.last4Digits || '0000'}</Text>

                                            <View style={styles.cardFooter}>
                                                <View>
                                                    <Text style={styles.cardLabel}>Fatura Atual</Text>
                                                    <Text style={[styles.cardValue, { color: theme.colors.primary }]}>{formatValue(remainingInvoice)}</Text>
                                                </View>
                                                <View style={{ alignItems: 'flex-end' }}>
                                                    <Text style={styles.cardLabel}>Limite</Text>
                                                    <Text style={styles.cardLimit}>{formatValue(card.limit)}</Text>
                                                </View>
                                            </View>

                                            <ProgressBar
                                                value={remainingInvoice}
                                                max={card.limit}
                                                color={invoice > card.limit * 0.8 ? theme.colors.error : theme.colors.primary}
                                                showPercentage={false}
                                            />
                                        </TouchableOpacity>
                                    );
                                })}
                            </ScrollView>
                        )}
                    </View>

                    {/* Goals Section */}
                    {activeGoals.length > 0 && (
                        <View style={styles.sectionContainer}>
                            <View style={styles.sectionHeader}>
                                <Text style={styles.sectionTitle}>Metas</Text>
                            </View>
                            {activeGoals.map(goal => (
                                <TouchableOpacity
                                    key={goal.id}
                                    style={[styles.goalItem, { backgroundColor: theme.colors.elevation.level1 }]}
                                    onPress={() => navigation.navigate('Goals')}
                                >
                                    <View style={styles.goalHeader}>
                                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                                            <View style={{ backgroundColor: theme.colors.secondaryContainer, padding: 8, borderRadius: 8 }}>
                                                <Icon source="flag-variant" size={20} color={theme.colors.onSecondaryContainer} />
                                            </View>
                                            <Text style={styles.goalTitle}>{goal.title}</Text>
                                        </View>
                                        <Text style={styles.goalPercentage}>{(goal.progress * 100).toFixed(0)}%</Text>
                                    </View>
                                    <ProgressBar value={goal.currentAmount} max={goal.targetAmount} showPercentage={false} />
                                </TouchableOpacity>
                            ))}
                        </View>
                    )}

                    {/* Spending Breakdown */}
                    {topCategoryData.length > 0 && (
                        <View style={styles.sectionContainer}>
                            <Text style={styles.sectionTitle}>Gastos por Categoria</Text>
                            <View style={styles.chartWrapper}>
                                <AnimatedBarChart data={topCategoryData} hideValues={!isValuesVisible} />
                            </View>
                        </View>
                    )}

                    <View style={{ height: 80 }} />
                </ScrollView>
            </View>

            <FAB
                icon="plus"
                style={styles.fab}
                onPress={() => setSheetVisible(true)}
                color={theme.colors.onPrimaryContainer}
                theme={{ colors: { primaryContainer: theme.colors.primaryContainer } }}
            />

            <TransactionTypeSheet
                visible={sheetVisible}
                onClose={() => setSheetVisible(false)}
                onSelectExpense={() => {
                    setSheetVisible(false);
                    navigation.navigate('AddExpense');
                }}
                onSelectIncome={() => {
                    setSheetVisible(false);
                    navigation.navigate('AddIncome');
                }}
            />
        </View>
    );
};

const createStyles = (theme: any) =>
    StyleSheet.create({
        container: {
            flex: 1,
            backgroundColor: theme.colors.primary, // Background behind header
        },
        headerBackground: {
            // height: '35%', // Removed fixed height to allow content to push
            backgroundColor: theme.colors.primary,
            paddingHorizontal: spacing.md,
            paddingTop: Platform.OS === 'ios' ? 60 : 40,
            paddingBottom: spacing.xl + 20, // Add enough padding for the sheet overlap (20px) + spacing
        },
        headerTopRow: {
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            marginBottom: spacing.md,
        },
        greetingText: {
            ...typography.h3,
            color: 'white',
            fontWeight: 'bold',
        },
        dateText: {
            ...typography.bodySmall,
            color: 'rgba(255,255,255,0.8)',
            textTransform: 'capitalize',
        },
        headerIcons: {
            flexDirection: 'row',
            gap: 4,
        },
        iconButton: {
            padding: 8,
        },
        badge: {
            position: 'absolute',
            top: 8,
            right: 8,
            width: 8,
            height: 8,
            borderRadius: 4,
            backgroundColor: theme.colors.error,
        },
        balanceContainer: {
            alignItems: 'center',
            marginTop: spacing.sm,
        },
        balanceLabel: {
            color: 'rgba(255,255,255,0.8)',
            fontSize: 14,
            marginBottom: 4,
        },
        balanceValue: {
            fontSize: 40,
            fontWeight: 'bold',
            color: 'white',
            marginBottom: spacing.xs, // Reduced margin
        },
        netWorthLabel: {
            color: 'rgba(255,255,255,0.7)',
            fontSize: 12,
            marginBottom: spacing.lg, // moved spacing here
        },
        netWorthValue: {
            color: 'rgba(255,255,255,0.9)',
            fontWeight: 'bold',
        },
        miniStatsContainer: {
            flexDirection: 'row',
            backgroundColor: 'rgba(255,255,255,0.15)',
            borderRadius: 16,
            padding: 12,
            width: '100%',
        },
        miniStat: {
            flex: 1,
            alignItems: 'center',
            gap: 4,
        },
        miniStatSeparator: {
            width: 1,
            backgroundColor: 'rgba(255,255,255,0.2)',
            marginHorizontal: 8,
        },
        miniStatLabel: {
            color: 'rgba(255,255,255,0.9)',
            fontSize: 12,
        },
        miniStatValue: {
            color: 'white',
            fontWeight: 'bold',
            fontSize: 14,
        },

        // Content Sheet Styles
        contentSheet: {
            flex: 1,
            backgroundColor: theme.colors.background,
            borderTopLeftRadius: 30,
            borderTopRightRadius: 30,
            marginTop: -20, // Negative margin to overlap
            overflow: 'hidden',
        },
        scrollContent: {
            padding: spacing.md,
            paddingTop: spacing.lg,
        },
        sectionContainer: {
            marginBottom: spacing.lg,
        },
        sectionHeader: {
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: spacing.md,
        },
        sectionTitle: {
            fontSize: 18,
            fontWeight: 'bold',
            color: theme.colors.onSurface,
        },
        linkText: {
            color: theme.colors.primary,
            fontWeight: '600',
        },
        chartWrapper: {
            backgroundColor: theme.colors.surface,
            borderRadius: 16,
            padding: spacing.sm,
            // elevation: 2,
            borderWidth: 1,
            borderColor: theme.colors.outlineVariant,
        },

        // Card Styles - Improved Contrast
        cardItem: {
            width: 280, // Wider for better readability
            borderRadius: 16,
            padding: 20,
            justifyContent: 'space-between',
            gap: 16,
        },
        cardHeader: {
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
        },
        cardName: {
            fontSize: 16,
            fontWeight: 'bold',
        },
        cardLast4: {
            fontSize: 14,
            color: theme.colors.onSurfaceVariant,
            letterSpacing: 2,
        },
        cardFooter: {
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'flex-end',
            marginBottom: 8,
        },
        cardLabel: {
            fontSize: 12,
            color: theme.colors.onSurfaceVariant,
        },
        cardValue: {
            fontSize: 20,
            fontWeight: 'bold',
        },
        cardLimit: {
            fontSize: 12,
            color: theme.colors.onSurface,
            fontWeight: '500',
        },

        // Goals Styles
        goalItem: {
            padding: 16,
            borderRadius: 16,
            marginBottom: spacing.sm,
        },
        goalHeader: {
            flexDirection: 'row',
            justifyContent: 'space-between',
            marginBottom: 12,
        },
        goalTitle: {
            fontWeight: '600',
            color: theme.colors.onSurface,
            fontSize: 16,
        },
        goalPercentage: {
            fontWeight: 'bold',
            color: theme.colors.primary,
        },
        emptyText: {
            color: theme.colors.onSurfaceVariant,
            fontStyle: 'italic',
            textAlign: 'center',
            marginVertical: 10,
        },
        fab: {
            position: 'absolute',
            bottom: spacing.lg,
            right: spacing.lg,
            borderRadius: 16,
        },
    });
