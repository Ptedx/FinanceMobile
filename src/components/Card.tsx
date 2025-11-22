import React from 'react';
import { View, StyleSheet, ViewStyle, StyleProp } from 'react-native';
import { useTheme } from 'react-native-paper';
import { spacing, shadows } from '../theme';

interface CardProps {
    children: React.ReactNode;
    style?: StyleProp<ViewStyle>;
}

export const Card = ({ children, style }: CardProps) => {
    const theme = useTheme();
    return (
        <View style={[styles(theme).card, style]}>
            {children}
        </View>
    );
};

const styles = (theme: any) => StyleSheet.create({
    card: {
        backgroundColor: theme.colors.surface,
        borderRadius: 16,
        padding: spacing.md,
        ...shadows.sm,
        elevation: 2, // Ensure shadow on Android
    },
});
