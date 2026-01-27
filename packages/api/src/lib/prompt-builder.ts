import { z } from "zod";

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

export const generationStatusSchema = z.object({
  jobId: z.number().int().positive(),
});

export const planByIdSchema = z.object({
  planId: z.number().int().positive(),
});

export const saveDraftFromConversationSchema = z.object({
  conversationId: z.string().min(1),
  monthYear: z.string().optional(),
});

export const getDraftSchema = z.object({
  draftKey: z.string().min(1),
});

export type FixedCommitmentsJson = z.infer<typeof fixedCommitmentsSchema>;
export type ResolutionsJson = z.infer<typeof resolutionsSchema>;
export type PlanGenerationInput = z.infer<typeof generationInputSchema>;

export const currentMonthYear = () => {
  const now = new Date();
  const year = String(now.getFullYear());
  const month = String(now.getMonth() + 1).padStart(2, "0");
  return `${year}-${month}-01`;
};

export const buildPlanPrompt = (input: PlanGenerationInput, monthYear: string) => {
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

type SystemPromptInput = {
  coachName?: string;
  responseTone?: "encouraging" | "direct" | "analytical" | "friendly";
  taskComplexity?: "Simple" | "Balanced" | "Ambitious";
  weekendPreference?: "Work" | "Rest" | "Mixed";
  focusArea?: string;
};

type PlannerSystemPromptOptions = {
  input: PlanGenerationInput;
  monthYear?: string;
  responseTone?: "encouraging" | "direct" | "analytical" | "friendly";
  depth?: "Brief" | "Balanced" | "Deep";
  format?: "Bullets" | "Narrative" | "Checklist";
  extraInstructions?: string;
};

const buildResponseTuningPrompt = ({
  responseTone,
  depth,
  format,
}: {
  responseTone?: PlannerSystemPromptOptions["responseTone"];
  depth?: PlannerSystemPromptOptions["depth"];
  format?: PlannerSystemPromptOptions["format"];
}) => {
  const lines: string[] = [];

  if (responseTone) lines.push(`- Tone: ${responseTone}`);
  if (depth) lines.push(`- Depth: ${depth}`);
  if (format) lines.push(`- Format: ${format}`);

  if (lines.length === 0) return "";
  return `\n\n**Response Tuning (Apply to every reply):**\n${lines.join("\n")}`;
};

export const buildPlannerSystemPrompt = ({
  input,
  monthYear,
  responseTone,
  depth,
  format,
  extraInstructions,
}: PlannerSystemPromptOptions) => {
  const basePrompt = buildPlanPrompt(input, monthYear ?? currentMonthYear());
  const tuningPrompt = buildResponseTuningPrompt({ responseTone, depth, format });
  const extraPrompt = extraInstructions?.trim() ? `\n\n${extraInstructions.trim()}` : "";

  return `${basePrompt}${tuningPrompt}${extraPrompt}`;
};

export const buildSystemPrompt = ({
  coachName,
  responseTone,
  taskComplexity,
  weekendPreference,
  focusArea,
}: SystemPromptInput) => {
  const tone = responseTone ?? "encouraging";
  const complexity = taskComplexity ?? "Balanced";
  const weekend = weekendPreference ?? "Mixed";
  const area = focusArea?.trim() ? focusArea.trim() : "general planning";
  const name = coachName?.trim() ? coachName.trim() : "Monthly Zen";

  return `You are ${name}, a productivity coach for monthly planning. Use a ${tone} tone and focus on ${area}. Build schedules that match ${complexity} complexity and respect a ${weekend} weekend preference. Output should stay concise, actionable, and aligned with the user's planning goals.`;
};

export const getBaseSystemPrompt = () =>
  "You are Monthly Zen, a productivity coach focused on building structured monthly plans.";
