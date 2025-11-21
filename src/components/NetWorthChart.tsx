import React from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import { VictoryChart, VictoryLine, VictoryTheme, VictoryAxis, VictoryArea, VictoryScatter, VictoryTooltip, VictoryVoronoiContainer } from 'victory-native';
import { useTheme } from 'react-native-paper';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { spacing, typography } from '../theme';

interface NetWorthChartProps {
    data: { date: Date; value: number }[];
    period: '1M' | '3M' | '6M' | '1Y' | 'ALL';
}

export const NetWorthChart: React.FC<NetWorthChartProps> = ({ data, period }) => {
    const theme = useTheme();
    const width = Dimensions.get('window').width - spacing.md * 2;
    const height = 220;

    // Ensure data is sorted
    const sortedData = [...data].sort((a, b) => a.date.getTime() - b.date.getTime());

    const getTickFormat = (x: any) => {
        const date = new Date(x);
        if (period === '1M') {
            return format(date, 'dd/MM', { locale: ptBR });
        }
        return format(date, 'MMM', { locale: ptBR });
    };

    return (
        <View style={styles.container}>
            <VictoryChart
                width={width}
                height={height}
                padding={{ top: 20, bottom: 40, left: 50, right: 20 }}
                containerComponent={
                    <VictoryVoronoiContainer
                        voronoiDimension="x"
                        voronoiBlacklist={['area']}
                        labels={({ datum }) => `R$ ${datum.value.toFixed(2)}`}
                        labelComponent={
                            <VictoryTooltip
                                renderInPortal={false}
                                constrainToVisibleArea
                                flyoutStyle={{
                                    fill: theme.colors.surface,
                                    stroke: theme.colors.outline,
                                    strokeWidth: 1,
                                    borderRadius: 5
                                }}
                                style={{
                                    fill: theme.colors.onSurface,
                                    fontSize: 12,
                                    fontWeight: 'bold'
                                }}
                            />
                        }
                    />
                }
            >
                <VictoryAxis
                    tickFormat={getTickFormat}
                    // Reduce tick count for 1M to avoid crowding if daily
                    tickCount={period === '1M' ? 5 : undefined}
                    style={{
                        axis: { stroke: theme.colors.outline },
                        tickLabels: { fill: theme.colors.onSurfaceVariant, fontSize: 10, padding: 5 },
                        grid: { stroke: 'transparent' }
                    }}
                />
                <VictoryAxis
                    dependentAxis
                    tickFormat={(y) => `R$${(y / 1000).toFixed(0)}k`}
                    style={{
                        axis: { stroke: 'transparent' },
                        tickLabels: { fill: theme.colors.onSurfaceVariant, fontSize: 10, padding: 5 },
                        grid: { stroke: theme.colors.surfaceVariant, strokeDasharray: '4, 4' }
                    }}
                />
                <VictoryArea
                    name="area"
                    data={sortedData}
                    x="date"
                    y="value"
                    style={{
                        data: {
                            fill: theme.colors.primary + '20', // 20% opacity
                            stroke: theme.colors.primary,
                            strokeWidth: 2
                        }
                    }}
                    interpolation="monotoneX"
                />
                <VictoryScatter
                    name="scatter"
                    data={sortedData}
                    x="date"
                    y="value"
                    size={5}
                    style={{
                        data: {
                            fill: theme.colors.surface,
                            stroke: theme.colors.primary,
                            strokeWidth: 2
                        }
                    }}
                />
            </VictoryChart>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        alignItems: 'center',
        justifyContent: 'center',
        marginLeft: -spacing.md, // Compensate for chart padding
    },
});
