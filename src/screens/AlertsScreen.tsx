import React from 'react';
import { View, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { Text, useTheme, Icon, IconButton } from 'react-native-paper';
import { useFinanceStore } from '../store/financeStore';
import { spacing, typography } from '../theme';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export const AlertsScreen = () => {
    const theme = useTheme();
    const { alerts, markAlertAsRead } = useFinanceStore();

    const handleMarkAsRead = async (id: string) => {
        await markAlertAsRead(id);
    };

    const renderItem = ({ item }: { item: any }) => {
        const isRead = item.isRead;

        let icon = 'bell-outline';
        let color = theme.colors.primary;

        if (item.type === 'budget_exceeded') {
            icon = 'alert-circle';
            color = theme.colors.error;
        } else if (item.type === 'budget_warning') {
            icon = 'alert';
            color = (theme.colors as any).warning || '#ED6C02';
        } else if (item.type === 'goal_reached') {
            icon = 'trophy';
            color = (theme.colors as any).success || '#2E7D32';
        }

        return (
            <TouchableOpacity
                style={[
                    styles.card,
                    {
                        backgroundColor: isRead ? theme.colors.surface : theme.colors.surfaceVariant,
                        borderColor: isRead ? theme.colors.outline : theme.colors.primary,
                        borderWidth: isRead ? 0 : 1,
                    }
                ]}
                onPress={() => handleMarkAsRead(item.id)}
            >
                <View style={styles.iconContainer}>
                    <Icon source={icon} size={24} color={color} />
                </View>
                <View style={styles.contentContainer}>
                    <Text style={[styles.message, { fontWeight: isRead ? '400' : '700' }]}>
                        {item.message}
                    </Text>
                    <Text style={styles.date}>
                        {item.createdAt ? format(parseISO(item.createdAt), "dd 'de' MMMM, HH:mm", { locale: ptBR }) : ''}
                    </Text>
                </View>
                {!isRead && (
                    <IconButton
                        icon="check"
                        size={20}
                        onPress={() => handleMarkAsRead(item.id)}
                        iconColor={theme.colors.primary}
                    />
                )}
            </TouchableOpacity>
        );
    };

    const styles = createStyles(theme);

    return (
        <View style={styles.container}>
            {alerts.length === 0 ? (
                <View style={styles.emptyState}>
                    <Icon source="bell-sleep" size={64} color={theme.colors.outline} />
                    <Text style={styles.emptyText}>Sem novos alertas</Text>
                </View>
            ) : (
                <FlatList
                    data={alerts}
                    renderItem={renderItem}
                    keyExtractor={item => item.id}
                    contentContainerStyle={styles.listContent}
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
    card: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: spacing.md,
        marginBottom: spacing.sm,
        borderRadius: 12,
        elevation: 1,
    },
    iconContainer: {
        marginRight: spacing.md,
    },
    contentContainer: {
        flex: 1,
    },
    message: {
        ...typography.body,
        color: theme.colors.onSurface,
        marginBottom: 4,
    },
    date: {
        ...typography.caption,
        color: theme.colors.onSurfaceVariant,
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
