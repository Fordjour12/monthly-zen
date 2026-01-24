# Onboarding flow draft (cleaned + structured)

## Goals

- Break long onboarding into smaller, readable sections.
- Improve clarity and momentum without losing the original intent.
- Ensure coaching preferences feel purposeful and efficient.

## Coaching preference UI

### Coach options (4 styles)

Each coach includes a name + short “sell” line describing how they help.

- Strict Coach (example name: Beerus) — keeps you on track with firm accountability.
- Friendly Coach — supportive tone, boosts motivation and momentum.
- Analytical Coach — data-focused, breaks progress into measurable steps.
- Direct Coach — concise, no-fluff guidance and fast decision support.

## Onboarding screens

### `apps/native/app/(tabs)/onboarding/welcome.tsx`

- Add lightweight step indicator (1 of 3).
- Add “What you’ll do next” preview to show journey length + purpose.
- Add one line of social proof or outcome promise (e.g., “Your first month plan in 60 seconds”).

### `apps/native/app/(tabs)/onboarding/goals.tsx`

- Split the long form into sections/stepper: Goal → Resolutions → Coach.
- Add sticky mini-progress label at top.
- Add example chips for main goal input (tap to fill).
- Add helper copy under “Task Complexity” and “Weekend Preference” (e.g., “Simple = 3–5 tasks/week”).
- Add a compact “Preview” card before “Finalize My Plan.”

### `apps/native/app/(tabs)/onboarding/generating.tsx`

- Show “What’s happening” checklist with step checkmarks as they complete.
- Add a graceful cancel/back-to-edit option.
- On success, show a quick plan snapshot (top focus, 3 sample tasks, coach tone) before entry.

### Chat plan generation (handoff)

- After onboarding completes, send the user into the chat interface to generate their first monthly plan.
- If the generated plan is strong, save it directly; otherwise, show quick tweak suggestions and regenerate.

#### Suggested flow

- Transition screen: “We’re ready to draft your first month plan.”
- Auto-seed the first chat prompt with onboarding selections.
- Chat generates a draft plan (focus area, weekly cadence, sample tasks, coach tone).
- Present two primary actions: “Accept plan” or “Refine it.”
- If “Refine it,” show 2–3 quick suggestion chips (e.g., “Fewer tasks,” “More ambitious,” “Shift weekends to rest”).
- On accept, save plan and take the user into the app dashboard.

## Preferences schema notes

```ts
const updatePreferencesSchema = z.object({
  coachName: z.string().min(1).max(50).optional(),
  coachTone: z.enum(["encouraging", "direct", "analytical", "friendly"]).optional(),
  workingHoursStart: z.string().optional(),
  workingHoursEnd: z.string().optional(),
  defaultFocusArea: z.string().optional(),
  taskComplexity: z.enum(["Simple", "Balanced", "Ambitious"]).optional(),
  focusAreas: z.string().optional(),
  weekendPreference: z.enum(["Work", "Rest", "Mixed"]).optional(), // update needed
  preferredTaskDuration: z.number().optional(),
  fixedCommitmentsJson: z.any().optional(),
});

// shape
fixedCommitmentsJson: z.object({
  commitments: z.array(
    z.object({
      dayOfWeek: z.string(),
      startTime: z.string(),
      endTime: z.string(),
      description: z.string(),
    })
  ),
});
```
