import React, { useMemo, useState } from 'react';
// Force rebuild
import { View, Dimensions, StyleSheet, PanResponder, GestureResponderEvent } from 'react-native';
import { Text, useTheme } from 'react-native-paper';
import Svg, { Path, Line, Text as SvgText, Circle, Defs, LinearGradient, Stop } from 'react-native-svg';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { spacing } from '../theme';

interface NetWorthData {
    date: Date;
    value: number;
}

interface NetWorthChartProps {
    data: NetWorthData[];
    period: string;
    hideValues?: boolean;
}

export const NetWorthChart = ({ data, period, hideValues = false }: NetWorthChartProps) => {
    const theme = useTheme();
    const screenWidth = Dimensions.get('window').width;
    const chartHeight = 250;
    const padding = { top: 40, bottom: 40, left: 20, right: 20 };
    const chartWidth = screenWidth - (spacing.md * 2);
    const plotWidth = chartWidth - padding.left - padding.right;
    const plotHeight = chartHeight - padding.top - padding.bottom;

    const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

    // 1. Data Validation & Preparation
    const validData = useMemo(() => {
        if (!data || data.length === 0) return [];
        return data
            .filter(d => !isNaN(d.value) && d.date instanceof Date && !isNaN(d.date.getTime()))
            .sort((a, b) => a.date.getTime() - b.date.getTime());
    }, [data]);

    // 2. Scaling Logic
    const xMin = validData.length > 0 ? validData[0].date.getTime() : 0;
    const xMax = validData.length > 0 ? validData[validData.length - 1].date.getTime() : 0;
    const yMin = validData.length > 0 ? Math.min(...validData.map(d => d.value)) : 0;
    const yMax = validData.length > 0 ? Math.max(...validData.map(d => d.value)) : 0;

    const yRange = yMax - yMin || 1;
    const yPadding = yRange * 0.1;
    const effectiveYMin = yMin - yPadding;
    const effectiveYMax = yMax + yPadding;

    const scaleX = (dateMs: number) => {
        if (xMax === xMin) return padding.left;
        return padding.left + ((dateMs - xMin) / (xMax - xMin)) * plotWidth;
    };

    const scaleY = (value: number) => {
        return chartHeight - padding.bottom - ((value - effectiveYMin) / (effectiveYMax - effectiveYMin)) * plotHeight;
    };

    const inverseScaleX = (x: number) => {
        const relativeX = x - padding.left;
        const clampedX = Math.max(0, Math.min(relativeX, plotWidth));
        const ratio = clampedX / plotWidth;
        return xMin + ratio * (xMax - xMin);
    };

    // 3. Interaction Handler (PanResponder)
    const panResponder = useMemo(() =>
        PanResponder.create({
            onStartShouldSetPanResponder: () => true,
            onStartShouldSetPanResponderCapture: () => true,
            onMoveShouldSetPanResponder: () => true,
            onMoveShouldSetPanResponderCapture: () => true,
            onPanResponderGrant: (evt) => {
                const { locationX } = evt.nativeEvent;
                const touchedTime = inverseScaleX(locationX);

                let closestIndex = 0;
                let minDiff = Infinity;

                validData.forEach((d, i) => {
                    const diff = Math.abs(d.date.getTime() - touchedTime);
                    if (diff < minDiff) {
                        minDiff = diff;
                        closestIndex = i;
                    }
                });

                setSelectedIndex(closestIndex);
            },
            onPanResponderMove: (evt) => {
                const { locationX } = evt.nativeEvent;
                const touchedTime = inverseScaleX(locationX);

                let closestIndex = 0;
                let minDiff = Infinity;

                validData.forEach((d, i) => {
                    const diff = Math.abs(d.date.getTime() - touchedTime);
                    if (diff < minDiff) {
                        minDiff = diff;
                        closestIndex = i;
                    }
                });

                setSelectedIndex(closestIndex);
            },
            onPanResponderRelease: () => {
                // Optional: clear selection
            },
        }),
        [validData] // Recreate when data changes to avoid stale closures
    );

    if (validData.length < 2) {
        return (
            <View
                style={[styles.container, { height: chartHeight, justifyContent: 'center', alignItems: 'center' }]}
                accessible={true}
                accessibilityLabel="Gráfico indisponível. Dados insuficientes."
            >
                <Text style={{ color: theme.colors.onSurfaceVariant }}>Dados insuficientes para o gráfico</Text>
            </View>
        );
    }

    // 4. Path Generation
    const generateLinePath = () => {
        return validData.map((d, i) => {
            const x = scaleX(d.date.getTime());
            const y = scaleY(d.value);
            return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
        }).join(' ');
    };

    const generateAreaPath = () => {
        const linePath = generateLinePath();
        const firstX = scaleX(validData[0].date.getTime());
        const lastX = scaleX(validData[validData.length - 1].date.getTime());
        const bottomY = chartHeight - padding.bottom;
        return `${linePath} L ${lastX} ${bottomY} L ${firstX} ${bottomY} Z`;
    };

    const linePath = generateLinePath();
    const areaPath = generateAreaPath();

    // 5. Formatting & Ticks
    const formatYLabel = (val: number) => hideValues ? '••••' : `R$${(val / 1000).toFixed(1)}k`;

    const formatXLabel = (date: Date) => {
        if (period === '1D') return format(date, 'HH:mm', { locale: ptBR });
        if (period === '7D') return format(date, 'dd/MM', { locale: ptBR });
        return format(date, 'dd/MM', { locale: ptBR });
    };

    const formatTooltipDate = (date: Date) => {
        if (period === '1D') return format(date, "dd 'de' MMMM, HH:mm", { locale: ptBR });
        return format(date, "dd 'de' MMMM", { locale: ptBR });
    };
    const formatTooltipValue = (val: number) => hideValues ? 'R$ ••••••' : `R$ ${val.toFixed(2)}`;

    // Generate fixed X-axis ticks (3 ticks: start, middle, end)
    const xTicks = [
        new Date(xMin),
        new Date(xMin + (xMax - xMin) / 2),
        new Date(xMax)
    ];

    // Accessibility
    const startValue = validData[0].value;
    const endValue = validData[validData.length - 1].value;
    const trend = endValue >= startValue ? "aumento" : "queda";
    const accessibilityLabel = `Gráfico de crescimento patrimonial. Mostrando ${trend} de ${formatYLabel(startValue)} para ${formatYLabel(endValue)} no período selecionado.`;

    return (
        <View
            style={styles.container}
            accessible={true}
            accessibilityLabel={accessibilityLabel}
            accessibilityHint="Deslize o dedo sobre o gráfico para ver detalhes de data e valor."
            {...panResponder.panHandlers}
        >
            <Svg width={chartWidth} height={chartHeight}>
                <Defs>
                    <LinearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                        <Stop offset="0" stopColor={theme.colors.primary} stopOpacity="0.2" />
                        <Stop offset="1" stopColor={theme.colors.primary} stopOpacity="0.0" />
                    </LinearGradient>
                </Defs>

                {/* Grid Lines (5 lines) */}
                {[0, 1, 2, 3, 4].map((i) => {
                    const val = effectiveYMin + ((effectiveYMax - effectiveYMin) / 4) * i;
                    return (
                        <React.Fragment key={i}>
                            <Line
                                x1={padding.left}
                                y1={scaleY(val)}
                                x2={chartWidth - padding.right}
                                y2={scaleY(val)}
                                stroke={theme.colors.outline}
                                strokeDasharray="4 4"
                                strokeWidth="0.5"
                                opacity="0.3"
                            />
                            <SvgText
                                x={padding.left}
                                y={scaleY(val) - 4}
                                fontSize="10"
                                fill={theme.colors.onSurfaceVariant}
                            >
                                {formatYLabel(val)}
                            </SvgText>
                        </React.Fragment>
                    );
                })}

                {/* Area */}
                <Path
                    d={areaPath}
                    fill="url(#chartGradient)"
                />

                {/* Line */}
                <Path
                    d={linePath}
                    stroke={theme.colors.primary}
                    strokeWidth="2.5"
                    fill="none"
                />

                {/* X Axis Labels (Fixed Ticks) */}
                {xTicks.map((date, i) => (
                    <SvgText
                        key={i}
                        x={scaleX(date.getTime())}
                        y={chartHeight - 10}
                        fontSize="10"
                        fill={theme.colors.onSurfaceVariant}
                        textAnchor="middle"
                    >
                        {formatXLabel(date)}
                    </SvgText>
                ))}

                {/* Selected Point Indicator */}
                {selectedIndex !== null && validData[selectedIndex] && (
                    <React.Fragment>
                        <Line
                            x1={scaleX(validData[selectedIndex].date.getTime())}
                            y1={padding.top}
                            x2={scaleX(validData[selectedIndex].date.getTime())}
                            y2={chartHeight - padding.bottom}
                            stroke={theme.colors.onSurface}
                            strokeWidth="1"
                            strokeDasharray="2 2"
                            opacity="0.5"
                        />
                        <Circle
                            cx={scaleX(validData[selectedIndex].date.getTime())}
                            cy={scaleY(validData[selectedIndex].value)}
                            r={6}
                            fill={theme.colors.background}
                            stroke={theme.colors.primary}
                            strokeWidth={2}
                        />
                        {/* Tooltip Text */}
                        <SvgText
                            x={chartWidth / 2}
                            y={20}
                            fontSize="14"
                            fontWeight="bold"
                            fill={theme.colors.onSurface}
                            textAnchor="middle"
                        >
                            {formatTooltipValue(validData[selectedIndex].value)}
                        </SvgText>
                        <SvgText
                            x={chartWidth / 2}
                            y={36}
                            fontSize="12"
                            fill={theme.colors.onSurfaceVariant}
                            textAnchor="middle"
                        >
                            {formatTooltipDate(validData[selectedIndex].date)}
                        </SvgText>
                    </React.Fragment>
                )}

                {/* Always Visible Last Point (Current Value) */}
                {validData.length > 0 && (
                    <Circle
                        cx={scaleX(validData[validData.length - 1].date.getTime())}
                        cy={scaleY(validData[validData.length - 1].value)}
                        r={4}
                        fill={theme.colors.primary}
                        stroke={theme.colors.background}
                        strokeWidth={1}
                    />
                )}
            </Svg>
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
