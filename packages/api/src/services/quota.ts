import * as db from "@monthly-zen/db";

export function addMonthsToDate(dateString: string, monthsToAdd: number): string {
  const date = new Date(dateString);
  const targetMonth = date.getMonth() + monthsToAdd;
  date.setMonth(targetMonth);
  return date.toISOString().split("T")[0]!;
}

export function calculateQuotaStatus(quota: any) {
  const totalAllowed = quota.totalAllowed || 50;
  const generationsUsed = quota.generationsUsed || 0;
  const remaining = Math.max(0, totalAllowed - generationsUsed);
  const usagePercentage = totalAllowed > 0 ? (generationsUsed / totalAllowed) * 100 : 0;

  const resetDate = quota.resetsOn instanceof Date ? quota.resetsOn : new Date(quota.resetsOn);
  const today = new Date();
  const daysUntilReset = Math.ceil((resetDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

  let status: "active" | "low" | "exceeded" = "active";
  if (usagePercentage >= 100) {
    status = "exceeded";
  } else if (usagePercentage >= 80) {
    status = "low";
  }

  return {
    remaining,
    usagePercentage: Math.round(usagePercentage),
    daysUntilReset: Math.max(0, daysUntilReset),
    status,
  };
}

export async function checkAndResetQuota(userId: string, existingQuota: any): Promise<any> {
  const now = new Date();
  const resetsOn =
    existingQuota.resetsOn instanceof Date
      ? existingQuota.resetsOn
      : new Date(existingQuota.resetsOn);

  if (resetsOn > now) {
    return existingQuota;
  }

  console.log(`[Quota Reset] Resetting expired quota for user ${userId}`);

  await db.archiveQuota({
    id: existingQuota.id,
    userId: existingQuota.userId,
    monthYear: existingQuota.monthYear,
    totalAllowed: existingQuota.totalAllowed,
    generationsUsed: existingQuota.generationsUsed || 0,
    resetsOn: existingQuota.resetsOn,
    periodStart: resetsOn.toISOString(),
  });

  const monthsPassed =
    Math.floor((now.getTime() - resetsOn.getTime()) / (30 * 24 * 60 * 60 * 1000)) + 1;

  let currentQuota = existingQuota;
  let lastResetDate = resetsOn;

  for (let i = 0; i < monthsPassed; i++) {
    const nextResetDate = addMonthsToDate(lastResetDate.toISOString(), 1);
    const nextMonthYear = nextResetDate.substring(0, 7) + "-01";

    if (i < monthsPassed - 1) {
      await db.createQuotaHistoryEntry({
        userId: String(userId),
        periodStart: new Date(lastResetDate),
        periodEnd: new Date(nextResetDate),
        monthYear: nextMonthYear,
        totalAllowed: 50,
        generationsUsed: 0,
        totalRequested: 0,
        wasAutoReset: new Date(lastResetDate),
      });
    } else {
      currentQuota = await db.createGenerationQuota({
        userId: String(userId),
        monthYear: nextMonthYear,
        totalAllowed: 50,
        generationsUsed: 0,
        resetsOn: nextResetDate,
      });
    }

    lastResetDate = new Date(nextResetDate);
  }

  console.log(`[Quota Reset] Created ${monthsPassed} month(s) of quota for user ${userId}`);

  return currentQuota;
}
