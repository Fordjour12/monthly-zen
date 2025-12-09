import React, { useState } from 'react';
import { View, Text, Pressable, Animated, LayoutAnimation, Platform, UIManager } from 'react-native';

// Enable LayoutAnimation on Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
    UIManager.setLayoutAnimationEnabledExperimental(true);
}

interface DailyTask {
    [day: string]: string[];
}

interface WeekData {
    week: number;
    focus: string;
    goals: string[];
    daily_tasks: DailyTask;
}

interface WeeklyBreakdownViewerProps {
    weeklyBreakdown: WeekData[];
}

// Helper function to format week dates
const formatWeekDates = (weekNumber: number) => {
    const today = new Date();
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const startOfWeek = new Date(startOfMonth);
    startOfWeek.setDate(startOfMonth.getDate() + (weekNumber - 1) * 7);

    const dayOfWeek = startOfWeek.getDay();
    const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    startOfWeek.setDate(startOfWeek.getDate() + mondayOffset);

    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);

    const options: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' };
    const startStr = startOfWeek.toLocaleDateString('en-US', options);
    const endStr = endOfWeek.toLocaleDateString('en-US', options);

    return `${startStr} - ${endStr}`;
};

// Get theme color for week
const getWeekColor = (weekNumber: number) => {
    const colors = [
        { bg: 'bg-blue-500/20', border: 'border-l-blue-500', text: 'text-blue-400', accent: 'bg-blue-500' },
        { bg: 'bg-purple-500/20', border: 'border-l-purple-500', text: 'text-purple-400', accent: 'bg-purple-500' },
        { bg: 'bg-green-500/20', border: 'border-l-green-500', text: 'text-green-400', accent: 'bg-green-500' },
        { bg: 'bg-orange-500/20', border: 'border-l-orange-500', text: 'text-orange-400', accent: 'bg-orange-500' },
        { bg: 'bg-pink-500/20', border: 'border-l-pink-500', text: 'text-pink-400', accent: 'bg-pink-500' },
    ];
    return colors[(weekNumber - 1) % colors.length];
};

/**
 * Weekly Breakdown Viewer (Section 2B from creation.md)
 * Accordion-style viewer for the weekly_breakdown array:
 * - Week Header with number and focus
 * - Weekly Goals List
 * - Daily Tasks organized by day
 */
export const WeeklyBreakdownViewer: React.FC<WeeklyBreakdownViewerProps> = ({
    weeklyBreakdown,
}) => {
    const [expandedWeeks, setExpandedWeeks] = useState<Set<number>>(new Set([1])); // Week 1 expanded by default

    const toggleWeek = (weekNumber: number) => {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        setExpandedWeeks(prev => {
            const newSet = new Set(prev);
            if (newSet.has(weekNumber)) {
                newSet.delete(weekNumber);
            } else {
                newSet.add(weekNumber);
            }
            return newSet;
        });
    };

    const renderDailyTasks = (tasksByDay: DailyTask, weekColor: { text: string }) => {
        const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

        return (
            <View className="mt-3">
                <View className="flex-row items-center mb-3">
                    <Text className="text-sm mr-2">📋</Text>
                    <Text className="text-sm font-semibold text-foreground">Daily Tasks</Text>
                </View>
                {days.map(day => {
                    const tasks = tasksByDay[day];
                    if (!tasks || tasks.length === 0) return null;

                    return (
                        <View key={day} className="mb-3 p-3 bg-surface/40 rounded-lg">
                            <Text className={`font-semibold text-xs ${weekColor.text} mb-2`}>{day}</Text>
                            {tasks.map((task, index) => (
                                <View key={index} className="flex-row items-start mb-1.5">
                                    <View className="w-1.5 h-1.5 rounded-full bg-foreground/50 mt-1.5 mr-2" />
                                    <Text className="text-foreground/80 text-xs flex-1 leading-5">{task}</Text>
                                </View>
                            ))}
                        </View>
                    );
                })}
            </View>
        );
    };

    if (!weeklyBreakdown || weeklyBreakdown.length === 0) {
        return (
            <View className="p-8 items-center justify-center">
                <Text className="text-muted text-center">No weekly breakdown available</Text>
            </View>
        );
    }

    return (
        <View className="mb-4">
            <View className="flex-row items-center mb-4">
                <Text className="text-xl mr-2">📅</Text>
                <Text className="text-lg font-bold text-foreground">Weekly Breakdown</Text>
            </View>

            {weeklyBreakdown.map((weekItem, index) => {
                const isExpanded = expandedWeeks.has(weekItem.week);
                const weekColor = getWeekColor(weekItem.week);

                return (
                    <View
                        key={index}
                        className={`mb-4 rounded-xl overflow-hidden border-l-4 ${weekColor.border}`}
                    >
                        {/* Week Header (Accordion Trigger) */}
                        <Pressable
                            onPress={() => toggleWeek(weekItem.week)}
                            className={`${weekColor.bg} p-4 active:opacity-80`}
                        >
                            <View className="flex-row items-center justify-between">
                                <View className="flex-row items-center flex-1">
                                    <View className={`w-10 h-10 rounded-full ${weekColor.accent} items-center justify-center mr-3`}>
                                        <Text className="text-white font-bold text-sm">{weekItem.week}</Text>
                                    </View>
                                    <View className="flex-1">
                                        <Text className="text-base font-bold text-foreground">
                                            Week {weekItem.week}
                                        </Text>
                                        <Text className="text-sm text-muted italic" numberOfLines={1}>
                                            {weekItem.focus}
                                        </Text>
                                    </View>
                                </View>
                                <View className="flex-row items-center">
                                    <Text className="text-xs text-muted mr-2">
                                        {formatWeekDates(weekItem.week)}
                                    </Text>
                                    <Text className={`text-lg ${weekColor.text}`}>
                                        {isExpanded ? '▼' : '▶'}
                                    </Text>
                                </View>
                            </View>
                        </Pressable>

                        {/* Expanded Content */}
                        {isExpanded && (
                            <View className="p-4 bg-surface/20">
                                {/* Focus Badge */}
                                <View className={`${weekColor.bg} px-3 py-2 rounded-lg mb-4`}>
                                    <Text className={`text-sm font-medium ${weekColor.text}`}>
                                        🎯 Focus: {weekItem.focus}
                                    </Text>
                                </View>

                                {/* Goals Section */}
                                {weekItem.goals && weekItem.goals.length > 0 && (
                                    <View className="mb-4">
                                        <View className="flex-row items-center mb-3">
                                            <Text className="text-sm mr-2">🎯</Text>
                                            <Text className="text-sm font-semibold text-foreground">Weekly Goals</Text>
                                        </View>
                                        <View className="p-3 bg-surface/40 rounded-lg">
                                            {weekItem.goals.map((goal, gIndex) => (
                                                <View key={gIndex} className="flex-row items-start mb-2">
                                                    <View className={`w-5 h-5 rounded-full ${weekColor.bg} items-center justify-center mr-3 mt-0.5`}>
                                                        <Text className={`text-xs font-bold ${weekColor.text}`}>{gIndex + 1}</Text>
                                                    </View>
                                                    <Text className="text-foreground text-sm flex-1 leading-5">{goal}</Text>
                                                </View>
                                            ))}
                                        </View>
                                    </View>
                                )}

                                {/* Daily Tasks Section */}
                                {weekItem.daily_tasks && renderDailyTasks(weekItem.daily_tasks, weekColor)}
                            </View>
                        )}
                    </View>
                );
            })}
        </View>
    );
};

export default WeeklyBreakdownViewer;
