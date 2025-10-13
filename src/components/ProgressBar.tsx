import React, { useEffect } from 'react';
import { View, StyleSheet, Text } from 'react-native';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { spacing, typography } from '../theme';
import { useTheme } from 'react-native-paper';

interface ProgressBarProps {
  value: number;
  max: number;
  label?: string;
  showPercentage?: boolean;
  color?: string;
  height?: number;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({ 
  value, 
  max, 
  label,
  showPercentage = false,
  color,
  height = 8,
}) => {
  const theme = useTheme();
  const percentage = Math.min((value / max) * 100, 100);
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withSpring(percentage / 100, {
      damping: 15,
      stiffness: 100,
    });
  }, [percentage]);

  const animatedStyle = useAnimatedStyle(() => ({
    width: `${progress.value * 100}%`,
  }));

  const getColor = () => {
    if (color) return color;
    if (percentage >= 100) return theme.colors.error;
    if (percentage >= 80) return theme.colors.warning;
    return theme.colors.success;
  };

  return (
    <View style={styles.container}>
      {label && (
        <View style={styles.labelContainer}>
          <Text style={styles.label}>{label}</Text>
          {showPercentage && (
            <Text style={[styles.percentage, { color: getColor() }]}>
              {percentage.toFixed(0)}%
            </Text>
          )}
        </View>
      )}
      <View style={[styles(theme).track, { height }]}>
        <Animated.View 
          style={[
            styles(theme).fill, 
            { backgroundColor: getColor(), height },
            animatedStyle,
          ]} 
        />
      </View>
    </View>
  );
};

const styles = (theme: any) => StyleSheet.create({
  container: {
    width: '100%',
  },
  labelContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.xs,
  },
  label: {
    ...typography.bodySmall,
    color: theme.colors.onSurface,
    fontWeight: '500',
  },
  percentage: {
    ...typography.bodySmall,
    fontWeight: '600',
  },
  track: {
    backgroundColor: theme.colors.surfaceVariant,
    borderRadius: 999,
    overflow: 'hidden',
  },
  fill: {
    borderRadius: 999,
  },
});
