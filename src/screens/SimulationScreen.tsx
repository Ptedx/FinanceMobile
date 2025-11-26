import React, { useState, useMemo } from 'react';
import { View, ScrollView, StyleSheet, Dimensions, TouchableOpacity, PanResponder } from 'react-native';
import { Text, Card, useTheme, IconButton, TextInput, Divider, Menu } from 'react-native-paper';
import Svg, { Path, Line, Text as SvgText, Circle, Defs, LinearGradient, Stop } from 'react-native-svg';
import { useFinanceEngine } from '../hooks/useFinanceEngine';
import { useNavigation } from '@react-navigation/native';
import { formatCurrency, parseCurrency } from '../utils/formatters';

export const SimulationScreen = () => {
    const theme = useTheme();
    const navigation = useNavigation();
    const { dashboardData } = useFinanceEngine();

    // Simulation State
    const [monthlyContributionStr, setMonthlyContributionStr] = useState('R$ 0,00');
    const [monthlyContribution, setMonthlyContribution] = useState(0);

    const [simulationDuration, setSimulationDuration] = useState('5');
    const [durationUnit, setDurationUnit] = useState<'years' | 'months'>('years');

    const [annualReturn, setAnnualReturn] = useState('10'); // Default 10
    const [returnRatePeriod, setReturnRatePeriod] = useState<'yearly' | 'monthly'>('yearly');

    const [durationMenuVisible, setDurationMenuVisible] = useState(false);
    const [returnRateMenuVisible, setReturnRateMenuVisible] = useState(false);

    // Chart Interaction State
    const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

    // Derived Data
    const currentNetWorth = dashboardData.netWorth;

    // Simulated savings is EXACTLY what the user inputs
    const simulatedMonthlySavings = monthlyContribution;

    // Projection Calculation
    const projectionData = useMemo(() => {
        const dataSimulated = [];
        const returnRate = parseFloat(annualReturn.replace(',', '.')) || 0;

        // Calculate monthly rate based on selection
        let monthlyRate = 0;
        if (returnRatePeriod === 'yearly') {
            monthlyRate = Math.pow(1 + returnRate / 100, 1 / 12) - 1;
        } else {
            monthlyRate = returnRate / 100;
        }

        let balanceSimulated = currentNetWorth;

        const durationVal = parseInt(simulationDuration) || 0;
        const totalMonths = durationUnit === 'years' ? durationVal * 12 : durationVal;

        // Safety cap
        const safeTotalMonths = Math.min(totalMonths, 1200);

        for (let month = 0; month <= safeTotalMonths; month++) {
            // Add data point logic
            let step = 1;
            if (safeTotalMonths > 60) step = 6;
            else if (safeTotalMonths > 24) step = 3;

            if (month % step === 0 || month === safeTotalMonths) {
                const xValue = durationUnit === 'years' ? month / 12 : month;
                dataSimulated.push({ x: xValue, y: balanceSimulated, monthIndex: month });
            }

            // Compound Interest + Monthly Contribution
            balanceSimulated = balanceSimulated * (1 + monthlyRate) + simulatedMonthlySavings;
        }

        return { dataSimulated, finalSimulated: balanceSimulated };
    }, [currentNetWorth, simulatedMonthlySavings, annualReturn, returnRatePeriod, simulationDuration, durationUnit]);

    const timeToMillion = useMemo(() => {
        // Only return infinity if there is NO growth potential (no savings AND no return rate)
        // OR if the user is already at 1 million
        const returnRate = parseFloat(annualReturn.replace(',', '.')) || 0;
        if (currentNetWorth < 1000000 && simulatedMonthlySavings <= 0 && returnRate <= 0) return Infinity;
        if (currentNetWorth >= 1000000) return 0;

        const target = 1000000;

        let monthlyRate = 0;
        if (returnRatePeriod === 'yearly') {
            monthlyRate = Math.pow(1 + returnRate / 100, 1 / 12) - 1;
        } else {
            monthlyRate = returnRate / 100;
        }

        let balance = currentNetWorth;
        let months = 0;
        // Safety break at 100 years (1200 months)
        while (balance < target && months < 1200) {
            balance = balance * (1 + monthlyRate) + simulatedMonthlySavings;
            months++;
        }

        return months / 12;
    }, [currentNetWorth, simulatedMonthlySavings, annualReturn, returnRatePeriod]);

    // --- Chart Logic ---
    const screenWidth = Dimensions.get('window').width;
    const chartHeight = 250;
    const padding = { top: 40, bottom: 40, left: 50, right: 30 }; // Increased top padding for tooltip
    const chartWidth = screenWidth - 64; // Card padding + margin
    const plotWidth = chartWidth - padding.left - padding.right;
    const plotHeight = chartHeight - padding.top - padding.bottom;

    const allDataPoints = projectionData.dataSimulated;
    const xMin = 0;
    const xMax = allDataPoints.length > 0 ? Math.max(...allDataPoints.map(d => d.x)) : 1;
    const yMin = allDataPoints.length > 0 ? Math.min(...allDataPoints.map(d => d.y)) : 0;
    const yMax = allDataPoints.length > 0 ? Math.max(...allDataPoints.map(d => d.y)) : 1000;

    // Add some padding to Y axis
    const effectiveYMax = yMax * 1.1;

    const scaleX = (x: number) => {
        return padding.left + (x / xMax) * plotWidth;
    };

    const scaleY = (y: number) => {
        return chartHeight - padding.bottom - ((y - yMin) / (effectiveYMax - yMin)) * plotHeight;
    };

    const inverseScaleX = (screenX: number) => {
        const relativeX = screenX - padding.left;
        const clampedX = Math.max(0, Math.min(relativeX, plotWidth));
        const ratio = clampedX / plotWidth;
        return ratio * xMax;
    };

    const generatePath = (data: { x: number, y: number }[]) => {
        if (data.length === 0) return "";
        return data.map((d, i) => {
            const x = scaleX(d.x);
            const y = scaleY(d.y);
            return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
        }).join(' ');
    };

    const generateAreaPath = (data: { x: number, y: number }[]) => {
        if (data.length === 0) return "";
        const lineStr = generatePath(data);
        const firstX = scaleX(data[0].x);
        const lastX = scaleX(data[data.length - 1].x);
        const bottomY = chartHeight - padding.bottom;
        return `${lineStr} L ${lastX} ${bottomY} L ${firstX} ${bottomY} Z`;
    };

    const simulatedPath = generatePath(projectionData.dataSimulated);
    const areaPath = generateAreaPath(projectionData.dataSimulated);

    // Generate ticks
    const yTicks = [0, 0.25, 0.5, 0.75, 1].map(p => yMin + (effectiveYMax - yMin) * p);
    const xTicks = [0, 0.25, 0.5, 0.75, 1].map(p => xMax * p);

    // PanResponder for Interaction
    const panResponder = useMemo(() =>
        PanResponder.create({
            onStartShouldSetPanResponder: () => true,
            onStartShouldSetPanResponderCapture: () => true,
            onMoveShouldSetPanResponder: () => true,
            onMoveShouldSetPanResponderCapture: () => true,
            onPanResponderGrant: (evt) => {
                const { locationX } = evt.nativeEvent;
                const touchedX = inverseScaleX(locationX);
                let closestIndex = 0;
                let minDiff = Infinity;
                projectionData.dataSimulated.forEach((d, i) => {
                    const diff = Math.abs(d.x - touchedX);
                    if (diff < minDiff) {
                        minDiff = diff;
                        closestIndex = i;
                    }
                });
                setSelectedIndex(closestIndex);
            },
            onPanResponderMove: (evt) => {
                const { locationX } = evt.nativeEvent;
                const touchedX = inverseScaleX(locationX);
                let closestIndex = 0;
                let minDiff = Infinity;
                projectionData.dataSimulated.forEach((d, i) => {
                    const diff = Math.abs(d.x - touchedX);
                    if (diff < minDiff) {
                        minDiff = diff;
                        closestIndex = i;
                    }
                });
                setSelectedIndex(closestIndex);
            },
            onPanResponderRelease: () => {
                setSelectedIndex(null);
            },
            onPanResponderTerminate: () => {
                setSelectedIndex(null);
            }
        }),
        [projectionData.dataSimulated, xMax, plotWidth]
    );

    return (
        <ScrollView
            style={[styles.container, { backgroundColor: theme.colors.background }]}
            contentContainerStyle={{ paddingBottom: 100 }}
            scrollEnabled={selectedIndex === null} // Disable scroll while dragging chart
        >
            <View style={styles.header}>
                <IconButton icon="arrow-left" onPress={() => navigation.goBack()} />
                <Text variant="headlineSmall" style={{ flex: 1 }}>Simulador de Futuro</Text>
            </View>

            <Card style={styles.card}>
                <Card.Content>
                    <Text variant="titleMedium" style={{ marginBottom: 16 }}>Parâmetros da Simulação</Text>

                    {/* Monthly Contribution Control */}
                    <View style={styles.inputContainer}>
                        <TextInput
                            label="Aporte Mensal"
                            mode="outlined"
                            value={monthlyContributionStr}
                            onChangeText={(text) => {
                                const numericValue = parseCurrency(text);
                                setMonthlyContribution(numericValue);
                                setMonthlyContributionStr(formatCurrency(numericValue));
                            }}
                            keyboardType="numeric"
                            style={styles.input}
                        />
                        <Text variant="bodySmall" style={{ color: theme.colors.secondary, marginTop: 4 }}>
                            Valor total a ser investido mensalmente
                        </Text>
                    </View>

                    <View style={styles.row}>
                        {/* Duration Control */}
                        <View style={[styles.inputContainer, { flex: 1, marginRight: 8 }]}>
                            <Text variant="bodySmall" style={{ marginBottom: 4, color: theme.colors.onSurfaceVariant }}>Prazo</Text>
                            <View style={[styles.combinedInput, { borderColor: theme.colors.outline, backgroundColor: theme.colors.surface }]}>
                                <TextInput
                                    value={simulationDuration}
                                    onChangeText={setSimulationDuration}
                                    keyboardType="numeric"
                                    style={styles.transparentInput}
                                    underlineColor="transparent"
                                    activeUnderlineColor="transparent"
                                />
                                <View style={styles.verticalDivider} />
                                <Menu
                                    visible={durationMenuVisible}
                                    onDismiss={() => setDurationMenuVisible(false)}
                                    anchor={
                                        <TouchableOpacity onPress={() => setDurationMenuVisible(true)} style={styles.dropdownTrigger}>
                                            <Text variant="bodyMedium">{durationUnit === 'years' ? 'Anos' : 'Meses'}</Text>
                                            <IconButton icon="chevron-down" size={16} style={{ margin: 0 }} />
                                        </TouchableOpacity>
                                    }
                                >
                                    <Menu.Item onPress={() => { setDurationUnit('years'); setDurationMenuVisible(false); }} title="Anos" />
                                    <Menu.Item onPress={() => { setDurationUnit('months'); setDurationMenuVisible(false); }} title="Meses" />
                                </Menu>
                            </View>
                        </View>

                        {/* Return Rate Control */}
                        <View style={[styles.inputContainer, { flex: 1, marginLeft: 8 }]}>
                            <Text variant="bodySmall" style={{ marginBottom: 4, color: theme.colors.onSurfaceVariant }}>Rentabilidade</Text>
                            <View style={[styles.combinedInput, { borderColor: theme.colors.outline, backgroundColor: theme.colors.surface }]}>
                                <TextInput
                                    value={annualReturn}
                                    onChangeText={setAnnualReturn}
                                    keyboardType="numeric"
                                    style={styles.transparentInput}
                                    underlineColor="transparent"
                                    activeUnderlineColor="transparent"
                                />
                                <View style={styles.verticalDivider} />
                                <Menu
                                    visible={returnRateMenuVisible}
                                    onDismiss={() => setReturnRateMenuVisible(false)}
                                    anchor={
                                        <TouchableOpacity onPress={() => setReturnRateMenuVisible(true)} style={styles.dropdownTrigger}>
                                            <Text variant="bodyMedium">{returnRatePeriod === 'yearly' ? '% a.a.' : '% a.m.'}</Text>
                                            <IconButton icon="chevron-down" size={16} style={{ margin: 0 }} />
                                        </TouchableOpacity>
                                    }
                                >
                                    <Menu.Item onPress={() => { setReturnRatePeriod('yearly'); setReturnRateMenuVisible(false); }} title="% ao ano" />
                                    <Menu.Item onPress={() => { setReturnRatePeriod('monthly'); setReturnRateMenuVisible(false); }} title="% ao mês" />
                                </Menu>
                            </View>
                        </View>
                    </View>
                </Card.Content>
            </Card>

            <Card style={[styles.card, { marginTop: 16 }]}>
                <Card.Content>
                    <Text variant="titleMedium" style={{ marginBottom: 16 }}>
                        Projeção de Patrimônio
                    </Text>

                    <View style={{ alignItems: 'center' }} {...panResponder.panHandlers}>
                        <Svg width={chartWidth} height={chartHeight}>
                            <Defs>
                                <LinearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                                    <Stop offset="0" stopColor={theme.colors.primary} stopOpacity="0.3" />
                                    <Stop offset="1" stopColor={theme.colors.primary} stopOpacity="0.0" />
                                </LinearGradient>
                            </Defs>

                            {/* Y Axis Grid & Labels */}
                            {yTicks.map((val, i) => (
                                <React.Fragment key={`y-${i}`}>
                                    <Line
                                        x1={padding.left}
                                        y1={scaleY(val)}
                                        x2={chartWidth - padding.right}
                                        y2={scaleY(val)}
                                        stroke={theme.colors.surfaceVariant}
                                        strokeDasharray="4 4"
                                        strokeWidth="1"
                                    />
                                    <SvgText
                                        x={padding.left - 5}
                                        y={scaleY(val) + 3}
                                        fontSize="10"
                                        fill={theme.colors.onSurfaceVariant}
                                        textAnchor="end"
                                    >
                                        {`${(val / 1000).toFixed(0)}k`}
                                    </SvgText>
                                </React.Fragment>
                            ))}

                            {/* X Axis Labels */}
                            {xTicks.map((val, i) => (
                                <SvgText
                                    key={`x-${i}`}
                                    x={scaleX(val)}
                                    y={chartHeight - 10}
                                    fontSize="10"
                                    fill={theme.colors.onSurfaceVariant}
                                    textAnchor="middle"
                                >
                                    {`${val.toFixed(0)}${durationUnit === 'years' ? 'a' : 'm'}`}
                                </SvgText>
                            ))}

                            {/* Area Fill */}
                            <Path
                                d={areaPath}
                                fill="url(#chartGradient)"
                            />

                            {/* Simulated Trajectory Line */}
                            <Path
                                d={simulatedPath}
                                stroke={theme.colors.primary}
                                strokeWidth="3"
                                fill="none"
                            />

                            {/* Nodes (Dots) - Only show when not interacting or show all? 
                                User asked for nodes. Let's keep them small.
                            */}
                            {projectionData.dataSimulated.map((point, i) => (
                                <Circle
                                    key={`node-${i}`}
                                    cx={scaleX(point.x)}
                                    cy={scaleY(point.y)}
                                    r={3}
                                    fill={theme.colors.background}
                                    stroke={theme.colors.primary}
                                    strokeWidth={2}
                                />
                            ))}

                            {/* Interactive Tooltip */}
                            {selectedIndex !== null && projectionData.dataSimulated[selectedIndex] && (
                                <React.Fragment>
                                    {/* Vertical Line */}
                                    <Line
                                        x1={scaleX(projectionData.dataSimulated[selectedIndex].x)}
                                        y1={padding.top}
                                        x2={scaleX(projectionData.dataSimulated[selectedIndex].x)}
                                        y2={chartHeight - padding.bottom}
                                        stroke={theme.colors.onSurface}
                                        strokeWidth="1"
                                        strokeDasharray="2 2"
                                        opacity="0.5"
                                    />
                                    {/* Highlight Circle */}
                                    <Circle
                                        cx={scaleX(projectionData.dataSimulated[selectedIndex].x)}
                                        cy={scaleY(projectionData.dataSimulated[selectedIndex].y)}
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
                                        {formatCurrency(projectionData.dataSimulated[selectedIndex].y)}
                                    </SvgText>
                                    <SvgText
                                        x={chartWidth / 2}
                                        y={36}
                                        fontSize="12"
                                        fill={theme.colors.onSurfaceVariant}
                                        textAnchor="middle"
                                    >
                                        {`${projectionData.dataSimulated[selectedIndex].x.toFixed(1)} ${durationUnit === 'years' ? 'anos' : 'meses'}`}
                                    </SvgText>
                                </React.Fragment>
                            )}
                        </Svg>
                    </View>

                    <View style={styles.statsContainer}>
                        <View style={styles.statItem}>
                            <Text variant="labelMedium">
                                Patrimônio em {simulationDuration} {durationUnit === 'years' ? 'anos' : 'meses'}
                            </Text>
                            <Text variant="displaySmall" style={{ color: theme.colors.primary, fontWeight: 'bold', marginVertical: 4 }}>
                                {formatCurrency(projectionData.finalSimulated)}
                            </Text>
                        </View>
                    </View>

                    <Divider style={{ marginVertical: 20 }} />

                    <View style={styles.insightRow}>
                        <View style={[styles.iconContainer, { backgroundColor: '#FFF9C4' }]}>
                            <IconButton icon="trophy" iconColor="#FBC02D" size={24} />
                        </View>
                        <View style={{ flex: 1, marginLeft: 12 }}>
                            <Text variant="bodyMedium" style={{ color: theme.colors.secondary }}>Tempo para o 1º Milhão</Text>
                            <Text variant="titleLarge" style={{ fontWeight: 'bold' }}>
                                {timeToMillion === Infinity
                                    ? "Nunca (sem rendimento)"
                                    : timeToMillion > 100
                                        ? "> 100 anos"
                                        : `${timeToMillion.toFixed(1)} anos`}
                            </Text>
                        </View>
                    </View>
                </Card.Content>
            </Card>
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 16,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
    },
    card: {
        marginBottom: 12,
        borderRadius: 16,
        elevation: 2,
    },
    inputContainer: {
        marginBottom: 16,
    },
    row: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    input: {
        backgroundColor: 'transparent',
    },
    combinedInput: {
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderRadius: 4,
        height: 56, // Match standard Outlined TextInput height
    },
    transparentInput: {
        flex: 1,
        backgroundColor: 'transparent',
        height: 50,
        fontSize: 16,
    },
    verticalDivider: {
        width: 1,
        height: '60%',
        backgroundColor: '#E0E0E0',
    },
    dropdownTrigger: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 8,
        height: '100%',
    },
    statsContainer: {
        marginTop: 8,
        alignItems: 'center',
    },
    statItem: {
        alignItems: 'center',
    },
    insightRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    iconContainer: {
        width: 48,
        height: 48,
        borderRadius: 24,
        justifyContent: 'center',
        alignItems: 'center',
    },
});
