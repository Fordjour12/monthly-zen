import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useThemeColor } from 'heroui-native';
import { format, subDays, eachDayOfInterval } from 'date-fns';

interface CalendarHeatmapProps {
    data: { date: string; count: number }[];
    endDate?: Date;
    days?: number;
}

export default function CalendarHeatmap({ data, endDate = new Date(), days = 90 }: CalendarHeatmapProps) {
    const themeColorForeground = useThemeColor('foreground');

    // Generate dates
    const startDate = subDays(endDate, days);
    const allDates = eachDayOfInterval({ start: startDate, end: endDate });

    const getColor = (count: number) => {
        if (count === 0) return '#EDF2F7';
        if (count <= 2) return '#C6F6D5';
        if (count <= 4) return '#68D391';
        if (count <= 6) return '#38A169';
        return '#276749';
    };

    const getDataForDate = (date: Date) => {
        const dateStr = format(date, 'yyyy-MM-dd');
        return data.find(d => d.date === dateStr)?.count || 0;
    };

    // Group by weeks for layout
    const weeks: Date[][] = [];
    let currentWeek: Date[] = [];

    allDates.forEach(date => {
        if (date.getDay() === 0 && currentWeek.length > 0) {
            weeks.push(currentWeek);
            currentWeek = [];
        }
        currentWeek.push(date);
    });
    if (currentWeek.length > 0) weeks.push(currentWeek);

    return (
        <View style={styles.container}>
            <Text style={[styles.title, { color: themeColorForeground }]}>Consistency</Text>
            <View style={styles.heatmapContainer}>
                {weeks.map((week, weekIndex) => (
                    <View key={weekIndex} style={styles.column}>
                        {week.map((date, dayIndex) => {
                            const count = getDataForDate(date);
                            return (
                                <View
                                    key={dayIndex}
                                    style={[styles.cell, { backgroundColor: getColor(count) }]}
                                />
                            );
                        })}
                    </View>
                ))}
            </View>
            <View style={styles.legend}>
                <Text style={styles.legendText}>Less</Text>
                <View style={[styles.legendDot, { backgroundColor: '#EDF2F7' }]} />
                <View style={[styles.legendDot, { backgroundColor: '#C6F6D5' }]} />
                <View style={[styles.legendDot, { backgroundColor: '#68D391' }]} />
                <View style={[styles.legendDot, { backgroundColor: '#38A169' }]} />
                <View style={[styles.legendDot, { backgroundColor: '#276749' }]} />
                <Text style={styles.legendText}>More</Text>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        marginBottom: 24,
    },
    title: {
        fontSize: 18,
        fontWeight: '600',
        marginBottom: 12,
    },
    heatmapContainer: {
        flexDirection: 'row',
        gap: 4,
    },
    column: {
        gap: 4,
    },
    cell: {
        width: 12,
        height: 12,
        borderRadius: 2,
    },
    legend: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'flex-end',
        marginTop: 8,
        gap: 4,
    },
    legendDot: {
        width: 10,
        height: 10,
        borderRadius: 2,
    },
    legendText: {
        fontSize: 10,
        color: '#A0AEC0',
        marginHorizontal: 4,
    }
});
