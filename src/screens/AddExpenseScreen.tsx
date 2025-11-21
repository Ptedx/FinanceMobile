import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { TextInput, Button, SegmentedButtons, IconButton, useTheme } from 'react-native-paper';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card } from '../components/Card';
import { useFinanceStore } from '../store/financeStore';
import { spacing, typography } from '../theme';
import { EXPENSE_CATEGORIES, PAYMENT_METHODS, getCategoryColor } from '../constants';
import { ExpenseCategory, PaymentMethod } from '../types';


const expenseSchema = z.object({
  value: z.string().min(1, 'Valor é obrigatório'),
  description: z.string().optional(),
  category: z.string().min(1, 'Categoria é obrigatória'),
  paymentMethod: z.string().min(1, 'Método de pagamento é obrigatório'),
  isRecurring: z.boolean(),
});

type ExpenseFormData = z.infer<typeof expenseSchema>;

export const AddExpenseScreen = ({ navigation, route }: any) => {
  const theme = useTheme();
  const { addExpense, updateExpense } = useFinanceStore();
  const [date, setDate] = useState(new Date());

  const expenseToEdit = route.params?.expense;
  const isEditing = !!expenseToEdit;

  React.useEffect(() => {
    if (isEditing) {
      navigation.setOptions({
        title: `Editar gasto ${expenseToEdit.description || expenseToEdit.category}`
      });

      if (expenseToEdit.date) {
        // Handle both YYYY-MM-DD and ISO strings
        const dateObj = new Date(expenseToEdit.date);
        if (!isNaN(dateObj.getTime())) {
          setDate(dateObj);
        }
      }
    }
  }, [isEditing, expenseToEdit, navigation]);

  const { control, handleSubmit, formState: { errors } } = useForm<ExpenseFormData>({
    resolver: zodResolver(expenseSchema),
    defaultValues: {
      value: expenseToEdit ? expenseToEdit.value.toString().replace('.', ',') : '',
      description: expenseToEdit?.description || '',
      category: expenseToEdit?.category || '',
      paymentMethod: expenseToEdit?.paymentMethod || '',
      isRecurring: expenseToEdit?.isRecurring || false,
    },
  });

  const onSubmit = async (data: ExpenseFormData) => {
    const expenseData = {
      category: data.category as ExpenseCategory,
      value: parseFloat(data.value.replace(',', '.')),
      date: date.toISOString(),
      paymentMethod: data.paymentMethod as PaymentMethod,
      isRecurring: data.isRecurring,
      description: data.description,
    };

    try {
      if (isEditing) {
        await updateExpense(expenseToEdit.id, expenseData);
      } else {
        await addExpense(expenseData);
      }

      navigation.goBack();
    } catch (error) {
      console.error('Error in onSubmit:', error);
    }
  };

  const styles = createStyles(theme);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Card style={styles.card}>
        <Text style={styles.sectionTitle}>Valor</Text>
        <Controller
          control={control}
          name="value"
          render={({ field: { onChange, value } }) => (
            <TextInput
              mode="outlined"
              label="R$"
              value={value}
              onChangeText={onChange}
              keyboardType="decimal-pad"
              error={!!errors.value}
              style={styles.input}
            />
          )}
        />
        {errors.value && <Text style={styles.errorText}>{errors.value.message}</Text>}

        <Text style={styles.sectionTitle}>Descrição (opcional)</Text>
        <Controller
          control={control}
          name="description"
          render={({ field: { onChange, value } }) => (
            <TextInput
              mode="outlined"
              label="Ex: Almoço no restaurante"
              value={value}
              onChangeText={onChange}
              style={styles.input}
            />
          )}
        />
      </Card>

      <Card style={styles.card}>
        <Text style={styles.sectionTitle}>Categoria</Text>
        <Controller
          control={control}
          name="category"
          render={({ field: { onChange, value } }) => (
            <View style={styles.categoriesGrid}>
              {EXPENSE_CATEGORIES.map(cat => (
                <TouchableOpacity
                  key={cat.value}
                  style={[
                    styles.categoryChip,
                    value === cat.value && {
                      backgroundColor: getCategoryColor(cat.value),
                    },
                  ]}
                  onPress={() => onChange(cat.value)}
                >
                  <IconButton
                    icon={cat.icon}
                    size={20}
                    iconColor={value === cat.value ? '#fff' : getCategoryColor(cat.value)}
                  />
                  <Text
                    style={[
                      styles.categoryLabel,
                      value === cat.value && styles.categoryLabelActive,
                    ]}
                  >
                    {cat.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        />
        {errors.category && <Text style={styles.errorText}>{errors.category.message}</Text>}
      </Card>

      <Card style={styles.card}>
        <Text style={styles.sectionTitle}>Método de Pagamento</Text>
        <Controller
          control={control}
          name="paymentMethod"
          render={({ field: { onChange, value } }) => (
            <View style={styles.paymentGrid}>
              {PAYMENT_METHODS.map(method => (
                <TouchableOpacity
                  key={method.value}
                  style={[
                    styles.paymentChip,
                    value === method.value && styles.paymentChipActive,
                  ]}
                  onPress={() => onChange(method.value)}
                >
                  <IconButton icon={method.icon} size={20} />
                  <Text style={styles.paymentLabel}>{method.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        />
        {errors.paymentMethod && <Text style={styles.errorText}>{errors.paymentMethod.message}</Text>}
      </Card>

      <Card style={styles.card}>
        <Controller
          control={control}
          name="isRecurring"
          render={({ field: { onChange, value } }) => (
            <TouchableOpacity
              style={styles.recurringRow}
              onPress={() => onChange(!value)}
            >
              <View>
                <Text style={styles.recurringTitle}>Gasto Recorrente</Text>
                <Text style={styles.recurringSubtitle}>
                  Este gasto se repete mensalmente
                </Text>
              </View>
              <IconButton
                icon={value ? 'checkbox-marked' : 'checkbox-blank-outline'}
                iconColor={theme.colors.primary}
                size={24}
              />
            </TouchableOpacity>
          )}
        />
      </Card>

      <Button
        mode="contained"
        onPress={handleSubmit(onSubmit)}
        style={styles.submitButton}
        contentStyle={styles.submitButtonContent}
      >
        {isEditing ? 'Salvar Alterações' : 'Adicionar Gasto'}
      </Button>
    </ScrollView>
  );
};

const createStyles = (theme: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  content: {
    padding: spacing.md,
    paddingBottom: spacing.xl,
  },
  card: {
    marginBottom: spacing.md,
  },
  sectionTitle: {
    ...typography.h3,
    color: theme.colors.onSurface,
    marginBottom: spacing.sm,
  },
  input: {
    backgroundColor: theme.colors.surface,
    marginBottom: spacing.sm,
  },
  errorText: {
    ...typography.caption,
    color: theme.colors.error,
    marginTop: -spacing.xs,
    marginBottom: spacing.sm,
  },
  categoriesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: theme.roundness,
    borderWidth: 1,
    borderColor: theme.colors.outline,
    backgroundColor: theme.colors.surface,
  },
  categoryLabel: {
    ...typography.bodySmall,
    color: theme.colors.onSurface,
    marginLeft: -spacing.xs,
  },
  categoryLabelActive: {
    color: '#fff',
  },
  paymentGrid: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  paymentChip: {
    flex: 1,
    alignItems: 'center',
    padding: spacing.sm,
    borderRadius: theme.roundness,
    borderWidth: 1,
    borderColor: theme.colors.outline,
    backgroundColor: theme.colors.surface,
  },
  paymentChipActive: {
    borderColor: theme.colors.primary,
    backgroundColor: theme.colors.primary + '10',
  },
  paymentLabel: {
    ...typography.bodySmall,
    color: theme.colors.onSurface,
    marginTop: -spacing.xs,
  },
  recurringRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  recurringTitle: {
    ...typography.body,
    color: theme.colors.onSurface,
    fontWeight: '500',
  },
  recurringSubtitle: {
    ...typography.bodySmall,
    color: theme.colors.onSurfaceVariant,
  },
  submitButton: {
    marginTop: spacing.md,
  },
  submitButtonContent: {
    paddingVertical: spacing.sm,
  },
});

