import {
  createGoalPreference,
  createDraft,
  getDraft,
  deleteDraft,
  saveGeneratedPlan,
} from "@monthly-zen/db";
import { getOpenRouterService } from "../lib/openrouter";
import { responseExtractor } from "../lib/response-extractor";

export interface GeneratePlanInput {
  userId: string;
  goalsText: string;
  taskComplexity: "Simple" | "Balanced" | "Ambitious";
  focusAreas: string;
  weekendPreference: "Work" | "Rest" | "Mixed";
  fixedCommitmentsJson: {
    commitments: Array<{
      dayOfWeek: string;
      startTime: string;
      endTime: string;
      description: string;
    }>;
  };
}

export interface GeneratePlanResult {
  success: true;
  draftKey: string;
  planData: any;
  preferenceId: number;
  generatedAt: string;
}

export interface GeneratePlanError {
  success: false;
  error: string;
}

export async function generatePlan(
  input: GeneratePlanInput,
): Promise<GeneratePlanResult | GeneratePlanError> {
  try {
    console.log(`[Plan Generation] Starting for user: ${input.userId}`);
    console.log(
      `[Plan Generation] Commitments received:`,
      JSON.stringify(input.fixedCommitmentsJson, null, 2),
    );

    const preference = await createGoalPreference({
      userId: input.userId,
      goalsText: input.goalsText,
      taskComplexity: input.taskComplexity,
      focusAreas: input.focusAreas,
      weekendPreference: input.weekendPreference,
      fixedCommitmentsJson: input.fixedCommitmentsJson,
    });

    if (!preference) {
      return { success: false, error: "Failed to save planning inputs" };
    }

    console.log(`[Plan Generation] Preferences saved with ID: ${preference.id}`);

    const prompt = buildPrompt(input);
    const openRouter = getOpenRouterService();

    console.log(`[Plan Generation] Calling AI service...`);
    const aiResponse = await openRouter.generatePlan(prompt);
    console.log(`[Plan Generation] AI response received, length: ${aiResponse.rawContent.length}`);

    const parsedResponse = responseExtractor.extractAllStructuredData(aiResponse.rawContent);

    const monthYear = new Date().toISOString().slice(0, 7) + "-01";

    const planData = parsedResponse.structuredData;

    console.log(
      `[Plan Generation] Plan data extracted, confidence: ${parsedResponse.metadata.confidence}%`,
    );

    const { draftKey } = await createDraft(input.userId, planData, preference.id, monthYear);

    console.log(`[Plan Generation] Draft created with key: ${draftKey}`);

    return {
      success: true,
      draftKey,
      planData,
      preferenceId: preference.id,
      generatedAt: new Date().toISOString(),
    };
  } catch (error) {
    console.error("[Plan Generation] Failed:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Generation failed",
    };
  }
}

export async function confirmPlan(
  userId: string,
  draftKey: string,
): Promise<{ success: true; planId: number } | { success: false; error: string }> {
  try {
    console.log(`[Plan Confirm] Starting for user: ${userId}, draft: ${draftKey}`);

    const draft = await getDraft(userId, draftKey);
    if (!draft) {
      return { success: false, error: "Draft not found or expired" };
    }

    console.log(`[Plan Confirm] Draft found, saving to monthly_plans...`);

    const planId = await saveGeneratedPlan(
      userId,
      draft.goalPreferenceId,
      draft.monthYear,
      "",
      {
        rawContent: JSON.stringify(draft.planData),
        metadata: {
          contentLength: JSON.stringify(draft.planData).length,
          format: "json" as const,
        },
      },
      draft.planData,
      draft.planData.monthly_summary,
      90,
      "Draft confirmed and saved",
    );

    console.log(`[Plan Confirm] Plan saved with ID: ${planId}`);

    await deleteDraft(userId, draftKey);
    console.log(`[Plan Confirm] Draft deleted`);

    return { success: true, planId };
  } catch (error) {
    console.error("[Plan Confirm] Failed:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Save failed",
    };
  }
}

function buildPrompt(input: GeneratePlanInput): string {
  const currentDate = new Date();
  const monthYear = currentDate.toISOString().slice(0, 7) + "-01";

  const fixedCommitmentsText =
    input.fixedCommitmentsJson.commitments.length > 0
      ? input.fixedCommitmentsJson.commitments
          .map((c) => `- ${c.dayOfWeek} from ${c.startTime} to ${c.endTime}: ${c.description}`)
          .join("\n")
      : "No fixed commitments";

  const businessHoursStart = "09:00";
  const businessHoursEnd = "18:00";

  return `Generate a monthly productivity plan with the following requirements:

**User Goals:**
${input.goalsText}

**Preferences:**
- Task Complexity: ${input.taskComplexity}
- Focus Areas: ${input.focusAreas}
- Weekend Preference: ${input.weekendPreference}

**Fixed Commitments (IMPORTANT - Do NOT schedule tasks during these times):**
${fixedCommitmentsText}

**Context:**
- Month: ${monthYear}
- Current Date: ${currentDate.toISOString()}
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
1. **RESPECT FIXED COMMITMENTS**: Absolutely DO NOT schedule any tasks during the user's fixed commitment time slots listed above
2. For each scheduled task, verify the start_time and end_time do NOT overlap with any fixed commitment
3. Create realistic, achievable tasks based on complexity level (${input.taskComplexity})
4. Respect the user's weekend preference (${input.weekendPreference})
5. Focus primarily on these areas: ${input.focusAreas}
6. Provide clear, actionable task descriptions with estimated durations
7. Consider business hours (${businessHoursStart}-${businessHoursEnd}) when scheduling, unless the user's commitments indicate otherwise
8. Spread tasks evenly throughout the week when possible

**Task Complexity Guide:**
- Simple: 3-5 shorter tasks per day, 30-60 minutes each
- Balanced: 2-3 medium tasks per day, 1-2 hours each
- Ambitious: 1-2 complex tasks per day, 2-4 hours each

Please generate a complete monthly plan following this structure.`;
}
