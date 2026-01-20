import type { RouterClient } from "@orpc/server";

import { publicProcedure } from "../index";
import { chatRouter } from "./chat";

export const appRouter = {
  healthCheck: publicProcedure.handler(() => {
    return "OK";
  }),
  chat: chatRouter,
};

export type AppRouter = typeof appRouter;
export type AppRouterClient = RouterClient<typeof appRouter>;
