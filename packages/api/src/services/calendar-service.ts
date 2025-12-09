import type { RescheduleSuggestionContent } from "@my-better-t-app/db";
import type { AIResponse, AIServiceConfig } from "../lib";
import { executeAIRequest } from "../lib/executeAIRequest";


/**
     * Generate reschedule suggestions
     */
export async function generateReschedule(
   backlogTasks: Array<{ title: string; priority: string; dueDate: string }>,
   config?: AIServiceConfig
): Promise<AIResponse<RescheduleSuggestionContent>> {
   const prompt = `Generate reschedule suggestions for these overdue tasks:
      ${backlogTasks.map(task => `- ${task.title} (${task.priority}, due: ${task.dueDate})`).join('\n')}

      Return a JSON response with this structure:
      {
        "reason": "Reason for rescheduling",
        "affectedTasks": [
          {
            "taskId": "task-id",
            "currentDueDate": "YYYY-MM-DD",
            "suggestedDueDate": "YYYY-MM-DD"

        ],
        "affectedEvents": [
          {
            "eventId": "event-id",
            "title": "Event title",
            "originalDate": "YYYY-MM-DD",
            "suggestedDate": "YYYY-MM-DD"
          }
        ]
      }`;

   const systemPrompt = "You are a helpful scheduling assistant. Suggest realistic reschedule dates considering task priorities and dependencies.";

   return await executeAIRequest<
      Array<{ title: string; priority: string; dueDate: string }>,
      RescheduleSuggestionContent
   >({
      type: "reschedule",
      input: backlogTasks,
      prompt,
      systemPrompt,
      config,
   });
}
