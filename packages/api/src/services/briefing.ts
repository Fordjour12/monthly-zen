import type { BriefingSuggestionContent } from "@my-better-t-app/db";
import type { AIResponse, AIServiceConfig } from "../lib";
import { executeAIRequest } from "../lib/executeAIRequest";

/**
     * Generate daily briefing
     */
export async function generateBriefing(
   currentDate: string,
   todaysTasks: Array<{ title: string; priority: string }>,
   config?: AIServiceConfig
): Promise<AIResponse<BriefingSuggestionContent>> {
   const prompt = `Generate a daily briefing for ${currentDate} with these tasks:
      ${todaysTasks.map(task => `- ${task.title} (${task.priority})`).join('\n')}

      Return a JSON response with this structure:
      {
        "summary": "Brief summary of the day",
        "todaysTasks": [
          {
            "taskId": "task-id",
            "title": "Task title",
            "priority": "low|medium|high"
          }
        ],
        "upcomingDeadlines": [
          {
            "title": "Deadline title",
            "dueDate": "YYYY-MM-DD",
            "priority": "low|medium|high"
          }
        ],
        "habitReminders": [
          {
            "habit": "Habit name",
            "frequency": "daily|weekly",
            "lastCompleted": "YYYY-MM-DD"
          }
        ]
      }`;

   const systemPrompt = "You are a helpful daily briefing assistant. Provide concise, actionable insights about the day's tasks and schedule.";

   return await executeAIRequest<
      { currentDate: string; todaysTasks: Array<{ title: string; priority: string }> },
      BriefingSuggestionContent
   >({
      type: "briefing",
      input: { currentDate, todaysTasks },
      prompt,
      systemPrompt,
      config,
   });
}
