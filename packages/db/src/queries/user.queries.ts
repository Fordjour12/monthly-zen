import { and, desc, eq, gt, gte, lt, lte, sql } from "drizzle-orm";
import { db } from "./index";
import {
   aiSuggestions,
   calendarEvents,
   goals,
   habitLogs,
   habits,
   tasks,
   userPreferences,
} from "./schema";
import type {
   AISuggestion,
   AISuggestionType,
   CalendarEvent,
   Goal,
   Habit,
   HabitLog,
   NewAISuggestion,
   NewUserPreferences,
   Task,
   UserPreferences,
} from "./types";

/


export const userQueries = {
   /**
    * Get all goals for a user with optional status filter
    */
   async findByUser(
      userId: string,
      status?: "active" | "completed" | "archived"
   ): Promise<Goal[]> {
      const conditions = [eq(goals.userId, userId)];
      if (status) {
         conditions.push(eq(goals.status, status));
      }

      return await db.query.goals.findMany({
         where: and(...conditions),
         orderBy: [desc(goals.createdAt)],
      });
   },

   /**
    * Get a goal by ID
    */
   async findById(goalId: string): Promise<Goal | undefined> {
      return await db.query.goals.findFirst({
         where: eq(goals.id, goalId),
      });
   },
}


