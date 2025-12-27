import { saveGeneratedPlan } from "../packages/db/src/queries/plan-generation";
import { getCurrentMonthlyPlanWithTasks } from "../packages/db/src/queries/monthly-plans";
import { db } from "../packages/db/src";
import { user } from "../packages/db/src/schema/auth";
import { userGoalsAndPreferences } from "../packages/db/src/schema/user-goals-and-preferences";
import { eq } from "drizzle-orm";

async function main() {
  console.log("Starting verification...");

  // 1. Setup Mock Data
  const timestamp = Date.now();
  const mockUserId = `test-user-${timestamp}`;
  const mockMonth = "2025-01-01"; // Use a distinct month

  // Create a test user for foreign key constraints
  try {
    await db.insert(user).values({
      id: mockUserId,
      email: `test-${timestamp}@example.com`,
      name: "Test User",
      emailVerified: new Date(),
      image: null,
    });
  } catch (e) {
    console.log("User creation failed (might exist), continuing...", e);
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
    monthly_summary: "This is a test plan.",
    weekly_breakdown: [
      {
        week: 1,
        daily_tasks: {
          Monday: [
            {
              task_description: "Test Task 1",
              focus_area: "Coding",
              start_time: "2025-01-01T09:00:00Z",
              end_time: "2025-01-01T10:00:00Z",
              difficulty_level: "Simple",
              scheduling_reason: "Testing",
            },
            {
              description: "Test Task 2 (Legacy Format)", // Test fallback
              focus_area: "Review",
              start_time: "2025-01-01T11:00:00Z",
              end_time: "2025-01-01T12:00:00Z",
              difficulty_level: "Moderate",
            },
          ],
        },
      },
    ],
  };

  const aiResponse = {
    rawContent: JSON.stringify(mockPlanData),
    metadata: { contentLength: 100, format: "json" as const },
  };

  // 2. Run the Function Under Test
  console.log("Calling saveGeneratedPlan...");
  const planId = await saveGeneratedPlan(
    mockUserId,
    pref.id,
    mockMonth,
    "Test Prompt",
    aiResponse,
    mockPlanData,
    "Summary",
    90,
    "Notes",
  );

  if (!planId) {
    console.error("FAILED: saveGeneratedPlan returned 0");
    process.exit(1);
  }
  console.log(`Plan saved with ID: ${planId}`);

  // 3. Verify Results
  console.log("Verifying results...");
  const result = await getCurrentMonthlyPlanWithTasks(mockUserId, mockMonth);

  if (!result) {
    console.error("FAILED: Could not fetch saved plan");
    process.exit(1);
  }

  console.log(`Fetched plan. Task count: ${result.tasks.length}`);

  if (result.tasks.length !== 2) {
    console.error(`FAILED: Expected 2 tasks, found ${result.tasks.length}`);
    process.exit(1);
  }

  const task1 = result.tasks.find((t) => t.taskDescription === "Test Task 1");
  const task2 = result.tasks.find((t) => t.taskDescription === "Test Task 2 (Legacy Format)");

  if (task1 && task2) {
    console.log("SUCCESS: Both tasks found with correct descriptions.");
  } else {
    console.error("FAILED: Task content mismatch", result.tasks);
    process.exit(1);
  }

  console.log("Verification Complete!");

  // Cleanup (Optional, but good practice)
  // In a real env we might truncate, but strict FKs make it annoying.
  // We'll leave it as test data since we generate unique IDs.
  process.exit(0);
}

main().catch(console.error);
