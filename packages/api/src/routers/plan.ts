import { z } from "zod";

import { protectedProcedure } from "../index";
import * as db from "@monthly-zen/db";
import { collectChatCompletion } from "../lib/openrouter";

const DEFAULT_SYSTEM_PROMPT =
  "You are Monthly Zen, a planning assistant. Create clear month plans, focus maps, and next steps.";

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

const jsonExtraction = (input: string) => {
  const trimmed = input.trim();
  try {
    return JSON.parse(trimmed);
  } catch {
    const start = trimmed.indexOf("{");
    const end = trimmed.lastIndexOf("}");
    if (start === -1 || end === -1 || end <= start) return null;
    try {
      return JSON.parse(trimmed.slice(start, end + 1));
    } catch {
      return null;
    }
  }
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
4. Create realistic, achievable tasks based on complexity level (${input.taskComplexity})
5. Respect the user's weekend preference (${input.weekendPreference})
6. **PRIORITIZE RESOLUTIONS**: When generating tasks, actively work toward completing the user's yearly resolutions listed above. Each resolution should have at least 1-2 supporting tasks per week
7. Focus primarily on these areas: ${input.focusAreas}
8. Provide clear, actionable task descriptions with estimated durations
9. Consider business hours (${businessHoursStart}-${businessHoursEnd}) when scheduling, unless the user's commitments indicate otherwise
10. Spread tasks evenly throughout the week when possible

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
      goalsText: input.mainGoal,
      focusAreas: input.focusAreas,
      taskComplexity: input.taskComplexity,
      weekendPreference: input.weekendPreference,
      resolutionsJson: input.resolutionsJson,
      fixedCommitmentsJson: input.fixedCommitmentsJson,
    });

    const monthYear = new Date().toISOString().split("T")[0];
    const prompt = buildPrompt(input, monthYear);
    const model = process.env.OPENROUTER_MODEL ?? "google/gemini-2.5-flash";

    const { content } = await collectChatCompletion({
      model,
      messages: [
        { role: "system", content: process.env.OPENROUTER_SYSTEM_PROMPT ?? DEFAULT_SYSTEM_PROMPT },
        { role: "user", content: prompt },
      ],
    });

    const parsed = jsonExtraction(content);
    const aiResponse = {
      rawContent: content,
      metadata: {
        contentLength: content.length,
        format: parsed ? "json" : "text",
      },
    };

    const monthlySummary = parsed?.monthly_summary;
    const planData = parsed || { raw: content };
    const planId = await db.saveGeneratedPlan(
      userId,
      preferences.id,
      monthYear,
      prompt,
      aiResponse,
      planData,
      monthlySummary,
    );

    await db.updatePlanGenerationJob(jobId, {
      status: "completed",
      responseText: content,
      planId: planId || null,
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
};
