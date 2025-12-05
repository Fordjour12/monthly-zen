# Dashboard & Weekly Overview Specification

## Overview
This document outlines the technical specification for the "Progress Dashboard" and "Weekly Overview" features in the Native App. These features aim to provide users with a visual representation of their productivity and a summary of their week.

## 1. Progress Dashboard
**Location**: `apps/native/app/(drawer)/(tabs)/dashboard.tsx` (New Tab or replacing Home)

### Components

#### A. Goal Cards
- **Purpose**: Display high-level goals with status indicators.
- **Data Source**: `goals` table (via `orpc`).
- **UI Elements**:
    - Card container with shadow.
    - Title and Category icon.
    - Progress Bar (calculated from linked tasks).
    - Status Badge: "On-track" (Green), "Behind" (Orange), "At Risk" (Red).
    - "View Details" button.

#### B. Calendar Heatmap
- **Purpose**: Visual representation of daily productivity.
- **Data Source**: `daily_summaries` or aggregated `tasks` completion data.
- **UI Elements**:
    - Grid of squares representing days.
    - Color intensity based on completion rate (0-100%).
    - Tooltip on press showing specific stats for that day.

#### C. Deadline Alerts
- **Purpose**: Warn users of approaching deadlines.
- **Logic**: Filter goals/tasks with `deadline < now + 3 days`.
- **UI Elements**:
    - Horizontal scrollable list or stacked cards at the top.
    - Color-coded urgency (Red for < 24h, Orange for < 3 days).

#### D. Quick-Add
- **Purpose**: Fast task entry.
- **UI Elements**:
    - Floating Action Button (FAB) or prominent input field.
    - "Smart" input that parses text (e.g., "Gym tomorrow at 5pm" -> Title: Gym, Time: Tomorrow 5pm).
    - AI Categorization (Health, Work, etc.).

## 2. Weekly Overview
**Location**: `apps/native/components/dashboard/weekly-overview.tsx`

### Components

#### A. Weekly Summary
- **Purpose**: AI-generated text summary of the week.
- **Data Source**: AI Service (aggregating completed tasks, mood, notes).
- **UI Elements**:
    - Text block with "Read More" expansion.
    - Highlights (e.g., "You completed 5/5 workouts!").

#### B. Progress Chart
- **Purpose**: Bar or Line chart showing tasks completed vs. planned per day.
- **UI Elements**:
    - Chart component (using `react-native-gifted-charts` or similar).
    - X-axis: Days of week (Mon-Sun).
    - Y-axis: Task count.

## 3. Technical Implementation

### Dependencies
- `react-native-gifted-charts` or `victory-native` for charts.
- `date-fns` for date manipulation.
- `orpc` for backend data fetching.

### Data Flow
1.  **Fetch Data**: `useQuery` to fetch `dashboardStats` (new API endpoint).
2.  **Process Data**: Calculate completion rates and formatting on client or server (prefer server).
3.  **Render**: Pass data to components.

### AI Integration
- **Quick-add**: Send input text to `ai-service` -> returns structured task object.
- **Weekly Summary**: Send week's data to `ai-service` -> returns summary text.
