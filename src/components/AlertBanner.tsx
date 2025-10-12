import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { IconButton } from 'react-native-paper';
import { theme, spacing, typography, shadows } from '../theme';
import { Alert } from '../types';

interface AlertBannerProps {
  alert: Alert;
  onDismiss: () => void;
}

export const AlertBanner: React.FC<AlertBannerProps> = ({ alert, onDismiss }) => {
  const getAlertStyle = () => {
    switch (alert.type) {
      case 'budget_exceeded':
        return { backgroundColor: '#FEE2E2', iconColor: theme.colors.error };
      case 'budget_warning':
        return { backgroundColor: '#FEF3C7', iconColor: theme.colors.warning };
      case 'goal_progress':
        return { backgroundColor: '#D1FAE5', iconColor: theme.colors.success };
      default:
        return { backgroundColor: '#E0E7FF', iconColor: theme.colors.primary };
    }
  };

  const alertStyle = getAlertStyle();

  const getIcon = () => {
    switch (alert.type) {
      case 'budget_exceeded':
      case 'budget_warning':
        return 'alert-circle';
      case 'goal_progress':
        return 'check-circle';
      default:
        return 'information';
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: alertStyle.backgroundColor }, shadows.sm]}>
      <IconButton 
        icon={getIcon()} 
        size={20} 
        iconColor={alertStyle.iconColor}
        style={styles.icon}
      />
      <Text style={styles.message}>{alert.message}</Text>
      <TouchableOpacity onPress={onDismiss}>
        <IconButton icon="close" size={20} iconColor={theme.colors.onSurfaceVariant} />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.sm,
    borderRadius: theme.roundness,
    marginBottom: spacing.sm,
  },
  icon: {
    margin: 0,
  },
  message: {
    flex: 1,
    ...typography.bodySmall,
    color: theme.colors.onSurface,
    marginLeft: spacing.xs,
  },
});
