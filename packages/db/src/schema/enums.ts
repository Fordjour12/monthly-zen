import { pgEnum } from "drizzle-orm/pg-core";

export const complexityEnum = pgEnum("complexity", ["Simple", "Balanced", "Ambitious"]);
export const weekendEnum = pgEnum("weekend_preference", ["Work", "Rest", "Mixed"]);
export const insightTypeEnum = pgEnum("insight_type", [
  "PeakEnergy",
  "CompletionRate",
  "SessionDuration",
  "Challenges",
]);

export const resolutionTypeEnum = pgEnum("resolution_type", ["monthly", "yearly"]);
