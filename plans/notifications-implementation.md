# Notifications Implementation Plan

## Overview

Implement push notifications for the Monthly Zen native app using Expo Notifications, integrated with the existing reminders schema and better-auth authentication.

## Architecture

```
+------------------------------------------------------------------+
|                        NOTIFICATION FLOW                         |
+------------------------------------------------------------------+
|                                                                  |
|  +--------------+    +--------------+    +--------------+        |
|  |  Expo Push   | --> |   Backend    | --> |   Database   |        |
|  |   API        |    |   (Hono)     |    |  (Postgres)  |        |
|  +--------------+    +--------------+    +--------------+        |
|         |                   |                   |                 |
|         |                   |                   |                 |
|         v                   v                   v                 |
|  +--------------+    +--------------+    +--------------+        |
|  |   Native     | <-- |   oRPC       | <-- |   Hooks &    |        |
|  |   App        |    |   Routers    |    |   Stores     |        |
|  +--------------+    +--------------+    +--------------+        |
|                                                                  |
+------------------------------------------------------------------+
```

## Dependencies Required

Add to `apps/native/package.json`:

```json
{
  "expo-notifications": "~0.29.13",
  "expo-device": "~7.0.2"
}
```

## Implementation Phases

### PHASE 1: Native App Setup (2-3 hours)

#### 1.1 Install Dependencies

```bash
cd apps/native && bun add expo-notifications expo-device
```

#### 1.2 Update app.config.ts

Add notification configuration:

```typescript
export default (ctx: ConfigContext): ExpoConfig => {
  return {
    // ...existing config
    android: {
      // ...existing config
      notification: {
        color: "#E6F4FE",
        icon: "./assets/images/notification-icon.png",
      },
    },
    ios: {
      // ...existing config
      infoPlist: {
        UIBackgroundModes: ["remote-notification"],
      },
    },
    plugins: [
      // ...existing plugins
      [
        "expo-notifications",
        {
          icon: "./assets/images/notification-icon.png",
          color: "#E6F4FE",
          sounds: [],
        },
      ],
    ],
  };
};
```

#### 1.3 Create Notification Hook

**File:** `apps/native/hooks/useNotifications.ts`

```typescript
import { useCallback, useEffect, useState } from "react";
import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import Constants from "expo-constants";
import { Platform } from "react-native";

export function useNotifications() {
  const [expoPushToken, setExpoPushToken] = useState<string | null>(null);
  const [notification, setNotification] = useState<Notifications.Notification | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Register for push notifications
  const registerForPushNotifications = useCallback(async () => {
    if (!Device.isDevice) {
      setError("Must use physical device for push notifications");
      return null;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Create notification channel for Android
      if (Platform.OS === "android") {
        await Notifications.setNotificationChannelAsync("default", {
          name: "Default",
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: "#E6F4FE",
        });
      }

      // Request permissions
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== "granted") {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== "granted") {
        setError("Push notification permission denied");
        return null;
      }

      // Get project ID from EAS config
      const projectId =
        Constants?.expoConfig?.extra?.eas?.projectId ?? Constants?.easConfig?.projectId;

      if (!projectId) {
        setError("EAS project ID not configured");
        return null;
      }

      // Get push token
      const tokenData = await Notifications.getExpoPushTokenAsync({ projectId });
      const token = tokenData.data;

      setExpoPushToken(token);
      return token;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to get push token");
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Schedule a local notification
  const scheduleLocalNotification = useCallback(
    async (title: string, body: string, seconds: number, data?: Record<string, unknown>) => {
      await Notifications.scheduleNotificationAsync({
        content: {
          title,
          body,
          data: data ?? {},
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
          seconds,
        },
      });
    },
    [],
  );

  // Cancel all scheduled notifications
  const cancelAllNotifications = useCallback(async () => {
    await Notifications.cancelAllScheduledNotificationsAsync();
  }, []);

  // Cancel a specific notification
  const cancelNotification = useCallback(async (notificationId: string) => {
    await Notifications.cancelScheduledNotificationAsync(notificationId);
  }, []);

  // Set notification badge
  const setBadgeCount = useCallback(async (count: number) => {
    await Notifications.setBadgeCountAsync(count);
  }, []);

  // Get notification badge count
  const getBadgeCount = useCallback(async () => {
    return await Notifications.getBadgeCountAsync();
  }, []);

  // Setup notification listeners
  useEffect(() => {
    // Listener for when a notification is received
    const notificationListener = Notifications.addNotificationReceivedListener((notif) => {
      setNotification(notif);
    });

    // Listener for when user interacts with notification
    const responseListener = Notifications.addNotificationResponseReceivedListener((response) => {
      console.log("Notification interaction:", response);
      // Handle navigation based on notification data
    });

    return () => {
      notificationListener.remove();
      responseListener.remove();
    };
  }, []);

  return {
    expoPushToken,
    notification,
    isLoading,
    error,
    isRegistered: !!expoPushToken,
    registerForPushNotifications,
    scheduleLocalNotification,
    cancelAllNotifications,
    cancelNotification,
    setBadgeCount,
    getBadgeCount,
  };
}
```

#### 1.4 Update Root Layout

**File:** `apps/native/app/_layout.tsx`

Add notification handler setup and register for notifications after login:

```typescript
import { useNotifications } from "@/hooks/useNotifications";
import { useAuthStore } from "@/stores/auth-store";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldPlaySound: false,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export default function Layout() {
  const { isLoggedIn, user } = useAuthStore();
  const { registerForPushNotifications } = useNotifications();

  // Register for push notifications when user logs in
  useEffect(() => {
    if (isLoggedIn && user) {
      registerForPushNotifications().then((token) => {
        if (token) {
          // TODO: Send token to backend
        }
      });
    }
  }, [isLoggedIn, user, registerForPushNotifications]);

  // ...rest of layout
}
```

### PHASE 2: Backend API (2-3 hours)

#### 2.1 Create Push Token Router

**File:** `packages/api/src/routers/push-tokens.ts`

```typescript
import { z } from "zod";
import { protectedProcedure } from "../index";
import * as db from "@monthly-zen/db";

const savePushTokenSchema = z.object({
  token: z.string().min(1),
  platform: z.enum(["ios", "android"]),
});

export const pushTokensRouter = {
  /**
   * Save or update push notification token for the user
   */
  saveToken: protectedProcedure.input(savePushTokenSchema).handler(async ({ input, context }) => {
    try {
      const userId = context.session?.user?.id;

      if (!userId) {
        throw new Error("Authentication required");
      }

      await db.upsertPushToken({
        userId: String(userId),
        token: input.token,
        platform: input.platform,
      });

      return {
        success: true,
        message: "Push token saved successfully",
      };
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : "Failed to save push token");
    }
  }),

  /**
   * Remove push notification token
   */
  removeToken: protectedProcedure
    .input(z.object({ token: z.string().min(1) }))
    .handler(async ({ input, context }) => {
      try {
        const userId = context.session?.user?.id;

        if (!userId) {
          throw new Error("Authentication required");
        }

        await db.removePushToken(String(userId), input.token);

        return {
          success: true,
          message: "Push token removed successfully",
        };
      } catch (error) {
        throw new Error(error instanceof Error ? error.message : "Failed to remove push token");
      }
    }),

  /**
   * Get user's notification preferences
   */
  getPreferences: protectedProcedure.handler(async ({ context }) => {
    try {
      const userId = context.session?.user?.id;

      if (!userId) {
        throw new Error("Authentication required");
      }

      const preferences = await db.getUserNotificationPreferences(String(userId));

      return {
        success: true,
        data: preferences,
      };
    } catch (error) {
      throw new Error(
        error instanceof Error ? error.message : "Failed to get notification preferences",
      );
    }
  }),

  /**
   * Update user's notification preferences
   */
  updatePreferences: protectedProcedure
    .input(
      z.object({
        taskRemindersEnabled: z.boolean().optional(),
        habitRemindersEnabled: z.boolean().optional(),
        dailySummaryEnabled: z.boolean().optional(),
        weeklyReportEnabled: z.boolean().optional(),
        reminderTime: z.string().optional(), // HH:MM format
      }),
    )
    .handler(async ({ input, context }) => {
      try {
        const userId = context.session?.user?.id;

        if (!userId) {
          throw new Error("Authentication required");
        }

        await db.updateNotificationPreferences(String(userId), input);

        return {
          success: true,
          message: "Notification preferences updated",
        };
      } catch (error) {
        throw new Error(
          error instanceof Error ? error.message : "Failed to update notification preferences",
        );
      }
    }),
};
```

#### 2.2 Add Router to App Router

**File:** `packages/api/src/routers/index.ts`

```typescript
import { pushTokensRouter } from "./push-tokens";

export const appRouter = {
  // ...existing routers
  pushTokens: pushTokensRouter,
};
```

#### 2.3 Create Database Queries

**File:** `packages/db/src/queries/push-tokens.ts`

```typescript
import { db } from "../index";
import { pushTokens } from "../schema/push-tokens";

export async function upsertPushToken({
  userId,
  token,
  platform,
}: {
  userId: string;
  token: string;
  platform: "ios" | "android";
}) {
  return await db
    .insert(pushTokens)
    .values({ userId, token, platform })
    .onConflictDoUpdate({
      target: [pushTokens.userId, pushTokens.token],
      set: { platform, updatedAt: new Date() },
    })
    .returning();
}

export async function removePushToken(userId: string, token: string) {
  return await db.delete(pushTokens).where(and(eq(pushTokens.userId, userId), eq(pushTokens.token, token)));
}

export async function getUserPushTokens(userId: string) {
  return await db.select().from(pushTokens).where(eq(pushTokens.userId, userId));
}
```

#### 2.4 Create Push Tokens Schema

**File:** `packages/db/src/schema/push-tokens.ts`

```typescript
import { pgTable, text, varchar, timestamp, boolean } from "drizzle-orm/pg-core";

export const pushTokens = pgTable("push_tokens", {
  id: serial("id").primaryKey(),
  userId: text("user_id")
    .references(() => user.id)
    .notNull(),
  token: varchar("token", { length: 500 }).notNull(),
  platform: varchar("platform", { length: 20 }).notNull(), // 'ios' or 'android'
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const userNotificationPreferences = pgTable("user_notification_preferences", {
  id: serial("id").primaryKey(),
  userId: text("user_id")
    .references(() => user.id)
    .notNull()
    .unique(),
  taskRemindersEnabled: boolean("task_reminders_enabled").notNull().default(true),
  habitRemindersEnabled: boolean("habit_reminders_enabled").notNull().default(true),
  dailySummaryEnabled: boolean("daily_summary_enabled").notNull().default(true),
  weeklyReportEnabled: boolean("weekly_report_enabled").notNull().default(false),
  reminderTime: varchar("reminder_time", { length: 5 }).notNull().default("09:00"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});
```

### PHASE 3: Notification Center UI (3-4 hours)

#### 3.1 Create Settings Screen with Notification Preferences

**File:** `apps/native/app/(tabs)/settings/notifications.tsx`

```typescript
import { useState } from "react";
import { View, Text, Switch, Pressable } from "react-native";
import { orpc } from "@/utils/orpc";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNotifications } from "@/hooks/useNotifications";
import { TimePicker } from "@/components/ui/time-picker";

export default function NotificationSettings() {
  const { expoPushToken, registerForPushNotifications } = useNotifications();
  const queryClient = useQueryClient();

  const [preferences, setPreferences] = useState({
    taskRemindersEnabled: true,
    habitRemindersEnabled: true,
    dailySummaryEnabled: true,
    weeklyReportEnabled: false,
    reminderTime: "09:00",
  });

  const updatePreferencesMutation = useMutation(
    orpc.pushTokens.updatePreferences.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["pushTokens", "preferences"] });
      },
    }),
  );

  const handleToggle = (key: keyof typeof preferences) => {
    setPreferences((prev) => ({ ...prev, [key]: !prev[key] }));
    updatePreferencesMutation.mutate({ [key]: !preferences[key] });
  };

  return (
    <View className="flex-1 bg-background p-6">
      <Text className="text-2xl font-bold mb-6">Notifications</Text>

      {/* Push Notifications Status */}
      <View className="bg-surface p-4 rounded-xl mb-4">
        <Text className="text-lg font-semibold mb-2">Push Notifications</Text>
        <View className="flex-row justify-between items-center">
          <Text className="text-muted-foreground">
            {expoPushToken ? "Enabled" : "Disabled"}
          </Text>
          <Pressable
            onPress={registerForPushNotifications}
            className="px-4 py-2 bg-primary rounded-lg"
          >
            <Text className="text-primary-foreground">
              {expoPushToken ? "Re-register" : "Enable"}
            </Text>
          </Pressable>
        </View>
      </View>

      {/* Notification Types */}
      <View className="bg-surface p-4 rounded-xl mb-4">
        <Text className="text-lg font-semibold mb-4">Notification Types</Text>

        <View className="flex-row justify-between items-center py-3 border-b border-divider">
          <Text>Task Reminders</Text>
          <Switch
            value={preferences.taskRemindersEnabled}
            onValueChange={() => handleToggle("taskRemindersEnabled")}
          />
        </View>

        <View className="flex-row justify-between items-center py-3 border-b border-divider">
          <Text>Habit Reminders</Text>
          <Switch
            value={preferences.habitRemindersEnabled}
            onValueChange={() => handleToggle("habitRemindersEnabled")}
          />
        </View>

        <View className="flex-row justify-between items-center py-3 border-b border-divider">
          <Text>Daily Summary</Text>
          <Switch
            value={preferences.dailySummaryEnabled}
            onValueChange={() => handleToggle("dailySummaryEnabled")}
          />
        </View>

        <View className="flex-row justify-between items-center py-3">
          <Text>Weekly Report</Text>
          <Switch
            value={preferences.weeklyReportEnabled}
            onValueChange={() => handleToggle("weeklyReportEnabled")}
          />
        </View>
      </View>

      {/* Reminder Time */}
      <View className="bg-surface p-4 rounded-xl">
        <Text className="text-lg font-semibold mb-4">Default Reminder Time</Text>
        <TimePicker
          value={preferences.reminderTime}
          onChange={(time) => {
            setPreferences((prev) => ({ ...prev, reminderTime: time }));
            updatePreferencesMutation.mutate({ reminderTime: time });
          }}
        />
      </View>
    </View>
  );
}
```

### PHASE 4: Push Notification Sending Service (3-4 hours)

#### 4.1 Create Push Notification Service

**File:** `packages/api/src/services/push-notifications.ts`

```typescript
import { db } from "@monthly-zen/db";
import { pushTokens } from "@monthly-zen/db/schema/push-tokens";
import { eq } from "drizzle-orm";

const EXPO_PUSH_URL = "https://exp.host/--/api/v2/push/send";

interface ExpoPushMessage {
  to: string;
  title: string;
  body: string;
  data?: Record<string, unknown>;
  sound?: "default" | null;
  priority?: "default" | "high";
}

export async function sendPushNotification(
  userId: string,
  title: string,
  body: string,
  data?: Record<string, unknown>,
) {
  const tokens = await db.select().from(pushTokens).where(eq(pushTokens.userId, userId));

  if (tokens.length === 0) {
    console.log(`No push tokens found for user ${userId}`);
    return;
  }

  const messages: ExpoPushMessage[] = tokens.map((token) => ({
    to: token.token,
    title,
    body,
    data,
    sound: "default",
    priority: "high",
  }));

  const response = await fetch(EXPO_PUSH_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ messages }),
  });

  const result = await response.json();

  if (result.data?.errors) {
    console.error("Push notification errors:", result.data.errors);
    // Handle token invalidation
    for (const error of result.data.errors) {
      if (error.code === "DEVICE_NOT_REGISTERED") {
        await db
          .delete(pushTokens)
          .where(eq(pushTokens.token, error.details?.to as string));
      }
    }
  }

  return result;
}

export async function sendTaskReminder(userId: string, taskTitle: string, taskTime: string) {
  return sendPushNotification(
    userId,
    "Task Reminder",
    `Don't forget: ${taskTitle} at ${taskTime}`,
    { type: "task_reminder" },
  );
}

export async function sendHabitReminder(userId: string, habitName: string) {
  return sendPushNotification(
    userId,
    "Habit Reminder",
    `Time for your habit: ${habitName}`,
    { type: "habit_reminder" },
  );
}

export async function sendDailySummary(userId: string, completedTasks: number, totalTasks: number) {
  return sendPushNotification(
    userId,
    "Daily Summary",
    `You completed ${completedTasks} of ${totalTasks} tasks today`,
    { type: "daily_summary" },
  );
}
```

### PHASE 5: Background Notification Scheduling (4-5 hours)

#### 5.1 Create Background Task Manager

**File:** `apps/native/tasks/notification-scheduler.ts`

```typescript
import * as TaskManager from "expo-task-manager";
import * as Notifications from "expo-notifications";
import { Platform } from "react-native";

const NOTIFICATION_TASK = "NOTIFICATION_TASK";

TaskManager.defineTask(NOTIFICATION_TASK, async () => {
  try {
    // This will be called in the background
    // For now, we'll use a simple check
    console.log("Background notification task executed");
  } catch (error) {
    console.error("Background task error:", error);
  }
});

export async function registerBackgroundTasks() {
  if (!(await TaskManager.isTaskRegisteredAsync(NOTIFICATION_TASK))) {
    await TaskManager.registerTaskAsync(NOTIFICATION_TASK, {
      minimumInterval: 15 * 60, // 15 minutes
      startsInForeground: true,
    });
  }
}

export async function scheduleDailyReminder(hour: number = 9, minute: number = 0) {
  // Cancel existing notifications
  await Notifications.cancelAllScheduledNotificationsAsync();

  // Schedule daily reminder
  await Notifications.scheduleNotificationAsync({
    content: {
      title: "Good Morning!",
      body: "Ready to plan your day with Monthly Zen?",
      data: { type: "daily_reminder" },
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.CALENDAR,
      hour,
      minute,
      repeats: true,
    },
  });
}

export async function scheduleTaskReminders(tasks: { title: string; time: Date }[]) {
  const now = new Date();

  for (const task of tasks) {
    if (task.time > now) {
      const timeUntilTask = Math.floor((task.time.getTime() - now.getTime()) / 1000);

      await Notifications.scheduleNotificationAsync({
        content: {
          title: "Upcoming Task",
          body: `${task.title} starts soon`,
          data: { type: "task_reminder", title: task.title },
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
          seconds: Math.max(60, timeUntilTask - 15 * 60), // 15 minutes before
        },
      });
    }
  }
}
```

### PHASE 6: Integration with Existing Features (3-4 hours)

#### 6.1 Update Habit Creation Flow

When creating a habit, automatically schedule reminder notifications:

**File:** `apps/native/hooks/useHabits.ts`

```typescript
export function useHabits() {
  const { scheduleLocalNotification } = useNotifications();

  const createHabit = useCallback(
    async (input: CreateHabitInput) => {
      const result = await createHabitMutation.mutateAsync(input);

      // Schedule habit reminders if enabled
      if (input.reminderEnabled && input.reminderTime) {
        const daysMap: Record<string, number> = {
          sunday: 0,
          monday: 1,
          tuesday: 2,
          wednesday: 3,
          thursday: 4,
          friday: 5,
          saturday: 6,
        };

        const [hour, minute] = input.reminderTime.split(":").map(Number);

        for (const day of input.targetDays ?? []) {
          const dayNumber = daysMap[day];
          await Notifications.scheduleNotificationAsync({
            content: {
              title: "Habit Reminder",
              body: `Time for: ${input.name}`,
              data: { habitId: result.data?.id, type: "habit_reminder" },
            },
            trigger: {
              type: Notifications.SchedulableTriggerInputTypes.CALENDAR,
              hour,
              minute,
              dayOfWeek: dayNumber + 1, // Expo uses 1-7 for day of week
              repeats: true,
            },
          });
        }
      }

      return result;
    },
    [createHabitMutation, scheduleLocalNotification],
  );

  // ...rest of hook
}
```

---

## File Changes Summary

| File                                                | Action                                         |
| --------------------------------------------------- | ---------------------------------------------- |
| `apps/native/package.json`                          | Add `expo-notifications`, `expo-device`        |
| `apps/native/app.config.ts`                         | Add notification config, icons, EAS project ID |
| `apps/native/hooks/useNotifications.ts`             | Create new hook                                |
| `apps/native/app/_layout.tsx`                       | Add notification handler, register on login    |
| `apps/native/tasks/notification-scheduler.ts`       | Create background task manager                 |
| `apps/native/app/(tabs)/settings/notifications.tsx` | Create notification settings UI                |
| `packages/db/src/schema/push-tokens.ts`             | Create push tokens and preferences schema      |
| `packages/db/src/schema/index.ts`                   | Export new schema                              |
| `packages/db/src/queries/push-tokens.ts`            | Create database queries                        |
| `packages/api/src/routers/push-tokens.ts`           | Create oRPC router                             |
| `packages/api/src/routers/index.ts`                 | Register new router                            |
| `packages/api/src/services/push-notifications.ts`   | Create push notification service               |

## Estimated Timeline

| Phase                           | Hours | Total |
| ------------------------------- | ----- | ----- |
| Phase 1: Native App Setup       | 2-3   | 2-3   |
| Phase 2: Backend API            | 2-3   | 4-6   |
| Phase 3: Notification Center UI | 3-4   | 7-10  |
| Phase 4: Push Service           | 3-4   | 10-14 |
| Phase 5: Background Scheduling  | 4-5   | 14-19 |
| Phase 6: Feature Integration    | 3-4   | 17-23 |

**Total: 17-23 hours (~3-4 days)**

## Questions for Clarification

| #   | Question                                                                                                                                     | Your Answer |
| --- | -------------------------------------------------------------------------------------------------------------------------------------------- | ----------- |
| 1   | EAS Project ID: Do you have an EAS project set up? If not, should I include instructions to create one?                                      |             |
| 2   | Notification Types Priority: Which notifications should be highest priority? (Task reminders, Habit reminders, Daily summary, Weekly report) |             |
| 3   | Default Reminder Time: Should the default be 9:00 AM or something else?                                                                      |             |
| 4   | Sound Preferences: Should notifications play a sound by default?                                                                             |             |
| 5   | Badge Count: Should the app show badge count for pending tasks?                                                                              |             |

---

## Implementation Checklist

- [ ] Install dependencies (`expo-notifications`, `expo-device`)
- [ ] Update `app.config.ts` with notification configuration
- [ ] Create notification icon assets
- [ ] Create `useNotifications` hook
- [ ] Update `_layout.tsx` with notification handler
- [ ] Create push tokens schema
- [ ] Create preferences schema
- [ ] Export schemas from `schema/index.ts`
- [ ] Create push tokens queries
- [ ] Create `push-tokens.ts` router
- [ ] Register router in `index.ts`
- [ ] Create `push-notifications.ts` service
- [ ] Create notification settings screen
- [ ] Create notification scheduler background task
- [ ] Integrate with habit creation flow
- [ ] Test on iOS simulator
- [ ] Test on Android emulator
- [ ] Configure EAS project
