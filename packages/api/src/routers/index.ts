import { protectedProcedure, publicProcedure } from "../index";
import type { RouterClient } from "@orpc/server";
import { AiRouter } from "./ai";
import { calendarRouter } from "./calendar";

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
   calendar: calendarRouter
};
export type AppRouter = typeof appRouter;
export type AppRouterClient = RouterClient<typeof appRouter>;
