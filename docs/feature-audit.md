# Feature Audit & Gap Analysis

This document outlines the current state of features in the Monthly Zen application and identifies areas for development.

## 1. Web Task Management UI

The web application's task management is currently a placeholder.

- **Status:** Incomplete.
- **Gaps:** Users cannot view, filter, or update task completion from the web UI. Backend support exists but frontend logic is missing.

## 2. Native Explore Tab

The mobile app's second tab is a boilerplate screen.

- **Status:** Placeholder (`app/(tabs)/two.tsx`).
- **Opportunity:** Transform into a community-driven screen for Plan Templates, Public Goals, or Monthly Archives.

## 3. User Settings & Profiles

There is no dedicated UI for personalizing the user experience.

- **Status:** Missing.
- **Gaps:** No interface to manage default complexity, focus areas, or weekend preferences stored in the database. Account management is limited to basic Auth.

## 4. Quota Visibility (Mobile)

Mobile users lack insights into their AI usage.

- **Status:** Missing in Native, Partial in Web.
- **Gaps:** No dashboard on mobile to see remaining AI plan generation credits or request quota increases.

## 5. Analytics & Performance Tracking

Data is collected but not visualized for the user.

- **Status:** Missing.
- **Opportunity:** Add progress charts, monthly performance comparisons, and motivational completion streaks.

## 6. Notifications & Reminders

The app is currently passive.

- **Status:** Missing.
- **Opportunity:** Implement push notifications (Native) and browser alerts (Web) for commitments and daily task reminders.

## 7. Advanced Plan Generation

- **Refinement:** AI-assisted regeneration of specific weeks/days.
- **Interactivity:** Manual drag-and-drop task sorting before plan confirmation on mobile.
