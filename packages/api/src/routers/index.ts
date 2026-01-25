import type { RouterClient } from "@orpc/server";

import { chatRouter } from "./chat";
import { planRouter } from "./plan";
import { preferencesRouter } from "./preferences";
import { userRouter } from "./user";

export const appRouter = {
  chat: chatRouter,
  plan: planRouter,
  preferences: preferencesRouter,
  user: userRouter,
};

export type AppRouter = typeof appRouter;
export type AppRouterClient = RouterClient<typeof appRouter>;
