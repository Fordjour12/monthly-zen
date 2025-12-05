import React from "react";
import { View, Text, ScrollView, StyleSheet, Dimensions, Pressable } from "react-native";
import { useThemeColor } from "heroui-native";

// Types for the plan data structure
export interface DailyTask {
  [day: string]: string[];
}

export interface WeekData {
  week: number;
  focus: string;
  goals: string[];
  daily_tasks: DailyTask;
}

export interface PlanData {
  weekly_breakdown: WeekData[];
  [key: string]: any;
}

export interface PlanDisplayLibraryProps {
  data: PlanData;
  showWeekNumbers?: boolean;
  compactMode?: boolean;
  theme?: 'light' | 'dark' | 'auto';
  onWeekPress?: (week: WeekData, index: number) => void;
  onGoalPress?: (goal: string, weekIndex: number, goalIndex: number) => void;
  onTaskPress?: (task: string, weekIndex: number, day: string) => void;
}



// Main library component
export function PlanDisplayLibrary({
  data,
  showWeekNumbers = true,
  compactMode = false,
  theme = 'auto',
  onWeekPress,
  onGoalPress,
  onTaskPress,
}: PlanDisplayLibraryProps) {
  const foregroundColor = useThemeColor("foreground");
  const mutedColor = useThemeColor("muted");
  const accentColor = useThemeColor("accent");
  const surfaceColor = useThemeColor("surface");

  // Dynamic styles based on props
  const styles = StyleSheet.create({
    container: {
      flex: 1,
    },
    weekContainer: {
      backgroundColor: compactMode ? 'transparent' : surfaceColor + '20',
      borderRadius: compactMode ? 8 : 12,
      padding: compactMode ? 12 : 16,
      marginBottom: compactMode ? 12 : 20,
      borderLeftWidth: 3,
      borderLeftColor: accentColor,
      marginHorizontal: compactMode ? 4 : 0,
    },
    weekHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 12,
    },
    weekNumber: {
      fontSize: compactMode ? 16 : 20,
      fontWeight: 'bold',
      color: accentColor,
      marginRight: 8,
    },
    focusText: {
      fontSize: compactMode ? 14 : 16,
      color: mutedColor,
      fontStyle: 'italic',
      flex: 1,
    },
    sectionHeading: {
      fontSize: compactMode ? 14 : 16,
      fontWeight: '600',
      color: foregroundColor,
      marginTop: compactMode ? 12 : 16,
      marginBottom: compactMode ? 6 : 8,
    },
    goalsContainer: {
      backgroundColor: compactMode ? 'transparent' : surfaceColor + '10',
      borderRadius: compactMode ? 6 : 8,
      padding: compactMode ? 8 : 12,
      marginBottom: compactMode ? 8 : 12,
    },
    goalItem: {
      fontSize: compactMode ? 12 : 14,
      color: foregroundColor,
      marginBottom: compactMode ? 2 : 4,
      paddingLeft: 8,
      lineHeight: compactMode ? 16 : 20,
    },
    tasksContainer: {
      backgroundColor: compactMode ? 'transparent' : surfaceColor + '10',
      borderRadius: compactMode ? 6 : 8,
      padding: compactMode ? 8 : 12,
    },
    taskRow: {
      flexDirection: 'row',
      marginBottom: compactMode ?4 : 6,
      paddingVertical: compactMode ? 2 : 4,
      backgroundColor: compactMode ? 'transparent' : surfaceColor + '05',
      borderRadius: compactMode ? 4 : 6,
      paddingHorizontal: compactMode ? 6 : 8,
      alignItems: 'flex-start',
    },
    taskRow: {
      flexDirection: 'row',
      marginBottom: compactMode ? 4 : 6,
      paddingVertical: compactMode ? 2 : 4,
      backgroundColor: compactMode ? 'transparent' : `${surfaceColor}05`,
      borderRadius: compactMode ? 4 : 6,
      paddingHorizontal: compactMode ? 6 : 8,
      alignItems: 'flex-start',
    },
    taskDay: {
      fontSize: compactMode ? 12 : 14,
      fontWeight: '600',
      color: accentColor,
      width: compactMode ? 60 : 80,
      minWidth: compactMode ? 60 : 80,
    },
    taskDetail: {
      fontSize: compactMode ? 12 : 14,
      color: foregroundColor,
      flex: 1,
      marginLeft: compactMode ? 8 : 12,
      lineHeight: compactMode ? 16 : 18,
    },
    emptyState: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingVertical: 60,
    },
    emptyText: {
      fontSize: 16,
      color: mutedColor,
      textAlign: 'center',
    },
    pressable: {
      // Add pressable styles if needed
    },
  });

  // Handle empty state
  if (!data || !data.weekly_breakdown || data.weekly_breakdown.length === 0) {
    return (
      <View style={styles.emptyState}>
        <Text style={styles.emptyText}>No plan data available</Text>
      </View>
    );
  }

  return (
    <ScrollView 
      style={styles.container} 
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{ paddingBottom: 20 }}
    >
      {data.weekly_breakdown.map((weekItem, index) => (
        <Pressable 
          key={index} 
          style={styles.weekContainer}
          onPress={() => onWeekPress?.(weekItem, index)}
        >
          {/* Week Header */}
          <View style={styles.weekHeader}>
            {showWeekNumbers && (
              <Text style={styles.weekNumber}>Week {weekItem.week}:</Text>
            )}
            <Text style={styles.focusText}>{weekItem.focus}</Text>
          </View>

          {/* Goals Section */}
          <Text style={styles.sectionHeading}>🎯 Goals</Text>
          <View style={styles.goalsContainer}>
            {weekItem.goals.map((goal, gIndex) => (
              <Pressable
                key={gIndex} 
                onPress={() => onGoalPress?.(goal, index, gIndex)}
              >
                <Text style={styles.goalItem}>
                  • {goal}
                </Text>
              </Pressable>
            ))}
          </View>

          {/* Daily Tasks Section */}
          <Text style={styles.sectionHeading}>📅 Daily Tasks</Text>
          <View style={styles.tasksContainer}>
            {Object.keys(weekItem.daily_tasks).map((day, dIndex) => (
              <View key={dIndex} style={styles.taskRow}>
                <Text style={styles.taskDay}>{day}:</Text>
                <Pressable onPress={() => onTaskPress?.(weekItem.daily_tasks[day].join(', '), index, day)}>
                  <Text style={styles.taskDetail}>
                    {weekItem.daily_tasks[day].join(', ')}
                  </Text>
                </Pressable>
              </View>
            ))}
          </View>
        </Pressable>
      ))}
    </ScrollView>
  );
}

// Export individual components for more granular control
export function WeekCard({ 
  weekData, 
  index, 
  compactMode = false,
  onPress 
}: { 
  weekData: WeekData; 
  index: number; 
  compactMode?: boolean;
  onPress?: () => void;
}) {
  const foregroundColor = useThemeColor("foreground");
  const mutedColor = useThemeColor("muted");
  const accentColor = useThemeColor("accent");
  const surfaceColor = useThemeColor("surface");

  const styles = StyleSheet.create({
    weekCard: {
      backgroundColor: surfaceColor + '20',
      borderRadius: compactMode ? 8 : 12,
      padding: compactMode ? 12 : 16,
      marginBottom: compactMode ? 12 : 20,
      borderLeftWidth: 3,
      borderLeftColor: accentColor,
    },
    weekHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 12,
    },
    weekNumberText: {
      fontSize: compactMode ? 16 : 20,
      fontWeight: 'bold',
      color: accentColor,
      marginRight: 8,
    },
    weekFocusText: {
      fontSize: compactMode ? 14 : 16,
      color: mutedColor,
      fontStyle: 'italic',
      flex: 1,
    },
  });

  return (
    <Pressable style={styles.weekCard} onPress={onPress}>
      <View style={styles.weekHeader}>
        <Text style={styles.weekNumberText}>Week {weekData.week}:</Text>
        <Text style={styles.weekFocusText}>{weekData.focus}</Text>
      </View>
    </Pressable>
  );
}

export function GoalsList({ 
  goals, 
  compactMode = false,
  onGoalPress 
}: { 
  goals: string[]; 
  compactMode?: boolean;
  onGoalPress?: (goal: string, index: number) => void;
}) {
  const foregroundColor = useThemeColor("foreground");
  const surfaceColor = useThemeColor("surface");

  const styles = StyleSheet.create({
    container: {
      backgroundColor: compactMode ? 'transparent' : `${surfaceColor}10`,
      borderRadius: compactMode ? 6 : 8,
      padding: compactMode ? 8 : 12,
      marginBottom: compactMode ? 8 : 12,
    },
    goal: {
      fontSize: compactMode ? 12 : 14,
      color: foregroundColor,
      marginBottom: compactMode ? 2 : 4,
      paddingLeft: 8,
      lineHeight: compactMode ? 16 : 20,
    },
  });

  return (
    <View style={styles.container}>
      {goals.map((goal, index) => (
        <Pressable
          key={index} 
          onPress={() => onGoalPress?.(goal, index)}
        >
          <Text style={styles.goal}>
            • {goal}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}

export function DailyTasksList({ 
  dailyTasks, 
  compactMode = false,
  onTaskPress 
}: { 
  dailyTasks: DailyTask; 
  compactMode?: boolean;
  onTaskPress?: (task: string, day: string) => void;
}) {
  const foregroundColor = useThemeColor("foreground");
  const accentColor = useThemeColor("accent");
  const surfaceColor = useThemeColor("surface");

  const styles = StyleSheet.create({
    container: {
      backgroundColor: compactMode ? 'transparent' : `${surfaceColor}10`,
      borderRadius: compactMode ? 6 : 8,
      padding: compactMode ? 8 : 12,
    },
    taskRow: {
      flexDirection: 'row',
      marginBottom: compactMode ? 4 : 6,
      paddingVertical: compactMode ? 2 : 4,
      backgroundColor: compactMode ? 'transparent' : `${surfaceColor}05`,
      borderRadius: compactMode ? 4 : 6,
      paddingHorizontal: compactMode ? 6 : 8,
      alignItems: 'flex-start',
    },
    day: {
      fontSize: compactMode ? 12 : 14,
      fontWeight: '600',
      color: accentColor,
      width: compactMode ? 60 : 80,
      minWidth: compactMode ? 60 : 80,
    },
    tasks: {
      fontSize: compactMode ? 12 : 14,
      color: foregroundColor,
      flex: 1,
      marginLeft: compactMode ? 8 : 12,
      lineHeight: compactMode ? 16 : 18,
    },
  });

  return (
    <View style={styles.container}>
      {Object.keys(dailyTasks).map((day) => (
        <View key={day} style={styles.taskRow}>
          <Text style={styles.day}>{day}:</Text>
          <Pressable onPress={() => onTaskPress?.(dailyTasks[day].join(', '), day)}>
            <Text style={styles.tasks}>
              {dailyTasks[day].join(', ')}
            </Text>
          </Pressable>
        </View>
      ))}
    </View>
  );
}

// Utility functions for data processing
export const planUtils = {
  // Get total number of weeks
  getWeekCount: (data: PlanData): number => {
    return data?.weekly_breakdown?.length || 0;
  },

  // Get total goals across all weeks
  getTotalGoals: (data: PlanData): number => {
    return data?.weekly_breakdown?.reduce((total, week) => total + week.goals.length, 0) || 0;
  },

  // Get total tasks across all weeks
  getTotalTasks: (data: PlanData): number => {
    return data?.weekly_breakdown?.reduce((total, week) => {
      return total + Object.values(week.daily_tasks).reduce((weekTotal, dayTasks) => 
        weekTotal + dayTasks.length, 0);
    }, 0) || 0;
  },

  // Get week by number
  getWeekByNumber: (data: PlanData, weekNumber: number): WeekData | null => {
    return data?.weekly_breakdown?.find(week => week.week === weekNumber) || null;
  },

  // Get all unique days from all weeks
  getAllDays: (data: PlanData): string[] => {
    const allDays = new Set<string>();
    data?.weekly_breakdown?.forEach(week => {
      Object.keys(week.daily_tasks).forEach(day => allDays.add(day));
    });
    return Array.from(allDays);
  },

  // Filter weeks by focus keyword
  filterWeeksByFocus: (data: PlanData, keyword: string): WeekData[] => {
    return data?.weekly_breakdown?.filter(week => 
      week.focus.toLowerCase().includes(keyword.toLowerCase())
    ) || [];
  },

  // Search goals across all weeks
  searchGoals: (data: PlanData, searchTerm: string): Array<{week: WeekData, goal: string, weekIndex: number, goalIndex: number}> => {
    const results: Array<{week: WeekData, goal: string, weekIndex: number, goalIndex: number}> = [];
    data?.weekly_breakdown?.forEach((week, weekIndex) => {
      week.goals.forEach((goal, goalIndex) => {
        if (goal.toLowerCase().includes(searchTerm.toLowerCase())) {
          results.push({ week, goal, weekIndex, goalIndex });
        }
      });
    });
    return results;
  },
};

// Default export
export default PlanDisplayLibrary;