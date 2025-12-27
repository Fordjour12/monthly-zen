/**
 * Tasks Tab Screen
 *
 * Main tasks screen displaying the task dashboard with
 * filtering, search, and completion tracking.
 */

import React from "react";
import { Container } from "@/components/container";
import { TaskDashboard } from "@/components/tasks";

export default function TasksScreen() {
  return (
    <Container>
      <TaskDashboard />
    </Container>
  );
}
