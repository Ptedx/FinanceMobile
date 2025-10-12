import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withSpring,
  withDelay,
} from 'react-native-reanimated';
import { theme, spacing, typography } from '../theme';

interface BarData {
  label: string;
  value: number;
  color: string;
}

interface AnimatedBarChartProps {
  data: BarData[];
}

export const AnimatedBarChart: React.FC<AnimatedBarChartProps> = ({ data }) => {
  const total = data.reduce((sum, item) => sum + item.value, 0);
  const maxValue = Math.max(...data.map(d => d.value));

  return (
    <View style={styles.container}>
      {data.map((item, index) => {
        const percentage = (item.value / total) * 100;
        const width = (item.value / maxValue) * 100;
        
        return (
          <AnimatedBar
            key={item.label}
            label={item.label}
            value={item.value}
            percentage={percentage}
            width={width}
            color={item.color}
            delay={index * 100}
          />
        );
      })}
    </View>
  );
};

interface AnimatedBarProps {
  label: string;
  value: number;
  percentage: number;
  width: number;
  color: string;
  delay: number;
}

const AnimatedBar: React.FC<AnimatedBarProps> = ({
  label,
  value,
  percentage,
  width,
  color,
  delay,
}) => {
  const barWidth = useSharedValue(0);
  const opacity = useSharedValue(0);

  useEffect(() => {
    barWidth.value = withDelay(
      delay,
      withSpring(width, {
        damping: 20,
        stiffness: 90,
      })
    );
    opacity.value = withDelay(
      delay,
      withSpring(1, {
        damping: 20,
        stiffness: 90,
      })
    );
  }, [width, delay]);

  const animatedBarStyle = useAnimatedStyle(() => ({
    width: `${barWidth.value}%`,
    opacity: opacity.value,
  }));

  const animatedTextStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  return (
    <View style={styles.barContainer}>
      <View style={styles.barHeader}>
        <Animated.Text style={[styles.barLabel, animatedTextStyle]}>
          {label}
        </Animated.Text>
        <Animated.Text style={[styles.barPercentage, animatedTextStyle]}>
          {percentage.toFixed(0)}%
        </Animated.Text>
      </View>
      <View style={styles.barTrack}>
        <Animated.View 
          style={[
            styles.barFill, 
            { backgroundColor: color },
            animatedBarStyle,
          ]} 
        />
      </View>
      <Animated.Text style={[styles.barValue, animatedTextStyle]}>
        R$ {value.toFixed(2)}
      </Animated.Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  barContainer: {
    marginBottom: spacing.md,
  },
  barHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  barLabel: {
    ...typography.body,
    color: theme.colors.onSurface,
    fontWeight: '500',
  },
  barPercentage: {
    ...typography.bodySmall,
    color: theme.colors.primary,
    fontWeight: '600',
  },
  barTrack: {
    width: '100%',
    height: 24,
    backgroundColor: theme.colors.surfaceVariant,
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: spacing.xs,
  },
  barFill: {
    height: '100%',
    borderRadius: 12,
  },
  barValue: {
    ...typography.bodySmall,
    color: theme.colors.onSurfaceVariant,
  },
});
