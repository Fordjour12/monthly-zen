import type { RouterClient } from "@orpc/server";

import { protectedProcedure, publicProcedure } from "../index";
import { planRouter } from "./plan";
import { quotaRouter } from "./quota";
import { tasksRouter } from "./tasks";
import { userRouter } from "./user";
import { calendarRouter } from "./calendar";
import { coachingRouter } from "./coaching";
import { habitsRouter } from "./habits";

export const appRouter = {
  healthCheck: publicProcedure.handler(() => {
    return "OK";
  }),
  privateData: protectedProcedure.handler(({ context }) => {
    return {
      message: "This is private",
      user: context.session?.user,
    };
  }),
  plan: planRouter,
  quota: quotaRouter,
  tasks: tasksRouter,
  user: userRouter,
  calendar: calendarRouter,
  coaching: coachingRouter,
  habits: habitsRouter,
};
export type AppRouter = typeof appRouter;
export type AppRouterClient = RouterClient<typeof appRouter>;
