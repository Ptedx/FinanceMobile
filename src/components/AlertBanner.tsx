import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { IconButton, useTheme } from 'react-native-paper';
import { spacing, typography, shadows } from '../theme';
import { Alert } from '../types';

interface AlertBannerProps {
  alert: Alert;
  onDismiss: () => void;
}

export const AlertBanner: React.FC<AlertBannerProps> = ({ alert, onDismiss }) => {
  const theme = useTheme();
  const getAlertStyle = () => {
    switch (alert.type) {
      case 'budget_exceeded':
        return { backgroundColor: theme.dark ? theme.colors.error + '20' : '#FEE2E2', iconColor: theme.colors.error, textColor: theme.colors.error };
      case 'budget_warning':
        return { backgroundColor: theme.dark ? theme.colors.warning + '20' : '#FEF3C7', iconColor: theme.colors.warning, textColor: theme.colors.warning };
      case 'goal_progress':
        return { backgroundColor: theme.dark ? theme.colors.success + '20' : '#D1FAE5', iconColor: theme.colors.success, textColor: theme.colors.success };
      default:
        return { backgroundColor: theme.dark ? theme.colors.primary + '20' : '#E0E7FF', iconColor: theme.colors.primary, textColor: theme.colors.primary };
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
    <View style={[styles(theme).container, { backgroundColor: alertStyle.backgroundColor }, shadows.sm]}>
      <IconButton 
        icon={getIcon()} 
        size={20} 
        iconColor={alertStyle.iconColor}
        style={styles.icon}
      />
      <Text style={[styles(theme).message, { color: alertStyle.textColor }]}>{alert.message}</Text>
      <TouchableOpacity onPress={onDismiss}>
        <IconButton icon="close" size={20} iconColor={theme.colors.onSurfaceVariant} />
      </TouchableOpacity>
    </View>
  );
};

const styles = (theme: any) =>
  StyleSheet.create({
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
