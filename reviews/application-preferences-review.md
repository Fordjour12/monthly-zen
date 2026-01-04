# Code Review: Application Preferences Feature

**Review Date:** 2026-01-04
**Reviewer:** Code Review
**Files Reviewed:**

- [`apps/native/hooks/usePreferences.ts`](../apps/native/hooks/usePreferences.ts)
- [`apps/native/app/(tabs)/profile/[id].tsx`](<../apps/native/app/(tabs)/profile/%5Bid%5D.tsx>)
- [`packages/api/src/routers/preferences.ts`](../packages/api/src/routers/preferences.ts)

---

## Executive Summary

The application preferences feature is partially implemented with a functional backend API but lacks complete frontend integration. The feature allows users to customize AI coaching preferences including coach name, tone, working hours, and focus areas. Several issues were identified across validation, error handling, UX, and type safety.

---

## Critical Issues

### 1. Incomplete Feature Implementation

**Severity:** High  
**Location:** [`apps/native/app/(tabs)/profile/[id].tsx:172-179`](<../apps/native/app/(tabs)/profile/%5Bid%5D.tsx#L172-L179>)

**Issue:** The edit preferences screen displays a "Coming Soon" placeholder instead of a functional UI:

```tsx
} else if (isEditPreferences) {
  <View className="items-center justify-center mt-20">
    <Ionicons name="construct-outline" size={64} color="#a3a3a3" />
    <Text className="text-xl font-bold text-foreground mt-4">Goal Preferences</Text>
    <Text className="text-muted-foreground text-center mt-2 px-6">
      We're fine-tuning the AI preference engine. This feature will be available shortly.
    </Text>
  </View>
```

**Impact:** Users cannot access or modify their preferences despite the backend API being fully functional.

**Recommendation:** Complete the UI implementation using the existing [`usePreferences()`](../apps/native/hooks/usePreferences.ts) and [`useUpdatePreferences()`](../apps/native/hooks/usePreferences.ts) hooks.

---

### 2. Missing Error Handling in usePreferences Hook

**Severity:** High  
**Location:** [`apps/native/hooks/usePreferences.ts:11-16`](../apps/native/hooks/usePreferences.ts#L11-L16)

**Issue:** The query hook lacks error handling:

```typescript
export function usePreferences() {
  return useQuery({
    queryKey: ["preferences"],
    queryFn: () => orpc.preferences.get.query(),
    // Missing: error handling, retry logic, stale time
  });
}
```

**Impact:** Network failures or API errors will cause unhandled rejections with no user feedback.

**Recommendation:** Add error handling configuration:

```typescript
export function usePreferences() {
  return useQuery({
    queryKey: ["preferences"],
    queryFn: () => orpc.preferences.get.query(),
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 2,
    refetchOnWindowFocus: false,
  });
}
```

---

### 3. Working Hours Validation Gaps

**Severity:** High  
**Location:** [`packages/api/src/routers/preferences.ts:9-10`](../packages/api/src/routers/preferences.ts#L9-L10)

**Issue:** Working hours fields lack proper validation:

```typescript
workingHoursStart: z.string().optional(),
workingHoursEnd: z.string().optional(),
```

**Problems:**

- No format validation (ISO 8601 time, 12-hour, 24-hour?)
- No cross-field validation (start should be before end)
- No timezone handling

**Recommendation:** Implement proper validation:

```typescript
const timeSchema = z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, {
  message: "Time must be in HH:MM 24-hour format",
});

const updatePreferencesSchema = z.object({
  coachName: z.string().min(1).max(50).optional(),
  coachTone: z.enum(["encouraging", "direct", "analytical", "friendly"]).optional(),
  workingHoursStart: timeSchema.optional(),
  workingHoursEnd: timeSchema.optional(),
}).refine((data) => {
  if (data.workingHoursStart && data.workingHoursEnd) {
    return data.workingHoursStart < data.workingHoursEnd;
  }
  return true;
}, {
  message: "Working hours start must be before end time",
  path: ["workingHoursEnd"],
});
```

---

## Medium Severity Issues

### 4. Missing Optimistic Updates

**Severity:** Medium  
**Location:** [`apps/native/hooks/usePreferences.ts:18-33`](../apps/native/hooks/usePreferences.ts#L18-L33)

**Issue:** The update mutation lacks optimistic updates for better UX:

```typescript
export function useUpdatePreferences() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input) => orpc.preferences.update.mutate(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["preferences"] });
    },
    // Missing: onMutate for optimistic updates
  });
}
```

**Recommendation:** Implement optimistic updates:

```typescript
export function useUpdatePreferences() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input) => orpc.preferences.update.mutate(input),
    onMutate: async (newPreferences) => {
      await queryClient.cancelQueries({ queryKey: ["preferences"] });
      const previousPreferences = queryClient.getQueryData(["preferences"]);
      queryClient.setQueryData(["preferences"], (old) => ({
        ...old,
        ...newPreferences,
      }));
      return { previousPreferences };
    },
    onError: (err, newPreferences, context) => {
      queryClient.setQueryData(["preferences"], context?.previousPreferences);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["preferences"] });
    },
  });
}
```

---

### 5. Inconsistent API Response Format

**Severity:** Medium  
**Location:** [`packages/api/src/routers/preferences.ts:14-25`](../packages/api/src/routers/preferences.ts#L14-L25)

**Issue:** The API wraps responses with `{ success: true, data: preferences }` but this pattern is inconsistent with other routers and adds unnecessary nesting:

```typescript
return { success: true, data: preferences };
```

**Recommendation:** Return data directly for consistency:

```typescript
export const preferencesRouter = {
  get: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.session.user.id;
    return db.getUserPreferences(userId);
  }),

  update: protectedProcedure.input(updatePreferencesSchema)
    .mutation(async ({ input, ctx }) => {
      const userId = ctx.session.user.id;
      return db.createOrUpdatePreferences(userId, input);
    }),
};
```

---

### 6. Inadequate Loading State Exposure

**Severity:** Medium  
**Location:** [`apps/native/hooks/usePreferences.ts`](../apps/native/hooks/usePreferences.ts)

**Issue:** The hooks don't expose loading states explicitly, forcing consumers to use `isLoading` from TanStack Query:

```typescript
const { data, isLoading } = usePreferences();
const mutation = useUpdatePreferences();
// mutation.isLoading is available but not documented
```

**Recommendation:** Export dedicated hooks with loading states:

```typescript
export function usePreferences() {
  const query = useQuery({
    queryKey: ["preferences"],
    queryFn: () => orpc.preferences.get.query(),
  });

  return {
    preferences: query.data,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
  };
}
```

---

## Low Severity Issues

### 7. Hardcoded Query Key

**Severity:** Low  
**Location:** [`apps/native/hooks/usePreferences.ts:13`](../apps/native/hooks/usePreferences.ts#L13)

**Issue:** The query key is hardcoded as a string literal:

```typescript
queryKey: ["preferences"],
```

**Recommendation:** Use a constant for better maintainability:

```typescript
const PREFERENCES_QUERY_KEY = ["preferences"] as const;

export function usePreferences() {
  return useQuery({
    queryKey: PREFERENCES_QUERY_KEY,
    queryFn: () => orpc.preferences.get.query(),
  });
}

export function useUpdatePreferences() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input) => orpc.preferences.update.mutate(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PREFERENCES_QUERY_KEY });
    },
  });
}
```

---

### 8. Missing Type Exports

**Severity:** Low  
**Location:** [`apps/native/hooks/usePreferences.ts`](../apps/native/hooks/usePreferences.ts)

**Issue:** No TypeScript types are exported for the input and output of the hooks:

```typescript
export function useUpdatePreferences() {
  return useMutation({
    mutationFn: (input: {
      coachName?: string;
      coachTone?: CoachTone;
      workingHoursStart?: string;
      workingHoursEnd?: string;
      defaultFocusArea?: string;
    }) => orpc.preferences.update.mutate(input),
    // ...
  });
}
```

**Recommendation:** Export the input type:

```typescript
export type UpdatePreferencesInput = {
  coachName?: string;
  coachTone?: CoachTone;
  workingHoursStart?: string;
  workingHoursEnd?: string;
  defaultFocusArea?: string;
};

export function useUpdatePreferences() {
  return useMutation({
    mutationFn: (input: UpdatePreferencesInput) =>
      orpc.preferences.update.mutate(input),
    // ...
  });
}
```

---

### 9. No Empty State Handling in UI

**Severity:** Low  
**Location:** [`apps/native/hooks/usePreferences.ts:11-16`](../apps/native/hooks/usePreferences.ts#L11-L16)

**Issue:** When preferences don't exist, the UI may show undefined values without proper handling.

**Recommendation:** Add default values:

```typescript
export function usePreferences() {
  const query = useQuery({
    queryKey: ["preferences"],
    queryFn: () => orpc.preferences.get.query(),
  });

  const defaultPreferences = {
    coachName: "Coach",
    coachTone: "encouraging" as const,
    workingHoursStart: "09:00",
    workingHoursEnd: "17:00",
    defaultFocusArea: "",
  };

  return {
    preferences: query.data ?? defaultPreferences,
    isLoading: query.isLoading,
    isError: query.isError,
  };
}
```

---

## Action Items

| Priority | Action Item                                              | Owner    | Status  |
| -------- | -------------------------------------------------------- | -------- | ------- |
| High     | Complete the Edit Preferences UI implementation          | Frontend | Pending |
| High     | Add error handling and retry logic to usePreferences     | Frontend | Pending |
| High     | Implement proper time validation with cross-field checks | Backend  | Pending |
| Medium   | Add optimistic updates for preference mutations          | Frontend | Pending |
| Medium   | Standardize API response format                          | Backend  | Pending |
| Medium   | Expose loading states explicitly in hooks                | Frontend | Pending |
| Low      | Extract query key to constant                            | Frontend | Pending |
| Low      | Export TypeScript types for preferences                  | Frontend | Pending |
| Low      | Add default values for missing preferences               | Frontend | Pending |

---

## Testing Recommendations

1. **Validation Tests:** Verify Zod schema catches invalid time formats and start/end order violations
2. **Error Handling Tests:** Test network failures and API error responses
3. **Mutation Tests:** Verify cache invalidation works correctly after updates
4. **UI Integration Tests:** Test the preferences form with real API responses

---

## Additional Notes

- The backend API in [`packages/api/src/routers/preferences.ts`](../packages/api/src/routers/preferences.ts) is well-structured and follows the project's patterns
- The onboarding flow in [`apps/native/app/onboarding/goals.tsx`](../apps/native/app/onboarding/goals.tsx) already has preference UI that can serve as a reference for the edit preferences screen
- Consider adding preference change events for real-time UI updates across the app
