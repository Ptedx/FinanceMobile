import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, useTheme } from 'react-native-paper';
import { spacing, typography } from '../theme';

interface ProgressBarProps {
    value: number;
    max: number;
    color?: string;
    showPercentage?: boolean;
}

export const ProgressBar = ({ value, max, color, showPercentage = true }: ProgressBarProps) => {
    const theme = useTheme();

    // Handle 0/0 or invalid inputs safely
    const safeMax = max > 0 ? max : 1;
    const percentage = Math.min(Math.max(value / safeMax, 0), 1);
    const barColor = color || theme.colors.primary;

    return (
        <View style={styles.container}>
            <View style={[styles.track, { backgroundColor: theme.colors.surfaceVariant }]}>
                <View style={[styles.fill, { width: `${percentage * 100}%`, backgroundColor: barColor }]} />
            </View>
            {showPercentage && (
                <Text style={[styles.text, { color: theme.colors.onSurfaceVariant }]}>{(percentage * 100).toFixed(0)}%</Text>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    track: {
        flex: 1,
        height: 8,
        borderRadius: 4,
        overflow: 'hidden',
    },
    fill: {
        height: '100%',
        borderRadius: 4,
    },
    text: {
        marginLeft: spacing.sm,
        ...typography.caption,
    },
});
