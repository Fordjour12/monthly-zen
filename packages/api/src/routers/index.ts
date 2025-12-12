import { protectedProcedure, publicProcedure } from "../index";
import type { RouterClient } from "@orpc/server";
import { AiRouter } from "./ai";
import { calendarRouter } from "./calendar";
import { userPreferencesRouter } from "./user-preferences";

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
   AI: AiRouter,
   calendar: calendarRouter,
   userPreferences: userPreferencesRouter,
};
export type AppRouter = typeof appRouter;
export type AppRouterClient = RouterClient<typeof appRouter>;
