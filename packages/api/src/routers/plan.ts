import { z } from "zod";

import { protectedProcedure } from "../index";
import * as db from "@monthly-zen/db";
import { buildSystemPrompt } from "../lib/prompt-builder";
import { collectChatCompletion, type OpenRouterMessage } from "../lib/openrouter";

const fixedCommitmentsSchema = z.object({
  commitments: z.array(
    z.object({
      dayOfWeek: z.string(),
      startTime: z.string(),
      endTime: z.string(),
      description: z.string(),
    }),
  ),
});

const resolutionsSchema = z.object({
  resolutions: z.array(
    z.object({
      title: z.string().min(1),
      category: z.string().min(1),
      targetCount: z.number().int().min(1),
    }),
  ),
});

const generationInputSchema = z.object({
  mainGoal: z.string().min(1),
  coachName: z.string().min(1).optional(),
  coachTone: z.enum(["encouraging", "direct", "analytical", "friendly"]).optional(),
  taskComplexity: z.enum(["Simple", "Balanced", "Ambitious"]),
  focusAreas: z.string().min(1),
  weekendPreference: z.enum(["Work", "Rest", "Mixed"]),
  resolutionsJson: resolutionsSchema,
  fixedCommitmentsJson: fixedCommitmentsSchema,
});

const generationStatusSchema = z.object({
  jobId: z.number().int().positive(),
});

const planByIdSchema = z.object({
  planId: z.number().int().positive(),
});

const saveDraftFromConversationSchema = z.object({
  conversationId: z.string().min(1),
  monthYear: z.string().optional(),
});

const getDraftSchema = z.object({
  draftKey: z.string().min(1),
});

const currentMonthYear = () => {
  const now = new Date();
  const year = String(now.getFullYear());
  const month = String(now.getMonth() + 1).padStart(2, "0");
  return `${year}-${month}-01`;
};

const buildPrompt = (input: z.infer<typeof generationInputSchema>, monthYear: string) => {
  const resolutionsText =
    input.resolutionsJson.resolutions.length > 0
      ? input.resolutionsJson.resolutions
          .map(
            (resolution) =>
              `- ${resolution.title} (${resolution.category}): ${resolution.targetCount} sessions/year`,
          )
          .join("\n")
      : "No resolutions set for this year";

  const fixedCommitmentsText =
    input.fixedCommitmentsJson.commitments.length > 0
      ? input.fixedCommitmentsJson.commitments
          .map(
            (commitment) =>
              `- ${commitment.dayOfWeek} from ${commitment.startTime} to ${commitment.endTime}: ${commitment.description}`,
          )
          .join("\n")
      : "No fixed commitments";

  const businessHoursStart = "09:00";
  const businessHoursEnd = "18:00";
  const currentDate = new Date();

  return `Generate a monthly productivity plan with the following requirements:

**User Goals:**
${input.mainGoal}

**Yearly Resolutions (Integrate these into your task planning):**
${resolutionsText}

**Preferences:**
- Task Complexity: ${input.taskComplexity}
- Focus Areas: ${input.focusAreas}
- Weekend Preference: ${input.weekendPreference}

**Fixed Commitments (IMPORTANT - Do NOT schedule tasks during these times):**
${fixedCommitmentsText}

**Context:**
- Month: ${monthYear}
- Plan Start Date: ${currentDate.toISOString()} (Start scheduling tasks from this date, NOT from the beginning of the month)
- Typical business hours: ${businessHoursStart} - ${businessHoursEnd}

**Output Format (Strict JSON):**
{
  "monthly_summary": "A clear overview of the plan and key objectives",
  "weekly_breakdown": [
    {
      "week": 1,
      "focus": "Main theme for this week",
      "goals": ["Weekly goal 1", "Weekly goal 2"],
      "daily_tasks": {
        "Monday": [
          {
            "task_description": "Specific, actionable task",
            "focus_area": "Category from user's focus areas",
            "start_time": "ISO 8601 combined date and time (e.g., 2025-01-01T09:00:00Z)",
            "end_time": "ISO 8601 combined date and time",
            "difficulty_level": "simple|moderate|advanced",
            "scheduling_reason": "Why this task is scheduled at this time"
          }
        ],
        "Tuesday": [],
        "Wednesday": [],
        "Thursday": [],
        "Friday": [],
        "Saturday": [],
        "Sunday": []
      }
    }
  ]
}

**Scheduling Requirements (CRITICAL):**
1. **START FROM CURRENT DATE**: Begin scheduling tasks from ${currentDate.toISOString().split("T")[0]}, NOT from the beginning of the month
2. **RESPECT FIXED COMMITMENTS**: Absolutely DO NOT schedule any tasks during the user's fixed commitment time slots listed above
3. For each scheduled task, verify start_time and end_time do NOT overlap with any fixed commitment
4. On days with fixed commitments, avoid advanced tasks; keep workloads lighter where possible
5. Create realistic, achievable tasks based on complexity level (${input.taskComplexity})
6. Respect the user's weekend preference (${input.weekendPreference})
7. **PRIORITIZE RESOLUTIONS**: When generating tasks, actively work toward completing the user's yearly resolutions listed above. Each resolution should have at least 1-2 supporting tasks per week
8. Focus primarily on these areas: ${input.focusAreas}
9. Provide clear, actionable task descriptions with estimated durations
10. Consider business hours (${businessHoursStart}-${businessHoursEnd}) when scheduling, unless the user's commitments indicate otherwise
11. Spread tasks evenly throughout the week when possible

**Task Complexity Guide:**
- Simple: 3-5 shorter tasks per day, 30-60 minutes each
- Balanced: 2-3 medium tasks per day, 1-2 hours each
- Ambitious: 1-2 complex tasks per day, 2-4 hours each

Please generate a complete monthly plan following this structure.`;
};

async function runPlanGeneration({
  jobId,
  userId,
  input,
}: {
  jobId: number;
  userId: string;
  input: z.infer<typeof generationInputSchema>;
}) {
  await db.updatePlanGenerationJob(jobId, { status: "running" });

  try {
    const preferences = await db.createOrUpdatePreferences(userId, {
      coachName: input.coachName,
      coachTone: input.coachTone,
      taskComplexity: input.taskComplexity,
      weekendPreference: input.weekendPreference,
      fixedCommitmentsJson: input.fixedCommitmentsJson,
    });

    if (!preferences) {
      throw new Error("Failed to save user preferences");
    }

    const monthYear = new Date().toISOString().slice(0, 10);
    const prompt = buildPrompt(input, monthYear);
    const model = process.env.OPENROUTER_MODEL ?? "google/gemini-2.5-flash";
    const timeoutMsRaw = Number.parseInt(process.env.OPENROUTER_TIMEOUT_MS ?? "60000", 10);
    const timeoutMs = Number.isFinite(timeoutMsRaw) && timeoutMsRaw > 0 ? timeoutMsRaw : 60000;
    const systemPrompt =
      process.env.OPENROUTER_SYSTEM_PROMPT ??
      buildSystemPrompt({
        coachName: input.coachName,
        responseTone: input.coachTone,
        taskComplexity: input.taskComplexity,
        weekendPreference: input.weekendPreference,
        focusArea: input.focusAreas,
      });
    const messages: OpenRouterMessage[] = [
      { role: "system", content: systemPrompt },
      { role: "user", content: prompt },
    ];

    let content: string;
    try {
      ({ content } = await collectChatCompletion({
        model,
        messages,
        timeoutMs,
      }));
    } catch (error) {
      if (error instanceof Error && error.name === "TimeoutError") {
        throw new Error("Plan generation timed out. Please try again.");
      }
      throw error;
    }

    const conversation = await db.createConversation(userId, input.mainGoal || "Monthly Plan");

    if (!conversation) {
      throw new Error("Failed to create conversation");
    }
    const userSummary = `Goal: ${input.mainGoal}\nFocus areas: ${input.focusAreas}\nComplexity: ${input.taskComplexity}\nWeekend: ${input.weekendPreference}`;

    await db.addMessage({
      conversationId: conversation.id,
      role: "user",
      content: userSummary,
      status: "final",
    });

    await db.addMessage({
      conversationId: conversation.id,
      role: "assistant",
      content,
      status: "final",
      meta: { label: "Onboarding Plan" },
    });

    await db.updateConversation(userId, conversation.id, {
      lastMessagePreview: content.slice(0, 120),
    });

    await db.updatePlanGenerationJob(jobId, {
      status: "completed",
      responseText: content,
      planId: null,
      conversationId: conversation.id,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to generate plan";
    await db.updatePlanGenerationJob(jobId, {
      status: "failed",
      errorMessage: message,
    });
  }
}

export const planRouter = {
  startFirstGeneration: protectedProcedure
    .input(generationInputSchema)
    .handler(async ({ input, context }) => {
      const userId = context.session.user.id;
      const latestJob = await db.getLatestPlanGenerationJobByUser(userId);
      if (latestJob && (latestJob.status === "pending" || latestJob.status === "running")) {
        return { success: true, jobId: latestJob.id };
      }

      const job = await db.createPlanGenerationJob({ userId, requestPayload: input });

      if (!job) {
        return { success: false, error: "Failed to start generation" };
      }

      void runPlanGeneration({ jobId: job.id, userId, input });

      return { success: true, jobId: job.id };
    }),
  getGenerationStatus: protectedProcedure
    .input(generationStatusSchema)
    .handler(async ({ input, context }) => {
      const userId = context.session.user.id;
      const job = await db.getPlanGenerationJobById(input.jobId);

      if (!job || job.userId !== userId) {
        return { success: false, error: "Generation job not found" };
      }

      return {
        success: true,
        data: {
          status: job.status,
          planId: job.planId,
          conversationId: job.conversationId,
          errorMessage: job.errorMessage,
        },
      };
    }),
  getById: protectedProcedure.input(planByIdSchema).handler(async ({ input, context }) => {
    const userId = context.session.user.id;
    const ownership = await db.verifyPlanOwnership(input.planId, userId);
    if (!ownership) {
      return { success: false, error: "You do not have access to this plan" };
    }

    const plan = await db.getMonthlyPlanById(input.planId);
    if (!plan) {
      return { success: false, error: "Plan not found" };
    }

    return { success: true, data: plan };
  }),

  saveDraftFromConversation: protectedProcedure
    .input(saveDraftFromConversationSchema)
    .handler(async ({ input, context }) => {
      const userId = context.session.user.id;
      const message = await db.getLatestAssistantMessage(userId, input.conversationId);

      if (!message || !message.content.trim()) {
        return { success: false, error: "No assistant response to save" };
      }

      const preferences =
        (await db.getUserPreferences(userId)) ?? (await db.createOrUpdatePreferences(userId, {}));

      if (!preferences) {
        return { success: false, error: "Unable to load user preferences" };
      }

      const monthYear = input.monthYear ?? currentMonthYear();

      const planData = {
        source: "conversation" as const,
        conversationId: input.conversationId,
        assistantMessageId: message.id,
        content: message.content,
      };

      const { draftKey } = await db.createDraft(
        userId,
        planData,
        preferences.id,
        monthYear,
        "Saved from chat",
      );

      return { success: true, draftKey };
    }),

  getDraft: protectedProcedure.input(getDraftSchema).handler(async ({ input, context }) => {
    const userId = context.session.user.id;
    const draft = await db.getDraft(userId, input.draftKey);

    if (!draft) {
      return { success: false, error: "Draft not found" };
    }

    return { success: true, data: draft };
  }),
};
