import React, { useMemo } from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
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

   // Group by weeks for layout - each column is a week with 7 rows (days)
   const weeks: (Date | null)[][] = [];

   allDates.forEach((date) => {
      const dayOfWeek = (date.getDay() + 6) % 7; // Convert to Mon=0, Tue=1, ..., Sun=6

      // If it's Monday (start of new week), create a new week column
      if (dayOfWeek === 0) {
         weeks.push([null, null, null, null, null, null, null]);
      }

      // If no weeks exist yet (first date isn't Monday), create the first week
      if (weeks.length === 0) {
         weeks.push([null, null, null, null, null, null, null]);
      }

      // Add date to the current week column at the correct day row
      weeks[weeks.length - 1][dayOfWeek] = date;
   });

   // Calculate dynamic cell size based on screen width
   const { cellSize, gap } = useMemo(() => {
      const screenWidth = Dimensions.get('window').width;
      const padding = 32; // Account for container padding
      const gap = 2;
      const numberOfWeeks = weeks.length;

      // Calculate cell size to fill the width
      const availableWidth = screenWidth - padding;
      const totalGapWidth = gap * (numberOfWeeks - 1);
      const cellSize = Math.floor((availableWidth - totalGapWidth) / numberOfWeeks);

      return { cellSize, gap };
   }, [weeks.length]);

   return (
      <View style={styles.container}>
         <Text style={[styles.title, { color: themeColorForeground }]}>Consistency</Text>
         <View style={[styles.heatmapContainer, { gap }]}>
            {weeks.map((week, weekIndex) => (
               <View key={weekIndex} style={[styles.column, { gap }]}>
                  {week.map((date, dayIndex) => {
                     const count = date ? getDataForDate(date) : 0;
                     const backgroundColor = date ? getColor(count) : 'transparent';
                     return (
                        <View
                           key={dayIndex}
                           style={[
                              styles.cell,
                              {
                                 backgroundColor,
                                 width: cellSize,
                                 height: cellSize,
                              }
                           ]}
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
      width: '100%',
      paddingHorizontal: 16,
   },
   title: {
      fontSize: 18,
      fontWeight: '600',
      marginBottom: 12,
   },
   heatmapContainer: {
      flexDirection: 'row',
   },
   column: {
      // gap is set dynamically
   },
   cell: {
      borderRadius: 2,
      // width and height are set dynamically
   },
   legend: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'flex-end',
      marginTop: 20,
      gap: 4,
   },
   legendDot: {
      width: 12,
      height: 12,
      borderRadius: 2,
   },
   legendText: {
      fontSize: 10,
      color: '#A0AEC0',
      marginHorizontal: 4,
   }
});
