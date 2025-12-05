import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useThemeColor } from 'heroui-native';
import { BarChart } from 'react-native-gifted-charts';

interface WeeklyOverviewProps {
    summary: string;
    chartData: { label: string; value: number }[];
}

export default function WeeklyOverview({ summary, chartData }: WeeklyOverviewProps) {
    const themeColorSurface = useThemeColor('surface');
    const themeColorForeground = useThemeColor('foreground');
    const themeColorPrimary = '#FF6B6B'; // Using the app's accent color

    return (
        <View style={[styles.container, { backgroundColor: themeColorSurface }]}>
            <Text style={[styles.title, { color: themeColorForeground }]}>Weekly Overview</Text>

            <View style={styles.summaryContainer}>
                <Text style={[styles.summaryText, { color: themeColorForeground }]}>
                    {summary}
                </Text>
            </View>

            <View style={styles.chartContainer}>
                <BarChart
                    data={chartData}
                    barWidth={22}
                    noOfSections={3}
                    barBorderRadius={4}
                    frontColor={themeColorPrimary}
                    yAxisThickness={0}
                    xAxisThickness={0}
                    hideRules
                    yAxisTextStyle={{ color: '#A0AEC0', fontSize: 10 }}
                    xAxisLabelTextStyle={{ color: '#A0AEC0', fontSize: 10 }}
                    height={120}
                    width={280} // Approximate width, might need adjustment based on screen
                />
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        borderRadius: 16,
        padding: 16,
        marginBottom: 24,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
    },
    title: {
        fontSize: 18,
        fontWeight: '600',
        marginBottom: 12,
    },
    summaryContainer: {
        marginBottom: 20,
        padding: 12,
        backgroundColor: 'rgba(0,0,0,0.03)',
        borderRadius: 8,
    },
    summaryText: {
        fontSize: 14,
        lineHeight: 20,
        opacity: 0.8,
    },
    chartContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 10,
    },
});
