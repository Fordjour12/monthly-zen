import { createDraft } from "../packages/db/src/queries/plan-drafts";
import { confirmDraftAsPlan } from "../packages/db/src/queries/plan-generation";
import {
  getMonthlyPlanByUserAndMonth,
  getCurrentMonthlyPlanWithTasks,
} from "../packages/db/src/queries/monthly-plans";
import { db } from "../packages/db/src";
import { user } from "../packages/db/src/schema/auth";
import { userGoalsAndPreferences } from "../packages/db/src/schema/user-goals-and-preferences";

async function main() {
  console.log("Starting verification of DRAFT -> PLAN flow...");

  // 1. Setup Mock Data
  const timestamp = Date.now();
  const mockUserId = `test-user-${timestamp}`;
  const mockMonth = "2025-02-01"; // Distinct month

  // Create a test user
  try {
    await db.insert(user).values({
      id: mockUserId,
      email: `test-${timestamp}@example.com`,
      name: "Test User",
      emailVerified: true,
      image: null,
    });
  } catch (e) {
    console.log("User exists/failed", e);
  }

  // Create preferences
  const [pref] = await db
    .insert(userGoalsAndPreferences)
    .values({
      userId: mockUserId,
      goalsText: "Test Goal",
      taskComplexity: "Balanced",
      focusAreas: "Coding",
      weekendPreference: "Rest",
      fixedCommitmentsJson: {},
    })
    .returning();

  const mockPlanData = {
    monthly_summary: "Confirmed Draft Plan",
    weekly_breakdown: [
      {
        week: 1,
        daily_tasks: {
          Monday: [
            {
              task_description: "Draft Task 1",
              focus_area: "Coding",
              start_time: "2025-02-01T09:00:00Z",
              end_time: "2025-02-01T10:00:00Z",
              difficulty_level: "Simple",
              scheduling_reason: "Testing",
            },
          ],
        },
      },
    ],
  };

  // 2. Create Draft
  console.log("Creating Draft...");
  const { draftKey } = await createDraft(
    mockUserId,
    mockPlanData,
    pref.id,
    mockMonth,
    "Test Prompt",
  );
  console.log(`Draft created: ${draftKey}`);

  // 3. Verify NOT visible as Plan
  const existingPlan = await getMonthlyPlanByUserAndMonth(mockUserId, mockMonth);
  if (existingPlan) {
    console.error("FAILED: Draft shouldn't be visible as confirmed plan yet");
    process.exit(1);
  } else {
    console.log("SUCCESS: Draft is hidden from normal plan queries.");
  }

  // 4. Confirm Plan
  console.log("Confirming Plan...");
  const planId = await confirmDraftAsPlan(mockUserId, draftKey);
  console.log(`Plan confirmed: ${planId}`);

  // 5. Verify Plan & Tasks
  const fullPlan = await getCurrentMonthlyPlanWithTasks(mockUserId, mockMonth);

  if (!fullPlan) {
    console.error("FAILED: Plan not found after confirmation");
    process.exit(1);
  }

  if (fullPlan.status !== "CONFIRMED") {
    console.error(`FAILED: Plan status is ${fullPlan.status}, expected CONFIRMED`);
    process.exit(1);
  }

  if (fullPlan.tasks.length !== 1) {
    console.error(`FAILED: Expected 1 task, got ${fullPlan.tasks.length}`);
    process.exit(1);
  }

  if (fullPlan.tasks[0].taskDescription === "Draft Task 1") {
    console.log("SUCCESS: Task extracted correctly.");
  } else {
    console.error("FAILED: Task mismatch");
    process.exit(1);
  }

  console.log("Verification Complete!");
  process.exit(0);
}

main().catch(console.error);
