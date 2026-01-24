import type { RouterClient } from "@orpc/server";

import { chatRouter } from "./chat";
import { preferencesRouter } from "./preferences";

export const appRouter = {
  chat: chatRouter,
  preferences: preferencesRouter,
};

export type AppRouter = typeof appRouter;
export type AppRouterClient = RouterClient<typeof appRouter>;
