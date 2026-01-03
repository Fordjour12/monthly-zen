import * as db from "@monthly-zen/db";
import { getOpenRouterService } from "../lib/openrouter";
import { responseExtractor } from "@monthly-zen/response-parser";
import type { GenerationQuota } from "@monthly-zen/db";

// Proper type for fixed commitments
interface FixedCommitment {
  dayOfWeek: string;
  startTime: string;
  endTime: string;
  description: string;
}

interface FixedCommitmentsJson {
  commitments: FixedCommitment[];
}

export interface GeneratePlanInput {
  userId: string;
  goalsText: string;
  taskComplexity: "Simple" | "Balanced" | "Ambitious";
  focusAreas: string;
  weekendPreference: "Work" | "Rest" | "Mixed";
  fixedCommitmentsJson: FixedCommitmentsJson;
}

export interface GeneratePlanResult {
  success: true;
  draftKey: string;
  planData: unknown;
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
  const currentDate = new Date();
  const currentMonth = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, "0")}-01`;

  try {
    console.log(`[Plan Generation] Starting for user: ${input.userId}`);
    console.log(
      `[Plan Generation] Commitments received:`,
      JSON.stringify(input.fixedCommitmentsJson, null, 2),
    );

    // Get or create quota
    let quota = await db.getCurrentQuota(input.userId, currentMonth);

    if (!quota) {
      const resetDate = addMonthsToDate(currentDate.toISOString(), 1);
      quota = await db.createGenerationQuota({
        userId: input.userId,
        monthYear: currentMonth,
        totalAllowed: 50,
        generationsUsed: 0,
        resetsOn: resetDate,
      });

      if (!quota) {
        console.error(`[Plan Generation] Failed to create quota for user ${input.userId}`);
        return { success: false, error: "Failed to initialize quota" };
      }
    } else {
      quota = await checkAndResetQuota(input.userId, quota);
      if (!quota) {
        console.error(`[Plan Generation] Failed to reset quota for user ${input.userId}`);
        return { success: false, error: "Failed to reset quota" };
      }
    }

    const quotaStatus = calculateQuotaStatus(quota);
    if (quotaStatus.status === "exceeded") {
      console.error(`[Plan Generation] Quota exceeded for user ${input.userId}`);
      return { success: false, error: "Generation quota exceeded. Please request more tokens." };
    }

    console.log(`[Plan Generation] Quota check passed. Remaining: ${quotaStatus.remaining}`);

    // Try to decrement quota atomically - this will fail if quota would be exceeded
    const decrementedQuota = await db.decrementGenerationQuota(quota.id);
    if (!decrementedQuota) {
      console.error(
        `[Plan Generation] Failed to decrement quota for user ${input.userId} (possibly exceeded)`,
      );
      return { success: false, error: "Generation quota exceeded. Please request more tokens." };
    }

    const preference = await db.createGoalPreference({
      userId: input.userId,
      goalsText: input.goalsText,
      taskComplexity: input.taskComplexity,
      focusAreas: input.focusAreas,
      weekendPreference: input.weekendPreference,
      fixedCommitmentsJson: input.fixedCommitmentsJson,
    });

    if (!preference) {
      // Rollback quota decrement on failure
      await db.updateGenerationQuota(quota.id, { generationsUsed: quota.generationsUsed });
      return { success: false, error: "Failed to save planning inputs" };
    }

    console.log(`[Plan Generation] Preferences saved with ID: ${preference.id}`);

    // Fetch user's resolutions for the current year
    const currentYear = currentDate.getFullYear();
    const resolutions = await db.getResolutionsWithProgress(input.userId, currentYear);
    console.log(`[Plan Generation] Found ${resolutions?.length || 0} resolutions for user`);

    const prompt = buildPrompt(input, currentDate, currentMonth, resolutions);
    const openRouter = getOpenRouterService();

    console.log(`[Plan Generation] Calling AI service...`);
    const aiResponse = await openRouter.generatePlan(prompt);
    console.log(`[Plan Generation] AI response received, length: ${aiResponse.rawContent.length}`);

    const parsedResponse = responseExtractor.extractAllStructuredData(aiResponse.rawContent);

    const planData = parsedResponse.structuredData;

    console.log(
      `[Plan Generation] Plan data extracted, confidence: ${parsedResponse.metadata.confidence}%`,
    );

    const { draftKey } = await db.createDraft(
      input.userId,
      planData,
      preference.id,
      currentMonth,
      prompt,
    );

    console.log(`[Plan Generation] Draft created with key: ${draftKey}`);

    return {
      success: true,
      draftKey,
      planData,
      preferenceId: preference.id,
      generatedAt: currentDate.toISOString(),
    };
  } catch (error) {
    console.error("[Plan Generation] Failed:", error);

    // Note: We don't rollback the quota decrement here because:
    // 1. The failure might be transient and a retry should work
    // 2. The AI service was actually called (incurring cost)
    // 3. If quota was decremented, it means the user had quota available
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

    const planId = await db.confirmDraftAsPlan(userId, draftKey);

    console.log(`[Plan Confirm] Plan confirmed and saved with ID: ${planId}`);

    return { success: true, planId };
  } catch (error) {
    console.error("[Plan Confirm] Failed:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Confirm failed",
    };
  }
}

/**
 * Adds months to a date string using proper date math.
 * Handles month rollovers and leap years correctly.
 */
function addMonthsToDate(dateString: string, monthsToAdd: number): string {
  const date = new Date(dateString);
  const originalDay = date.getDate();

  // Add months (handles overflow automatically)
  date.setMonth(date.getMonth() + monthsToAdd);

  // If day changed (e.g., Jan 31 -> Feb 28), adjust to last day of month
  if (date.getDate() !== originalDay) {
    date.setDate(0);
  }

  const result = date.toISOString().split("T");
  return result[0] ?? date.toISOString().slice(0, 10);
}

interface QuotaStatus {
  remaining: number;
  usagePercentage: number;
  daysUntilReset: number;
  status: "active" | "low" | "exceeded";
}

function calculateQuotaStatus(quota: GenerationQuota): QuotaStatus {
  const totalAllowed = quota.totalAllowed ?? 50;
  const generationsUsed = quota.generationsUsed ?? 0;
  const remaining = Math.max(0, totalAllowed - generationsUsed);
  const usagePercentage = totalAllowed > 0 ? (generationsUsed / totalAllowed) * 100 : 0;

  const resetDate = new Date(quota.resetsOn);
  const today = new Date();
  const daysUntilReset = Math.ceil((resetDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

  let status: "active" | "low" | "exceeded" = "active";
  if (usagePercentage >= 100) {
    status = "exceeded";
  } else if (usagePercentage >= 80) {
    status = "low";
  }

  return {
    remaining,
    usagePercentage: Math.round(usagePercentage),
    daysUntilReset: Math.max(0, daysUntilReset),
    status,
  };
}

/**
 * Checks if a quota needs to be reset and resets it if expired.
 * Creates history entries for any missed months.
 * Returns the current quota (either original or newly created).
 */
async function checkAndResetQuota(
  userId: string,
  existingQuota: GenerationQuota,
): Promise<GenerationQuota | null> {
  const now = new Date();
  const resetsOn = new Date(existingQuota.resetsOn);

  if (resetsOn > now) {
    return existingQuota;
  }

  console.log(`[Quota Reset] Resetting expired quota for user ${userId}`);

  await db.archiveQuota({
    id: existingQuota.id,
    userId: existingQuota.userId,
    monthYear: existingQuota.monthYear,
    totalAllowed: existingQuota.totalAllowed,
    generationsUsed: existingQuota.generationsUsed ?? 0,
    resetsOn: existingQuota.resetsOn,
    periodStart: resetsOn.toISOString(),
  });

  // Calculate how many months have passed using proper date math
  let monthsPassed = 0;
  const tempDate = new Date(resetsOn);

  while (tempDate < now) {
    tempDate.setMonth(tempDate.getMonth() + 1);
    monthsPassed++;
  }

  let currentQuota: GenerationQuota | null = existingQuota;
  let lastResetDate = resetsOn;

  for (let i = 0; i < monthsPassed; i++) {
    const nextResetDate = addMonthsToDate(lastResetDate.toISOString(), 1);
    const nextMonthYear = nextResetDate.substring(0, 7) + "-01";

    if (i < monthsPassed - 1) {
      await db.createQuotaHistoryEntry({
        userId: String(userId),
        periodStart: new Date(lastResetDate),
        periodEnd: new Date(nextResetDate),
        monthYear: nextMonthYear,
        totalAllowed: 50,
        generationsUsed: 0,
        totalRequested: 0,
        wasAutoReset: new Date(lastResetDate),
      });
    } else {
      currentQuota = await db.createGenerationQuota({
        userId: String(userId),
        monthYear: nextMonthYear,
        totalAllowed: 50,
        generationsUsed: 0,
        resetsOn: nextResetDate,
      });
    }

    lastResetDate = new Date(nextResetDate);
  }

  console.log(`[Quota Reset] Created ${monthsPassed} month(s) of quota for user ${userId}`);

  return currentQuota;
}

function buildPrompt(
  input: GeneratePlanInput,
  currentDate: Date,
  monthYear: string,
  resolutions?: {
    id: number;
    title: string;
    category: string;
    targetCount: number;
    progress: number;
  }[],
): string {
  // Format resolutions for the prompt
  const resolutionsText =
    resolutions && resolutions.length > 0
      ? resolutions
          .map((r) => `- ${r.title} (${r.category}): ${r.progress}/${r.targetCount} completed)`)
          .join("\n")
      : "No resolutions set for this year";

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
}
