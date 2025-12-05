import React from 'react';
import { View, Text, ScrollView } from 'react-native';
import { MonthlyPlanViewer } from './monthly-plan';

// Export MonthlyPlanViewer for use in other components
export { MonthlyPlanViewer };

/**
 * Format suggestion content for display based on type
 */
export function formatSuggestion(suggestion: any) {
   if (!suggestion || !suggestion.content) {
      return {
         type: 'unknown',
         title: 'Unknown Suggestion',
         content: 'No content available',
         contentType: 'text',
         displayInfo: {
            relativeTime: formatSuggestionDate(suggestion.createdAt),
            isRecent: isRecentSuggestion(suggestion),
         }
      };
   }

   const { type, content } = suggestion;

   switch (type) {
      case 'plan':
         return {
            type: 'plan',
            title: 'Monthly Plan',
            content: content, // Return raw content for MonthlyPlanViewer
            contentType: 'plan',
            displayInfo: {
               relativeTime: formatSuggestionDate(suggestion.createdAt),
               isRecent: isRecentSuggestion(suggestion),
            }
         };

      case 'briefing':
         return {
            type: 'briefing',
            title: 'Daily Briefing',
            content: formatBriefingContent(content),
            contentType: 'briefing',
            displayInfo: {
               relativeTime: formatSuggestionDate(suggestion.createdAt),
               isRecent: isRecentSuggestion(suggestion),
            }
         };

      case 'reschedule':
         return {
            type: 'reschedule',
            title: 'Reschedule Suggestion',
            content: formatRescheduleContent(content),
            contentType: 'reschedule',
            displayInfo: {
               relativeTime: formatSuggestionDate(suggestion.createdAt),
               isRecent: isRecentSuggestion(suggestion),
            }
         };

      default:
         return {
            type: 'general',
            title: 'AI Suggestion',
            content: formatGeneralContent(content),
            contentType: 'general',
            displayInfo: {
               relativeTime: formatSuggestionDate(suggestion.createdAt),
               isRecent: isRecentSuggestion(suggestion),
            }
         };
   }
}

/**
 * Render formatted suggestion content based on type
 */
export const SuggestionContentRenderer: React.FC<{ suggestion: any }> = ({ suggestion }) => {
   const formatted = formatSuggestion(suggestion);
   
   switch (formatted.contentType) {
      case 'plan':
         return <MonthlyPlanViewer data={suggestion.content} />;
      
      case 'briefing':
         return (
            <View className="p-4">
               <Text className="text-lg font-semibold mb-3">📅 Daily Briefing</Text>
               <Text className="text-sm leading-relaxed whitespace-pre-wrap">
                  {formatted.content}
               </Text>
            </View>
         );
      
      case 'reschedule':
         return (
            <View className="p-4">
               <Text className="text-lg font-semibold mb-3">🔄 Reschedule Suggestion</Text>
               <Text className="text-sm leading-relaxed whitespace-pre-wrap">
                  {formatted.content}
               </Text>
            </View>
         );
      
      default:
         return (
            <View className="p-4">
               <Text className="text-lg font-semibold mb-3">💡 AI Suggestion</Text>
               <Text className="text-sm leading-relaxed whitespace-pre-wrap">
                  {formatted.content}
               </Text>
            </View>
         );
   }
};

/**
 * Get suggestion type icon
 */
export function getSuggestionIcon(type: string) {
   switch (type) {
      case 'plan':
         return '📋';
      case 'briefing':
         return '📝';
      case 'reschedule':
         return '🔄';
      default:
         return '💡';
   }
}

/**
 * Get suggestion type color
 */
export function getSuggestionColor(type: string) {
   switch (type) {
      case 'plan':
         return '#4CAF50';
      case 'briefing':
         return '#2196F3';
      case 'reschedule':
         return '#FF9800';
      default:
         return '#9C27B0';
   }
}

/**
 * Format plan content for display
 */
function formatPlanContent(content: any): string {
   if (typeof content === 'string') {
      return content;
   }
   
   if (typeof content === 'object') {
      const parts: string[] = [];
      
      if (content.monthly_summary) {
         parts.push(`**Monthly Summary:**\n${content.monthly_summary}`);
      }
      
      if (content.weekly_focus && Array.isArray(content.weekly_focus)) {
         parts.push(`\n**Weekly Focus:**`);
         content.weekly_focus.forEach((week: any, index: number) => {
            parts.push(`Week ${index + 1}: ${week.focus || week}`);
         });
      }
      
      if (content.key_goals && Array.isArray(content.key_goals)) {
         parts.push(`\n**Key Goals:**`);
         content.key_goals.forEach((goal: string) => {
            parts.push(`• ${goal}`);
         });
      }
      
      if (content.milestones && Array.isArray(content.milestones)) {
         parts.push(`\n**Milestones:**`);
         content.milestones.forEach((milestone: any) => {
            parts.push(`• ${milestone.title || milestone}`);
         });
      }
      
      return parts.length > 0 ? parts.join('\n') : JSON.stringify(content, null, 2);
   }
   
   return JSON.stringify(content);
}

/**
 * Format briefing content for display
 */
function formatBriefingContent(content: any): string {
   if (typeof content === 'string') {
      return content;
   }
   
   if (typeof content === 'object') {
      const parts: string[] = [];
      
      if (content.summary) {
         parts.push(content.summary);
      }
      
      if (content.tasks && Array.isArray(content.tasks)) {
         parts.push(`\n**Today's Tasks:**`);
         content.tasks.forEach((task: any) => {
            parts.push(`• ${task.title || task}`);
         });
      }
      
      if (content.reminders && Array.isArray(content.reminders)) {
         parts.push(`\n**Reminders:**`);
         content.reminders.forEach((reminder: any) => {
            parts.push(`• ${reminder}`);
         });
      }
      
      return parts.length > 0 ? parts.join('\n') : JSON.stringify(content, null, 2);
   }
   
   return JSON.stringify(content);
}

/**
 * Format reschedule content for display
 */
function formatRescheduleContent(content: any): string {
   if (typeof content === 'string') {
      return content;
   }
   
   if (typeof content === 'object') {
      const parts: string[] = [];
      
      if (content.reason) {
         parts.push(`**Reason:** ${content.reason}`);
      }
      
      if (content.suggestion) {
         parts.push(`\n**Suggestion:** ${content.suggestion}`);
      }
      
      if (content.new_time) {
         parts.push(`\n**New Time:** ${content.new_time}`);
      }
      
      if (content.affected_tasks && Array.isArray(content.affected_tasks)) {
         parts.push(`\n**Affected Tasks:**`);
         content.affected_tasks.forEach((task: any) => {
            parts.push(`• ${task.title || task}`);
         });
      }
      
      return parts.length > 0 ? parts.join('\n') : JSON.stringify(content, null, 2);
   }
   
   return JSON.stringify(content);
}

/**
 * Format general content for display
 */
function formatGeneralContent(content: any): string {
   if (typeof content === 'string') {
      return content;
   }
   
   if (typeof content === 'object') {
      if (content.message) {
         return content.message;
      }
      
      if (content.text) {
         return content.text;
      }
      
      return JSON.stringify(content, null, 2);
   }
   
   return JSON.stringify(content);
}

/**
 * Format an array of suggestions for display
 */
export function formatSuggestions(suggestions: any[]): any[] {
   if (!Array.isArray(suggestions)) {
      return [];
   }
   
   return suggestions.map(suggestion => {
      const formatted = formatSuggestion(suggestion);
      
      return {
         id: suggestion.id,
         title: formatted.title,
         content: suggestion.content,
         type: formatted.type,
         status: suggestion.status || 'pending',
         isApplied: suggestion.isApplied || false,
         createdAt: suggestion.createdAt,
         updatedAt: suggestion.updatedAt,
         metadata: suggestion.metadata,
         displayInfo: {
            icon: getSuggestionIcon(formatted.type),
            typeLabel: formatted.title,
            statusBadge: {
               text: suggestion.status || 'pending',
               color: getSuggestionColor(formatted.type)
            },
            relativeTime: formatted.displayInfo.relativeTime,
            isRecent: formatted.displayInfo.isRecent,
            formattedDate: formatSuggestionDate(suggestion.createdAt)
         }
      };
   });
}

/**
 * Format suggestion preview text (shortened version)
 */
export function formatSuggestionPreview(suggestion: any, maxLength: number = 150) {
   const { type, content } = suggestion;
   
   if (!content) return 'No content available';
   
   let text: string;
   
   switch (type) {
      case 'plan':
         text = formatPlanContent(content);
         break;
      case 'briefing':
         text = formatBriefingContent(content);
         break;
      case 'reschedule':
         text = formatRescheduleContent(content);
         break;
      default:
         text = formatGeneralContent(content);
         break;
   }
   
   // Clean up the text
   text = text
      .replace(/\*\*(.*?)\*\*/g, '$1') // Remove bold markdown
      .replace(/\*(.*?)\*/g, '$1') // Remove italic markdown
      .replace(/#{1,6}\s/g, '') // Remove markdown headers
      .replace(/\n\n+/g, ' ') // Replace multiple newlines with space
      .trim();
   
   // Truncate if too long
   if (text.length > maxLength) {
      return text.substring(0, maxLength) + '...';
   }
   
   return text;
}

/**
 * Check if suggestion is recent (created within last 24 hours)
 */
export function isRecentSuggestion(suggestion: any) {
   if (!suggestion.createdAt) return false;
   
   const createdDate = new Date(suggestion.createdAt);
   const now = new Date();
   const hoursDiff = (now.getTime() - createdDate.getTime()) / (1000 * 60 * 60);
   
   return hoursDiff <= 24;
}

/**
 * Format suggestion date
 */
export function formatSuggestionDate(dateString: string) {
   const date = new Date(dateString);
   const now = new Date();
   const hoursDiff = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
   
   if (hoursDiff < 1) {
      return 'Just now';
   } else if (hoursDiff < 24) {
      return `${Math.floor(hoursDiff)}h ago`;
   } else if (hoursDiff < 48) {
      return 'Yesterday';
   } else {
      return date.toLocaleDateString('en-US', {
         month: 'short',
         day: 'numeric',
         year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
      });
   }
}