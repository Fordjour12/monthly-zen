import React from 'react';
import { View, Text, ScrollView } from 'react-native';

// Helper function to format dates beautifully
const formatWeekDates = (weekNumber: number) => {
   const today = new Date();
   const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
   const startOfWeek = new Date(startOfMonth);
   startOfWeek.setDate(startOfMonth.getDate() + (weekNumber - 1) * 7);

   // Adjust to Monday
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

// Component to render the full plan
export const MonthlyPlanViewer = ({ data }) => {
   // Handle different data formats
   const renderPlanContent = () => {
      // If it's a plain text string, render it as simple text
      if (typeof data === 'string') {
          return (
             <View className="p-4">
                <Text className="text-sm leading-[22px] text-white">{data}</Text>
             </View>
          );
      }

      // If it's a simple object with just monthly_summary
      if (data && typeof data === 'object' && data.monthly_summary && !data.weekly_breakdown) {
           return (
              <View className="p-4">
                 <Text className="text-xl font-bold text-white mb-2">📅 Monthly Plan Summary</Text>
                 <Text className="text-sm leading-[22px] mb-[10px] text-white">{data.monthly_summary}</Text>
              </View>
           );
      }

      // Full structured plan
      if (data && typeof data === 'object' && data.monthly_summary) {
         return (
             <View>
                {/* Monthly Summary */}
                <Text className="text-xl font-bold text-white mt-4 mb-2">📝 Monthly Summary</Text>
                <Text className="text-sm leading-[22px] mb-[10px] text-white">{data.monthly_summary}</Text>

                <View className="h-px bg-gray-200 my-[15px]" />

                {/* Weekly Breakdown */}
                <Text className="text-xl font-bold text-white mt-4 mb-2">📅 Weekly Breakdown</Text>
                {data.weekly_breakdown?.map((weekItem, index) => (
                   <View key={index} className="mb-5 p-4 rounded-xl bg-gray-50 border-l-4 border-l-green-500">
                      {/* Week Focus Header with dates */}
                      <View className="flex-row justify-between items-center mb-2">
                         <Text className="text-base font-semibold text-white mt-[10px] mb-[5px]">
                            Week {weekItem.week}: {weekItem.focus}
                         </Text>
                         <Text className="text-sm font-medium text-gray-500 italic">
                            {formatWeekDates(weekItem.week)}
                         </Text>
                      </View>

                      {/* Goals List */}
                      <Text className="text-sm font-bold mt-3 mb-[6px] text-gray-700">🎯 Goals</Text>
                      {weekItem.goals?.map((goal, gIndex) => (
                         <View key={gIndex} className="flex-row items-start mb-1 pl-[10px]">
                            <Text className="text-sm font-bold text-green-500 mr-2 mt-0.5">•</Text>
                            <Text className="text-sm flex-1 leading-5 text-gray-600">{goal}</Text>
                         </View>
                      ))}

                      {/* Daily Tasks */}
                      {weekItem.daily_tasks && renderDailyTasks(weekItem.daily_tasks)}
                   </View>
                ))}

                <View className="h-px bg-gray-200 my-[15px]" />

                {/* Planning & Success Metrics */}
                <Text className="text-xl font-bold text-white mt-4 mb-2">🛡️ Planning & Success</Text>

                {data.potential_conflicts && (
                   <>
                      <Text className="text-base font-semibold text-white mt-[10px] mb-[5px]">⚠️ Potential Conflicts & Mitigation</Text>
                      {data.potential_conflicts.map((conflict, cIndex) => (
                         <View key={cIndex} className="flex-row items-start mb-1 pl-[10px]">
                            <Text className="text-sm font-bold text-green-500 mr-2 mt-0.5">•</Text>
                            <Text className="text-sm flex-1 leading-5 text-gray-600">{conflict}</Text>
                         </View>
                      ))}
                   </>
                )}

                {data.success_metrics && (
                   <>
                      <Text className="text-base font-semibold text-white mt-[10px] mb-[5px]">📊 Success Metrics</Text>
                      {data.success_metrics.map((metric, mIndex) => (
                         <View key={mIndex} className="flex-row items-start mb-1 pl-[10px]">
                            <Text className="text-sm font-bold text-green-500 mr-2 mt-0.5">•</Text>
                            <Text className="text-sm flex-1 leading-5 text-gray-600">{metric}</Text>
                         </View>
                      ))}
                   </>
                )}
             </View>
         );
      }

       // Fallback for any other format
       return (
          <View className="p-4">
             <Text className="text-sm leading-[22px] text-white">
                {typeof data === 'object' ? JSON.stringify(data, null, 2) : String(data)}
             </Text>
          </View>
       );
   };

   const renderDailyTasks = (tasksByDay) => {
      const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
       return (
          <View>
             <Text className="text-sm font-bold mt-3 mb-[6px] text-gray-700">📋 Daily Tasks</Text>
             {days.map(day => {
                const tasks = tasksByDay[day];
                if (!tasks || tasks.length === 0) return null;

                return (
                   <View key={day} className="flex-row py-2 border-b border-b-gray-100 items-start">
                      <Text className="font-bold w-[75px] text-blue-900 text-xs">{day}:</Text>
                      <View className="flex-1 pl-[10px]">
                         {tasks.map((task, index) => (
                            <View key={index} className="flex-row items-start mb-[3px]">
                               <Text className="text-xs font-bold text-green-500 mr-[6px] mt-0.5">•</Text>
                               <Text className="text-xs leading-[18px] text-gray-500 flex-1">{task}</Text>
                            </View>
                         ))}
                      </View>
                   </View>
                );
             })}
          </View>
       );
   };

    return (
       <ScrollView className="flex-1 bg-transparent" showsVerticalScrollIndicator={false}>
          {renderPlanContent()}
       </ScrollView>
    );
};
