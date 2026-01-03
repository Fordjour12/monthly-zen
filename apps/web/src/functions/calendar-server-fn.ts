import { createServerFn } from "@tanstack/react-start";

// This file is deprecated - direct orpc usage is preferred in components.
// See: apps/web/src/routes/dashboard.tsx and settings.tsx for the pattern.
export const getTasksForMonth = createServerFn({ method: "GET" }).handler(async () => {
  throw new Error("Use orpc.calendar.getTasks directly instead");
});
