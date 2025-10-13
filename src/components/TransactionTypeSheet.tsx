import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal } from 'react-native';
import { IconButton, useTheme } from 'react-native-paper';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import { spacing, typography } from '../theme';

interface TransactionTypeSheetProps {
  visible: boolean;
  onClose: () => void;
  onSelectExpense: () => void;
  onSelectIncome: () => void;
}

export const TransactionTypeSheet = ({ visible, onClose, onSelectExpense, onSelectIncome }: TransactionTypeSheetProps) => {
  const theme = useTheme();
  const styles = createStyles(theme);
  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <TouchableOpacity 
        style={styles.overlay} 
        activeOpacity={1} 
        onPress={onClose}
      >
        <TouchableOpacity activeOpacity={1} style={styles.sheet}>
          <View style={styles.handle} />
          
          <View style={styles.header}>
            <Text style={styles.title}>Nova Transação</Text>
            <IconButton icon="close" size={24} onPress={onClose} />
          </View>

          <TouchableOpacity style={styles.option} onPress={onSelectExpense}>
            <View style={[styles.iconContainer, { backgroundColor: theme.colors.error + '15' }]}>
              <Icon name="minus-circle" size={32} color={theme.colors.error} />
            </View>
            <View style={styles.optionText}>
              <Text style={styles.optionTitle}>Adicionar Gasto</Text>
              <Text style={styles.optionDescription}>Registrar uma despesa ou compra</Text>
            </View>
            <Icon name="chevron-right" size={24} color={theme.colors.onSurfaceVariant} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.option} onPress={onSelectIncome}>
            <View style={[styles.iconContainer, { backgroundColor: theme.colors.success + '15' }]}>
              <Icon name="plus-circle" size={32} color={theme.colors.success} />
            </View>
            <View style={styles.optionText}>
              <Text style={styles.optionTitle}>Adicionar Receita</Text>
              <Text style={styles.optionDescription}>Registrar um recebimento ou ganho</Text>
            </View>
            <Icon name="chevron-right" size={24} color={theme.colors.onSurfaceVariant} />
          </TouchableOpacity>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
};

const createStyles = (theme: any) => StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: theme.colors.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingBottom: spacing.xl,
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: theme.colors.outline,
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: spacing.sm,
    marginBottom: spacing.md,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.sm,
  },
  title: {
    ...typography.h3,
    color: theme.colors.onSurface,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    marginHorizontal: spacing.md,
    marginVertical: spacing.xs,
    borderRadius: 12,
    backgroundColor: theme.colors.surfaceVariant,
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  optionText: {
    flex: 1,
  },
  optionTitle: {
    ...typography.body,
    fontWeight: '600',
    color: theme.colors.onSurface,
    marginBottom: spacing.xs / 2,
  },
  optionDescription: {
    ...typography.bodySmall,
    color: theme.colors.onSurfaceVariant,
  },
});
