import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, Button, useTheme, Icon } from 'react-native-paper';
import { spacing, typography } from '../theme';

interface ErrorRetryScreenProps {
    error: string;
    onRetry: () => void;
}

export const ErrorRetryScreen: React.FC<ErrorRetryScreenProps> = ({ error, onRetry }) => {
    const theme = useTheme();

    return (
        <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
            <Icon source="alert-circle-outline" size={64} color={theme.colors.error} />
            <Text style={[styles.title, { color: theme.colors.onSurface }]}>
                Ops! Algo deu errado.
            </Text>
            <Text style={[styles.message, { color: theme.colors.onSurfaceVariant }]}>
                {error}
            </Text>
            <Button mode="contained" onPress={onRetry} style={styles.button}>
                Tentar Novamente
            </Button>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: spacing.xl,
    },
    title: {
        ...typography.h2,
        marginTop: spacing.md,
        marginBottom: spacing.sm,
        textAlign: 'center',
    },
    message: {
        ...typography.body,
        textAlign: 'center',
        marginBottom: spacing.xl,
    },
    button: {
        width: '100%',
    },
});
