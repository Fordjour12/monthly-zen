import { z } from "zod";
import { eventIterator } from "@orpc/server";
import { protectedProcedure, publicProcedure } from "../index";
import { generatePlan, confirmPlan } from "../services/hybrid-plan-generation";
import {
  streamPlanAiResponse,
  planAiStreamEventSchema,
  type PlanAiStreamEvent,
} from "../services/plan-ai-stream";
import { generateInputSchema } from "../services/plan-ai-schema";
import {
  getDraft,
  deleteDraft,
  getLatestDraft,
  getCurrentMonthlyPlanWithTasks,
  getMonthlyPlansByUser,
  getMonthlyPlanWithTasks,
  verifyPlanOwnership,
} from "@monthly-zen/db";
import { responseExtractor } from "@monthly-zen/response-parser";

const confirmInputSchema = z.object({
  draftKey: z.string().min(1, "Draft key is required"),
});

export const planRouter = {
  aiStreamPublic: publicProcedure
    .input(generateInputSchema)
    .output(eventIterator(planAiStreamEventSchema, z.void()))
    .handler(async function* ({ input }): AsyncGenerator<PlanAiStreamEvent> {
      if (process.env.ALLOW_PUBLIC_AI_STREAM !== "true") {
        throw new Error("Public AI streaming is disabled");
      }

      for await (const event of streamPlanAiResponse(input)) {
        if (event.type === "error") {
          yield event;
          return;
        }
        if (event.type === "done") {
          yield event;
          return;
        }
        yield event;
      }
    }),

  aiStream: protectedProcedure
    .input(generateInputSchema)
    .output(eventIterator(planAiStreamEventSchema, z.void()))
    .handler(async function* ({ input }): AsyncGenerator<PlanAiStreamEvent> {
      for await (const event of streamPlanAiResponse(input)) {
        if (event.type === "error") {
          yield event;
          return;
        }
        if (event.type === "done") {
          yield event;
          return;
        }
        yield event;
      }
    }),

  generate: protectedProcedure.input(generateInputSchema).handler(async ({ input, context }) => {
    try {
      const userId = context.session?.user?.id;

      if (!userId) {
        throw new Error("Authentication required");
      }

      const result = await generatePlan({ ...input, userId });

      if (!result.success) {
        throw new Error(result.error);
      }

      return {
        success: true,
        data: {
          draftKey: result.draftKey,
          planData: result.planData,
          preferenceId: result.preferenceId,
          generatedAt: result.generatedAt,
        },
        message: "Plan generated successfully. Review and save when ready.",
      };
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : "Unknown error occurred");
    }
  }),

  confirm: protectedProcedure.input(confirmInputSchema).handler(async ({ input, context }) => {
    try {
      const userId = context.session?.user?.id;

      if (!userId) {
        throw new Error("Authentication required");
      }

      const result = await confirmPlan(userId, input.draftKey);

      if (!result.success) {
        throw new Error(result.error);
      }

      return {
        success: true,
        data: { planId: result.planId },
        message: "Plan saved successfully!",
      };
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : "Unknown error occurred");
    }
  }),

  getDraft: protectedProcedure
    .input(z.object({ key: z.string() }))
    .handler(async ({ input, context }) => {
      try {
        const userId = context.session?.user?.id;

        if (!userId) {
          throw new Error("Authentication required");
        }

        const draft = await getDraft(userId, input.key);

        if (!draft) {
          throw new Error("Draft not found or expired");
        }

        return {
          success: true,
          data: {
            planData: draft.planData,
            draftKey: draft.draftKey,
            createdAt: draft.createdAt,
            expiresAt: draft.expiresAt,
          },
        };
      } catch (error) {
        throw new Error(error instanceof Error ? error.message : "Unknown error occurred");
      }
    }),

  getLatestDraft: protectedProcedure.handler(async ({ context }) => {
    try {
      const userId = context.session?.user?.id;

      if (!userId) {
        throw new Error("Authentication required");
      }

      const draft = await getLatestDraft(userId);

      return {
        success: true,
        data: draft
          ? {
              planData: draft.planData,
              draftKey: draft.draftKey,
              createdAt: draft.createdAt,
              expiresAt: draft.expiresAt,
            }
          : null,
        message: draft ? "Draft found" : "No draft found",
      };
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : "Unknown error occurred");
    }
  }),

  deleteDraft: protectedProcedure
    .input(z.object({ key: z.string() }))
    .handler(async ({ input, context }) => {
      try {
        const userId = context.session?.user?.id;

        if (!userId) {
          throw new Error("Authentication required");
        }

        await deleteDraft(userId, input.key);

        return {
          success: true,
          message: "Draft discarded successfully",
        };
      } catch (error) {
        throw new Error(error instanceof Error ? error.message : "Unknown error occurred");
      }
    }),

  getCurrent: protectedProcedure.handler(async ({ context }) => {
    try {
      const userId = context.session?.user?.id;

      if (!userId) {
        throw new Error("Authentication required");
      }

      const currentDate = new Date();
      const currentMonth = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, "0")}-01`;

      const planWithTasks = await getCurrentMonthlyPlanWithTasks(userId, currentMonth);

      if (!planWithTasks) {
        return { success: false, error: "No active plan found for current month" };
      }

      return { success: true, data: planWithTasks };
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : "Failed to fetch current plan");
    }
  }),

  getPlans: protectedProcedure.handler(async ({ context }) => {
    try {
      const userId = context.session?.user?.id;

      if (!userId) {
        throw new Error("Authentication required");
      }

      const plans = await getMonthlyPlansByUser(userId);

      return {
        success: true,
        data: plans.map((plan) => ({
          id: plan.id,
          monthYear: plan.monthYear,
          summary: plan.monthlySummary,
          status: plan.status,
          generatedAt: plan.generatedAt,
          confidence: plan.extractionConfidence,
        })),
      };
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : "Failed to fetch plans");
    }
  }),

  getPlanById: protectedProcedure
    .input(z.object({ planId: z.number() }))
    .handler(async ({ input, context }) => {
      try {
        const userId = context.session?.user?.id;

        if (!userId) {
          throw new Error("Authentication required");
        }

        const ownership = await verifyPlanOwnership(input.planId, userId);
        if (!ownership) {
          throw new Error("You do not have access to this plan");
        }

        const planWithTasks = await getMonthlyPlanWithTasks(input.planId);

        if (!planWithTasks) {
          throw new Error("Plan not found");
        }

        const parsedResponse = responseExtractor.extractAllStructuredData(
          typeof planWithTasks.rawAiResponse === "string"
            ? planWithTasks.rawAiResponse
            : JSON.stringify(planWithTasks.aiResponseRaw),
        );

        return {
          success: true,
          data: {
            plan: planWithTasks,
            parsed: parsedResponse,
          },
        };
      } catch (error) {
        throw new Error(error instanceof Error ? error.message : "Failed to fetch plan");
      }
    }),
};
