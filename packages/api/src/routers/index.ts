import type { RouterClient } from "@orpc/server";

import { chatRouter } from "./chat";
import { preferencesRouter } from "./preferences";
import { userRouter } from "./user";

export const appRouter = {
  chat: chatRouter,
  preferences: preferencesRouter,
  user: userRouter,
};

export type AppRouter = typeof appRouter;
export type AppRouterClient = RouterClient<typeof appRouter>;
