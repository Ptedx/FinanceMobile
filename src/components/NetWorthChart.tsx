import React from 'react';
import { View, Dimensions, StyleSheet } from 'react-native';
import { Text, useTheme } from 'react-native-paper';
import { VictoryChart, VictoryLine, VictoryArea, VictoryAxis, VictoryTheme } from 'victory-native';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { spacing, typography } from '../theme';

interface NetWorthData {
    date: Date;
    value: number;
}

interface NetWorthChartProps {
    data: NetWorthData[];
    period: string;
}

export const NetWorthChart = ({ data, period }: NetWorthChartProps) => {
    const theme = useTheme();
    const width = Dimensions.get('window').width - spacing.xl * 2;
    const height = 220;

    if (!data || data.length === 0) {
        return (
            <View style={[styles.container, { height, justifyContent: 'center', alignItems: 'center' }]}>
                <Text style={{ color: theme.colors.onSurfaceVariant }}>Sem dados suficientes para o gráfico</Text>
            </View>
        );
    }

    // Ensure data is sorted and valid
    const chartData = data
        .filter(d => !isNaN(d.value) && d.date instanceof Date && !isNaN(d.date.getTime()))
        .sort((a, b) => a.date.getTime() - b.date.getTime());

    if (chartData.length < 2) {
        return (
            <View style={[styles.container, { height, justifyContent: 'center', alignItems: 'center' }]}>
                <Text style={{ color: theme.colors.onSurfaceVariant }}>Dados insuficientes para exibir o gráfico</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <VictoryChart
                width={width}
                height={height}
                theme={VictoryTheme.material}
                padding={{ top: 20, bottom: 40, left: 50, right: 20 }}
            >
                <VictoryAxis
                    tickFormat={(t) => {
                        const date = new Date(t);
                        if (period === '1D' || period === '7D') {
                            return format(date, 'dd/MM', { locale: ptBR });
                        }
                        return format(date, 'MMM', { locale: ptBR });
                    }}
                    style={{
                        axis: { stroke: theme.colors.outline },
                        tickLabels: { fill: theme.colors.onSurfaceVariant, fontSize: 10, padding: 5 },
                        grid: { stroke: 'transparent' }
                    }}
                />
                <VictoryAxis
                    dependentAxis
                    tickFormat={(t) => `R$${(t / 1000).toFixed(1)}k`}
                    style={{
                        axis: { stroke: 'transparent' },
                        tickLabels: { fill: theme.colors.onSurfaceVariant, fontSize: 10, padding: 5 },
                        grid: { stroke: theme.colors.outline, strokeDasharray: '4, 4', strokeWidth: 0.5 }
                    }}
                />
                <VictoryArea
                    data={chartData}
                    x="date"
                    y="value"
                    style={{
                        data: {
                            fill: theme.colors.primary,
                            fillOpacity: 0.1,
                            stroke: 'none'
                        }
                    }}
                    interpolation="monotoneX"
                />
                <VictoryLine
                    data={chartData}
                    x="date"
                    y="value"
                    style={{
                        data: {
                            stroke: theme.colors.primary,
                            strokeWidth: 2
                        }
                    }}
                    interpolation="monotoneX"
                />
            </VictoryChart>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        alignItems: 'center',
        justifyContent: 'center',
        marginVertical: spacing.md,
    },
});
