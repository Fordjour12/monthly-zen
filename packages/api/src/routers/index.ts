import type { RouterClient } from "@orpc/server";

import { appRouter as legacyRouter } from "../deprecated/routers/index";
import { chatRouter } from "./chat";

export const appRouter = {
  ...legacyRouter,
  chat: chatRouter,
};

export type AppRouter = typeof appRouter;
export type AppRouterClient = RouterClient<typeof appRouter>;
