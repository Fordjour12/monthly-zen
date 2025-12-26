import { z } from "zod";
import { protectedProcedure } from "../index";
import * as db from "@monthly-zen/db";
import { addMonthsToDate, calculateQuotaStatus, checkAndResetQuota } from "../services/quota";

export const quotaRouter = {
  getCurrent: protectedProcedure.handler(async ({ context }) => {
    try {
      const userId = context.session?.user?.id;

      if (!userId) {
        throw new Error("User authentication required");
      }

      let quota = await db.getLatestQuota(String(userId));

      if (!quota) {
        const resetDate = addMonthsToDate(new Date().toISOString(), 1);
        const currentMonth = resetDate.substring(0, 7) + "-01";

        quota = await db.createGenerationQuota({
          userId: String(userId),
          monthYear: currentMonth,
          totalAllowed: 50,
          generationsUsed: 0,
          resetsOn: resetDate,
        });
      } else {
        quota = await checkAndResetQuota(String(userId), quota);
      }

      const calculatedStatus = calculateQuotaStatus(quota);

      return {
        success: true,
        data: {
          ...quota,
          ...calculatedStatus,
        },
      };
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : "Failed to fetch quota");
    }
  }),

  initialize: protectedProcedure.handler(async ({ context }) => {
    try {
      const userId = context.session?.user?.id;

      if (!userId) {
        throw new Error("User authentication required");
      }

      const existingQuota = await db.getLatestQuota(String(userId));

      if (existingQuota) {
        const calculatedStatus = calculateQuotaStatus(existingQuota);
        return {
          success: true,
          message: "Quota already exists",
          data: {
            ...existingQuota,
            ...calculatedStatus,
          },
        };
      }

      const resetDate = addMonthsToDate(new Date().toISOString(), 1);
      const currentMonth = resetDate.substring(0, 7) + "-01";

      const quota = await db.createGenerationQuota({
        userId: String(userId),
        monthYear: currentMonth,
        totalAllowed: 50,
        generationsUsed: 0,
        resetsOn: resetDate,
      });

      const calculatedStatus = calculateQuotaStatus(quota);

      return {
        success: true,
        data: {
          ...quota,
          ...calculatedStatus,
        },
        message: "Welcome! You have received 50 free tokens to get started.",
      };
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : "Failed to initialize quota");
    }
  }),

  request: protectedProcedure
    .input(
      z.object({
        reason: z.string().min(10, "Please provide a detailed reason for request"),
        requestedAmount: z
          .number()
          .min(1, "Must request at least 1 token")
          .max(100, "Cannot request more than 100 tokens at once"),
      }),
    )
    .handler(async ({ input, context }) => {
      try {
        const userId = context.session?.user?.id;

        if (!userId) {
          throw new Error("User authentication required");
        }

        const { requestedAmount, reason } = input;

        const quota = await db.getLatestQuota(String(userId));

        if (!quota) {
          throw new Error("No existing quota found");
        }

        const updatedQuota = await db.updateGenerationQuota(quota.id, {
          totalAllowed: quota.totalAllowed + requestedAmount,
        });

        const calculatedStatus = calculateQuotaStatus(updatedQuota || quota);

        return {
          success: true,
          data: {
            ...(updatedQuota || quota),
            ...calculatedStatus,
          },
          message: `Successfully added ${requestedAmount} tokens to your quota. Reason: ${reason}`,
        };
      } catch (error) {
        throw new Error(error instanceof Error ? error.message : "Failed to process token request");
      }
    }),

  getHistory: protectedProcedure
    .input(
      z.object({
        months: z.coerce.number().min(1).max(12).default(6),
      }),
    )
    .handler(async ({ input, context }) => {
      try {
        const userId = context.session?.user?.id;

        if (!userId) {
          throw new Error("User authentication required");
        }

        const { months } = input;

        const historyData = await db.getQuotaHistory(String(userId), months);

        const history = historyData.map((entry: any) => ({
          month: entry.monthYear.substring(0, 7),
          totalAllowed: entry.totalAllowed,
          generationsUsed: entry.generationsUsed || 0,
          plansGenerated: Math.floor((entry.generationsUsed || 0) / 2),
        }));

        const currentLength = history.length;
        if (currentLength < months) {
          for (let i = 0; i < months - currentLength; i++) {
            const date = new Date();
            date.setMonth(date.getMonth() - (currentLength + i));
            history.unshift({
              month: date.toISOString().slice(0, 7),
              totalAllowed: 50,
              generationsUsed: 0,
              plansGenerated: 0,
            });
          }
        }

        return {
          success: true,
          data: history,
        };
      } catch (error) {
        throw new Error(error instanceof Error ? error.message : "Failed to fetch usage history");
      }
    }),
};
