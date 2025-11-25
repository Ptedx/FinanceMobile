import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, KeyboardAvoidingView, Platform, Alert, TouchableOpacity } from 'react-native';
import { TextInput, Button, useTheme, IconButton } from 'react-native-paper';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Card } from '../components/Card';
import { CreditCardTransactions } from '../components/CreditCardTransactions';
import { useFinanceStore } from '../store/financeStore';
import { spacing, typography } from '../theme';
import { formatCurrency, parseCurrency } from '../utils/formatters';
import { getInvoiceDates, isExpenseInInvoice } from '../utils/creditCardUtils';

const creditCardSchema = z.object({
    name: z.string().min(1, 'Nome é obrigatório'),
    closingDay: z.string()
        .min(1, 'Dia de fechamento é obrigatório')
        .refine(val => {
            const num = parseInt(val);
            return !isNaN(num) && num >= 1 && num <= 31;
        }, 'Dia deve ser entre 1 e 31'),
    dueDay: z.string()
        .min(1, 'Dia de vencimento é obrigatório')
        .refine(val => {
            const num = parseInt(val);
            return !isNaN(num) && num >= 1 && num <= 31;
        }, 'Dia deve ser entre 1 e 31'),
    limit: z.string().min(1, 'Limite é obrigatório'),
    last4Digits: z.string()
        .length(4, 'Deve ter 4 dígitos')
        .regex(/^\d+$/, 'Apenas números'),
});

type CreditCardFormData = z.infer<typeof creditCardSchema>;

export const AddCreditCardScreen = ({ navigation, route }: any) => {
    const theme = useTheme();
    const { addCreditCard, updateCreditCard, deleteCreditCard, expenses, invoicePayments, payInvoice, cancelInvoicePayment } = useFinanceStore();
    const [showClosingDatePicker, setShowClosingDatePicker] = useState(false);
    const [showDueDatePicker, setShowDueDatePicker] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    const cardToEdit = route.params?.card;
    const isEditing = !!cardToEdit;

    // Invoice Calculation Logic
    const getInvoiceData = () => {
        if (!cardToEdit) return { total: 0, status: 'none', payment: null };

        const { startDate, endDate } = getInvoiceDates(cardToEdit.closingDay);

        const currentExpenses = expenses.filter(e =>
            e.creditCardId === cardToEdit.id &&
            isExpenseInInvoice(new Date(e.date), startDate, endDate)
        );

        const totalExpenses = currentExpenses.reduce((sum, e) => sum + e.value, 0);

        // Find payments made in this invoice period (or covering it)
        // For simplicity, let's look for payments made within the invoice dates OR slightly after (for closed invoices)
        // But since we don't link payments to invoices, let's just look for payments in the current month/cycle.
        // Actually, if I pay today, the payment date is today.
        // If today is in the cycle, it counts.
        // Let's filter payments that fall within the calculated start/end dates.

        const currentPayments = invoicePayments.filter(p =>
            p.creditCardId === cardToEdit.id &&
            isExpenseInInvoice(new Date(p.date), startDate, endDate)
        );

        const totalPaid = currentPayments.reduce((sum, p) => sum + p.amount, 0);
        const remaining = totalExpenses - totalPaid;

        // We assume the last payment is the one to cancel if needed, or we list them.
        // For the "Cancel Payment" button, we'll target the most recent payment in this period.
        const lastPayment = currentPayments.length > 0 ? currentPayments[currentPayments.length - 1] : null;

        return {
            total: totalExpenses,
            paid: totalPaid,
            remaining: Math.max(0, remaining),
            status: remaining <= 0.01 && totalExpenses > 0 ? 'paid' : (totalExpenses === 0 ? 'empty' : 'open'),
            lastPayment
        };
    };

    const invoiceData = getInvoiceData();

    const handlePayInvoice = () => {
        Alert.alert(
            "Pagar Fatura",
            `Deseja confirmar o pagamento da fatura no valor de ${formatCurrency(invoiceData.remaining)}?`,
            [
                { text: "Cancelar", style: "cancel" },
                {
                    text: "Confirmar",
                    onPress: async () => {
                        try {
                            setIsLoading(true);
                            await payInvoice(cardToEdit.id, invoiceData.remaining, new Date().toISOString());
                            Alert.alert("Sucesso", "Pagamento realizado com sucesso!");
                        } catch (error) {
                            Alert.alert("Erro", "Não foi possível realizar o pagamento.");
                        } finally {
                            setIsLoading(false);
                        }
                    }
                }
            ]
        );
    };

    const handleCancelPayment = () => {
        if (!invoiceData.lastPayment) return;

        Alert.alert(
            "Cancelar Pagamento",
            "Deseja cancelar o último pagamento realizado?",
            [
                { text: "Não", style: "cancel" },
                {
                    text: "Sim, Cancelar",
                    style: "destructive",
                    onPress: async () => {
                        try {
                            setIsLoading(true);
                            await cancelInvoicePayment(invoiceData.lastPayment!.id);
                            Alert.alert("Sucesso", "Pagamento cancelado.");
                        } catch (error) {
                            Alert.alert("Erro", "Não foi possível cancelar o pagamento.");
                        } finally {
                            setIsLoading(false);
                        }
                    }
                }
            ]
        );
    };

    const { control, handleSubmit, setValue, watch, formState: { errors } } = useForm<CreditCardFormData>({
        resolver: zodResolver(creditCardSchema),
        defaultValues: {
            name: cardToEdit?.name || '',
            closingDay: cardToEdit?.closingDay?.toString() || '',
            dueDay: cardToEdit?.dueDay?.toString() || '',
            limit: cardToEdit ? formatCurrency(cardToEdit.limit) : '',
            last4Digits: cardToEdit?.last4Digits || '',
        },
    });

    const handleDelete = () => {
        Alert.alert(
            "Excluir Cartão",
            "Tem certeza que deseja excluir este cartão? Os gastos associados não serão excluídos, apenas desvinculados.",
            [
                { text: "Cancelar", style: "cancel" },
                {
                    text: "Excluir",
                    style: "destructive",
                    onPress: async () => {
                        try {
                            if (cardToEdit) {
                                await deleteCreditCard(cardToEdit.id);
                                navigation.goBack();
                            }
                        } catch (error) {
                            Alert.alert("Erro", "Não foi possível excluir o cartão.");
                        }
                    }
                }
            ]
        );
    };

    const onSubmit = async (data: CreditCardFormData) => {
        setIsLoading(true);
        const cardData = {
            name: data.name,
            closingDay: parseInt(data.closingDay),
            dueDay: parseInt(data.dueDay),
            limit: parseCurrency(data.limit),
            last4Digits: data.last4Digits,
        };

        try {
            if (isEditing) {
                await updateCreditCard(cardToEdit.id, cardData);
            } else {
                await addCreditCard(cardData);
            }
            navigation.goBack();
        } catch (error) {
            console.error(error);
            Alert.alert("Erro", "Não foi possível salvar o cartão.");
        } finally {
            setIsLoading(false);
        }
    };

    React.useLayoutEffect(() => {
        navigation.setOptions({
            title: isEditing ? 'Editar Cartão' : 'Adicionar Cartão',
            headerRight: () => isEditing ? (
                <View style={{ flexDirection: 'row' }}>
                    <IconButton
                        icon="delete"
                        iconColor={theme.colors.error}
                        onPress={handleDelete}
                    />
                    <IconButton
                        icon="check"
                        iconColor={theme.colors.primary}
                        onPress={handleSubmit(onSubmit)}
                    />
                </View>
            ) : null,
        });
    }, [navigation, isEditing, theme.colors, handleSubmit]);

    const closingDayValue = watch('closingDay');
    const dueDayValue = watch('dueDay');

    const onClosingDateChange = (event: any, selectedDate?: Date) => {
        setShowClosingDatePicker(Platform.OS === 'ios');
        if (selectedDate) {
            setValue('closingDay', selectedDate.getDate().toString(), { shouldValidate: true });
        }
    };

    const onDueDateChange = (event: any, selectedDate?: Date) => {
        setShowDueDatePicker(Platform.OS === 'ios');
        if (selectedDate) {
            setValue('dueDay', selectedDate.getDate().toString(), { shouldValidate: true });
        }
    };

    // Helper to get a Date object from day string for the picker
    const getDateFromDayString = (dayStr: string) => {
        const date = new Date();
        const day = parseInt(dayStr);
        if (!isNaN(day) && day >= 1 && day <= 31) {
            date.setDate(day);
        }
        return date;
    };

    const styles = createStyles(theme);

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={{ flex: 1 }}
            keyboardVerticalOffset={Platform.OS === 'ios' ? 64 : 0}
        >
            <ScrollView style={styles.container} contentContainerStyle={styles.content}>
                <Card style={styles.card}>
                    <Text style={styles.sectionTitle}>Detalhes do Cartão</Text>

                    <Controller
                        control={control}
                        name="name"
                        render={({ field: { onChange, value } }) => (
                            <TextInput
                                mode="outlined"
                                label="Nome do Cartão"
                                placeholder="Ex: Nubank, Visa Platinum"
                                value={value}
                                onChangeText={onChange}
                                error={!!errors.name}
                                style={styles.input}
                            />
                        )}
                    />
                    {errors.name && <Text style={styles.errorText}>{errors.name.message}</Text>}

                    <View style={styles.row}>
                        <View style={styles.halfInput}>
                            <TouchableOpacity onPress={() => setShowClosingDatePicker(true)}>
                                <View pointerEvents="none">
                                    <TextInput
                                        mode="outlined"
                                        label="Dia Fechamento"
                                        placeholder="1-31"
                                        value={closingDayValue ? `Dia ${closingDayValue}` : ''}
                                        editable={false}
                                        error={!!errors.closingDay}
                                        style={styles.input}
                                        right={<TextInput.Icon icon="calendar" />}
                                    />
                                </View>
                            </TouchableOpacity>
                            {errors.closingDay && <Text style={styles.errorText}>{errors.closingDay.message}</Text>}

                            {showClosingDatePicker && (
                                <DateTimePicker
                                    testID="closingDatePicker"
                                    value={getDateFromDayString(closingDayValue)}
                                    mode="date"
                                    is24Hour={true}
                                    display="default"
                                    onChange={onClosingDateChange}
                                />
                            )}
                        </View>

                        <View style={styles.halfInput}>
                            <TouchableOpacity onPress={() => setShowDueDatePicker(true)}>
                                <View pointerEvents="none">
                                    <TextInput
                                        mode="outlined"
                                        label="Dia Vencimento"
                                        placeholder="1-31"
                                        value={dueDayValue ? `Dia ${dueDayValue}` : ''}
                                        editable={false}
                                        error={!!errors.dueDay}
                                        style={styles.input}
                                        right={<TextInput.Icon icon="calendar" />}
                                    />
                                </View>
                            </TouchableOpacity>
                            {errors.dueDay && <Text style={styles.errorText}>{errors.dueDay.message}</Text>}

                            {showDueDatePicker && (
                                <DateTimePicker
                                    testID="dueDatePicker"
                                    value={getDateFromDayString(dueDayValue)}
                                    mode="date"
                                    is24Hour={true}
                                    display="default"
                                    onChange={onDueDateChange}
                                />
                            )}
                        </View>
                    </View>

                    <Controller
                        control={control}
                        name="limit"
                        render={({ field: { onChange, value } }) => (
                            <TextInput
                                mode="outlined"
                                label="Limite"
                                value={value}
                                onChangeText={(text) => {
                                    const numericValue = parseCurrency(text);
                                    onChange(formatCurrency(numericValue));
                                }}
                                keyboardType="numeric"
                                error={!!errors.limit}
                                style={styles.input}
                            />
                        )}
                    />
                    {errors.limit && <Text style={styles.errorText}>{errors.limit.message}</Text>}

                    <Controller
                        control={control}
                        name="last4Digits"
                        render={({ field: { onChange, value } }) => (
                            <TextInput
                                mode="outlined"
                                label="Últimos 4 dígitos"
                                placeholder="Ex: 1234"
                                value={value}
                                onChangeText={(text) => onChange(text.replace(/[^0-9]/g, '').slice(0, 4))}
                                keyboardType="numeric"
                                maxLength={4}
                                error={!!errors.last4Digits}
                                style={styles.input}
                            />
                        )}
                    />
                    {errors.last4Digits && <Text style={styles.errorText}>{errors.last4Digits.message}</Text>}
                </Card>

                {isEditing && (
                    <Card style={styles.card}>
                        <Text style={styles.sectionTitle}>Fatura Atual</Text>
                        <View style={styles.invoiceRow}>
                            <Text style={styles.invoiceLabel}>Total da Fatura:</Text>
                            <Text style={styles.invoiceValue}>{formatCurrency(invoiceData.total)}</Text>
                        </View>
                        {invoiceData.paid > 0 && (
                            <View style={styles.invoiceRow}>
                                <Text style={styles.invoiceLabel}>Pago:</Text>
                                <Text style={[styles.invoiceValue, { color: theme.colors.primary }]}>-{formatCurrency(invoiceData.paid)}</Text>
                            </View>
                        )}
                        <View style={[styles.invoiceRow, { marginTop: spacing.xs }]}>
                            <Text style={[styles.invoiceLabel, { fontWeight: 'bold' }]}>Restante:</Text>
                            <Text style={[styles.invoiceValue, { fontWeight: 'bold', color: invoiceData.remaining > 0 ? theme.colors.error : theme.colors.primary }]}>
                                {formatCurrency(invoiceData.remaining)}
                            </Text>
                        </View>

                        <View style={styles.actionButtons}>
                            {invoiceData.remaining > 0 && (
                                <Button
                                    mode="contained"
                                    onPress={handlePayInvoice}
                                    style={styles.payButton}
                                    icon="credit-card-check"
                                >
                                    Pagar Fatura
                                </Button>
                            )}
                            {invoiceData.paid > 0 && (
                                <Button
                                    mode="outlined"
                                    onPress={handleCancelPayment}
                                    style={styles.cancelButton}
                                    textColor={theme.colors.error}
                                >
                                    Cancelar Pagamento
                                </Button>
                            )}
                        </View>
                    </Card>
                )}

                {!isEditing && (
                    <Button
                        mode="contained"
                        onPress={handleSubmit(onSubmit)}
                        style={styles.submitButton}
                        contentStyle={styles.submitButtonContent}
                        loading={isLoading}
                        disabled={isLoading}
                    >
                        Adicionar Cartão
                    </Button>
                )}

                {isEditing && cardToEdit && (
                    <CreditCardTransactions cardId={cardToEdit.id} />
                )}
            </ScrollView>
        </KeyboardAvoidingView>
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
    row: {
        flexDirection: 'row',
        gap: spacing.sm,
    },
    halfInput: {
        flex: 1,
    },
    errorText: {
        ...typography.caption,
        color: theme.colors.error,
        marginTop: -spacing.xs,
        marginBottom: spacing.sm,
    },
    submitButton: {
        marginTop: spacing.md,
    },
    submitButtonContent: {
        paddingVertical: spacing.sm,
    },
    invoiceRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: spacing.xs,
    },
    invoiceLabel: {
        ...typography.body,
        color: theme.colors.onSurfaceVariant,
    },
    invoiceValue: {
        ...typography.body,
        color: theme.colors.onSurface,
        fontWeight: '500',
    },
    actionButtons: {
        marginTop: spacing.md,
        gap: spacing.sm,
    },
    payButton: {
        backgroundColor: theme.colors.primary,
    },
    cancelButton: {
        borderColor: theme.colors.error,
    },
});
