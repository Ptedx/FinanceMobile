import React from 'react';
import { View, StyleSheet, TouchableOpacity, ViewStyle } from 'react-native';
import { spacing, shadows } from '../theme';
import { useTheme } from 'react-native-paper';

interface CardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  onPress?: () => void;
  variant?: 'elevated' | 'outlined' | 'flat';
}

export const Card: React.FC<CardProps> = ({ 
  children, 
  style, 
  onPress,
  variant = 'elevated' 
}) => {
  const theme = useTheme();
  const cardStyle = [
    styles(theme).card,
    variant === 'elevated' && shadows.md,
    variant === 'outlined' && styles(theme).outlined,
    variant === 'flat' && styles(theme).flat,
    style,
  ];

  if (onPress) {
    return (
      <TouchableOpacity 
        style={cardStyle} 
        onPress={onPress}
        activeOpacity={0.7}
      >
        {children}
      </TouchableOpacity>
    );
  }

  return <View style={cardStyle}>{children}</View>;
};

const styles = (theme: any) =>
  StyleSheet.create({
    card: {
      backgroundColor: theme.colors.surface,
      borderRadius: theme.roundness,
      padding: spacing.md,
    },
    outlined: {
      borderWidth: 1,
      borderColor: theme.colors.outline,
    },
    flat: {
      backgroundColor: 'transparent',
    },
  });
