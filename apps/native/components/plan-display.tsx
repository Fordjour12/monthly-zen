import { View, Text, ScrollView, StyleSheet } from "react-native";
import { useThemeColor } from "heroui-native";

interface DailyTask {
  [day: string]: string[];
}

interface WeekData {
  week: number;
  focus: string;
  goals: string[];
  daily_tasks: DailyTask;
}

interface PlanDisplayProps {
  data: {
    weekly_breakdown: WeekData[];
    [key: string]: any;
  };
}

export default function PlanDisplay({ data }: PlanDisplayProps) {
  const foregroundColor = useThemeColor("foreground");
  const mutedColor = useThemeColor("muted");
  const accentColor = useThemeColor("accent");

  const styles = StyleSheet.create({
    container: {
      flex: 1,
    },
    weekContainer: {
      backgroundColor: 'rgba(255, 255, 255, 0.05)',
      borderRadius: 12,
      padding: 16,
      marginBottom: 20,
      borderLeftWidth: 4,
      borderLeftColor: accentColor,
    },
    heading3: {
      fontSize: 18,
      fontWeight: 'bold',
      color: foregroundColor,
      marginBottom: 12,
    },
    subHeading: {
      fontSize: 16,
      fontWeight: '600',
      color: foregroundColor,
      marginTop: 16,
      marginBottom: 8,
    },
    listItem: {
      fontSize: 14,
      color: foregroundColor,
      marginBottom: 4,
      paddingLeft: 8,
    },
    taskRow: {
      flexDirection: 'row',
      marginBottom: 6,
      paddingVertical: 4,
      backgroundColor: 'rgba(255, 255, 255, 0.02)',
      borderRadius: 6,
      paddingHorizontal: 8,
    },
    taskDay: {
      fontSize: 14,
      fontWeight: '600',
      color: accentColor,
      width: 80,
    },
    taskDetail: {
      fontSize: 14,
      color: foregroundColor,
      flex: 1,
      marginLeft: 12,
    },
    weekNumber: {
      fontSize: 20,
      fontWeight: 'bold',
      color: accentColor,
      marginRight: 8,
    },
    focusText: {
      fontSize: 16,
      color: mutedColor,
      fontStyle: 'italic',
    },
    goalsContainer: {
      backgroundColor: 'rgba(255, 255, 255, 0.03)',
      borderRadius: 8,
      padding: 12,
      marginBottom: 12,
    },
    tasksContainer: {
      backgroundColor: 'rgba(255, 255, 255, 0.03)',
      borderRadius: 8,
      padding: 12,
    },
  });

  if (!data || !data.weekly_breakdown) {
    return (
      <View style={styles.container}>
        <Text style={[styles.heading3, { textAlign: 'center', marginTop: 50 }]}>
          No plan data available
        </Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {data.weekly_breakdown.map((weekItem, index) => (
        <View key={index} style={styles.weekContainer}>
          {/* Week Header */}
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
            <Text style={styles.weekNumber}>Week {weekItem.week}:</Text>
            <Text style={styles.focusText}>{weekItem.focus}</Text>
          </View>

          {/* Goals Section */}
          <Text style={styles.subHeading}>🎯 Goals</Text>
          <View style={styles.goalsContainer}>
            {weekItem.goals.map((goal, gIndex) => (
              <Text key={gIndex} style={styles.listItem}>
                • {goal}
              </Text>
            ))}
          </View>

          {/* Daily Tasks Section */}
          <Text style={styles.subHeading}>📅 Daily Tasks</Text>
          <View style={styles.tasksContainer}>
            {Object.keys(weekItem.daily_tasks).map((day, dIndex) => (
              <View key={dIndex} style={styles.taskRow}>
                <Text style={styles.taskDay}>{day}:</Text>
                <Text style={styles.taskDetail}>
                  {weekItem.daily_tasks[day].join(', ')}
                </Text>
              </View>
            ))}
          </View>
        </View>
      ))}
    </ScrollView>
  );
}