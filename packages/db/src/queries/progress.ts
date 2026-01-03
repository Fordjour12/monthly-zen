import { db } from "../index";
import { sql } from "drizzle-orm";

export interface HabitStat {
  focusArea: string;
  totalTasks: number;
  completedTasks: number;
  completionRate: number;
}

export interface MilestoneTask {
  id: number;
  taskDescription: string;
  focusArea: string;
  startTime: Date;
  endTime: Date;
  difficultyLevel: string | null;
  isCompleted: boolean;
  completedAt: Date | null;
}

export async function getHabitConsistency(
  userId: string,
  startDate: Date,
  endDate: Date,
): Promise<HabitStat[]> {
  const result = await db.execute(sql`
    SELECT
      pt.focus_area as "focusArea",
      COUNT(*) as "totalTasks",
      COUNT(CASE WHEN pt.is_completed = true THEN 1 END) as "completedTasks"
    FROM plan_tasks pt
    JOIN monthly_plans mp ON pt.plan_id = mp.id
    WHERE mp.user_id = ${userId}
      AND pt.start_time >= ${startDate}
      AND pt.end_time <= ${endDate}
    GROUP BY pt.focus_area
  `);

  // Drizzle's execute result depends on the driver, but often it's the rows directly or result.rows
  // Assuming it returns an array-like object or we can cast
  const rows = Array.isArray(result) ? result : (result as any).rows || [];

  return rows.map((row: any) => ({
    focusArea: row.focusArea,
    totalTasks: Number(row.totalTasks),
    completedTasks: Number(row.completedTasks),
    completionRate:
      Number(row.totalTasks) > 0 ? (Number(row.completedTasks) / Number(row.totalTasks)) * 100 : 0,
  }));
}

export async function getMilestones(
  userId: string,
  startDate: Date,
  endDate: Date,
): Promise<MilestoneTask[]> {
  const result = await db.execute(sql`
    SELECT
      pt.id,
      pt.task_description as "taskDescription",
      pt.focus_area as "focusArea",
      pt.start_time as "startTime",
      pt.end_time as "endTime",
      pt.difficulty_level as "difficultyLevel",
      pt.is_completed as "isCompleted",
      pt.completed_at as "completedAt"
    FROM plan_tasks pt
    JOIN monthly_plans mp ON pt.plan_id = mp.id
    WHERE mp.user_id = ${userId}
      AND pt.start_time >= ${startDate}
      AND pt.end_time <= ${endDate}
      AND (pt.difficulty_level = 'Ambitious' OR pt.difficulty_level = 'Hard')
    ORDER BY pt.start_time ASC
  `);

  const rows = Array.isArray(result) ? result : (result as any).rows || [];

  return rows.map((row: any) => ({
    id: Number(row.id),
    taskDescription: row.taskDescription,
    focusArea: row.focusArea,
    startTime: new Date(row.startTime),
    endTime: new Date(row.endTime),
    difficultyLevel: row.difficultyLevel,
    isCompleted: row.isCompleted === true,
    completedAt: row.completedAt ? new Date(row.completedAt) : null,
  }));
}
