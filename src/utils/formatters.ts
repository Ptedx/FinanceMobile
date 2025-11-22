export const formatCurrency = (value: number): string => {
    return value.toLocaleString('pt-BR', {
        style: 'currency',
        currency: 'BRL',
    });
};

export const parseCurrency = (value: string): number => {
    return Number(value.replace(/\D/g, '')) / 100;
};
