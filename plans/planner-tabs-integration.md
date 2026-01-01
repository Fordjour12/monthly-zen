# Planner Tabs Integration Plan

## Overview

Integrate the explore/template functionality into the planner section using a **2-tab layout** with search and gorhom BottomSheet modal:

- **Tab 1: Templates** - Browse and search templates, create from template or scratch
- **Tab 2: My Plans** - View existing plans

The Create form opens as a **gorhom BottomSheet** full-screen modal from the Templates tab.

## Updated Categories

| Category         | Description                  | Examples                                |
| ---------------- | ---------------------------- | --------------------------------------- |
| **All**          | Show all templates           | -                                       |
| **Productivity** | Focus on getting things done | Deep Work Sprint, Language Learning Lab |
| **Wellness**     | Health and self-care         | Morning Routine Mastery, Sleep Schedule |
| **Finance**      | Money management             | Financial Zen 101, Budget Builder       |
| **Learning**     | Skill acquisition            | Book Club, Course Completion            |
| **Creativity**   | Creative projects            | Art Practice, Writing Habit             |

## Architecture

```
apps/native/app/(tabs)/planner/
├── _layout.tsx              # Stack for deep linking [id]
├── index.tsx                # Main Tabs container (hero-ui Tabs)
├── templates.tsx            # Template browser with search + BottomSheet trigger
├── create-sheet.tsx         # Create plan form (gorhom BottomSheet)
└── plans.tsx                # User's plans list (Tab 2)
```

## UI Design

### Tab 1: Templates (with Search)

```
┌─────────────────────────────┐
│  Templates            [+ Create] │
├─────────────────────────────┤
│  ┌───────────────────────┐  │
│  │ 🔍 Search templates... │  │  ← Hero-ui TextField with search icon
│  └───────────────────────┘  │
├─────────────────────────────┤
│  [All] [Productivity] [Wellness] │  ← Hero-ui Tabs (scrollable)
│  [Finance] [Learning] [Creativity] │
├─────────────────────────────┤
│  ┌───────────────────────┐  │
│  │ Template Card         │  │
│  │ • Title               │  │
│  │ • Description         │  │
│  │ • [Apply]             │  │
│  └───────────────────────┘  │
│  ┌───────────────────────┐  │
│  │ Template Card         │  │
│  │ • Title               │  │
│  │ • Description         │  │
│  │ • [Apply]             │  │
│  └───────────────────────┘  │
└─────────────────────────────┘
```

### Create Modal (gorhom BottomSheet - Full Screen)

```
┌─────────────────────────────┐
│  Handle                     │  ← gorhom handle
├─────────────────────────────┤
│  Create New Plan       [X] │  ← Close button
├─────────────────────────────┤
│  Goals & Objectives         │
│  ┌───────────────────────┐  │
│  │ TextField multiline   │  │
│  └───────────────────────┘  │
│                              │
│  Task Complexity             │
│  ○ Simple ○ Balanced ○ Ambitious │
│                              │
│  [Generate Plan]             │  ← Hero-ui Button
└─────────────────────────────┘
```

## Implementation Steps

### 1. apps/native/app/(tabs)/planner/templates.tsx

**Key components:**

- Search bar (Hero-ui TextField with search icon)
- Category tabs (Hero-ui Tabs)
- Template cards (from explore.tsx)
- Create New button (Hero-ui Button) → opens BottomSheet
- "Apply" on template → opens BottomSheet with pre-filled data
- Search + category filtering logic

### 2. apps/native/app/(tabs)/planner/create-sheet.tsx

Using gorhom BottomSheet:

```tsx
import BottomSheet, { BottomSheetView } from "@gorhom/bottom-sheet";
import { useRef } from "react";
import { View, Text } from "react-native";
import { Button, TextField } from "heroui-native";

interface CreateSheetProps {
  template?: TemplateData | null;
  onClose: () => void;
}

export default function CreateSheet({ template, onClose }: CreateSheetProps) {
  const sheetRef = useRef<BottomSheet>(null);

  return (
    <BottomSheet
      ref={sheetRef}
      snapPoints={["100%"]}
      index={0}
      onChange={(index) => {
        if (index === -1) onClose();
      }}
    >
      <BottomSheetView className="flex-1 p-4">
        <View className="flex-row justify-between items-center mb-4">
          <Text className="text-xl font-bold">Create New Plan</Text>
          <Button variant="ghost" onPress={onClose}>
            <Text>Close</Text>
          </Button>
        </View>

        {/* Form fields from current index.tsx */}
      </BottomSheetView>
    </BottomSheet>
  );
}
```

### 3. apps/native/app/(tabs)/planner/index.tsx

```tsx
import { Tabs } from "heroui-native";
import TemplatesTab from "./templates";
import MyPlansTab from "./plans";

export default function PlannerTabs() {
  return (
    <Tabs variant="line" className="flex-1">
      <Tabs.List className="w-full">
        <Tabs.Trigger value="templates" className="flex-1">
          <Tabs.Label>Templates</Tabs.Label>
        </Tabs.Trigger>
        <Tabs.Trigger value="plans" className="flex-1">
          <Tabs.Label>My Plans</Tabs.Label>
        </Tabs.Trigger>
      </Tabs.List>

      <Tabs.Content value="templates">
        <TemplatesTab />
      </Tabs.Content>

      <Tabs.Content value="plans">
        <MyPlansTab />
      </Tabs.Content>
    </Tabs>
  );
}
```

### 4. apps/native/app/(tabs)/planner/plans.tsx

- Keep existing functionality
- Works as Tab 2 content

### 5. apps/native/app/(tabs)/planner/\_layout.tsx

```tsx
import { Stack } from "expo-router";

export default function PlannerLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="index" />
      <Stack.Screen name="[id]" />
    </Stack>
  );
}
```

## Navigation Flow

```typescript
// In templates.tsx - Open BottomSheet
const [selectedTemplate, setSelectedTemplate] = useState<TemplateData | null>(null);

const handleApply = (template: TemplateData) => {
  setSelectedTemplate(template);
  bottomSheetRef.current?.expand();
};

// After successful creation
router.setParams({ tab: "plans" });
```

## Feature Summary

| Feature                | Description                                                     |
| ---------------------- | --------------------------------------------------------------- |
| **Search Bar**         | Filter templates by title/description                           |
| **Category Tabs**      | Filter by Productivity, Wellness, Finance, Learning, Creativity |
| **gorhom BottomSheet** | Full-screen modal for plan creation                             |
| **Template Pre-fill**  | Apply button pre-fills form with template data                  |
| **Deep Linking**       | Stack navigation for plan details                               |
