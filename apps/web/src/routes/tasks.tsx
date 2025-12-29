import { createFileRoute } from "@tanstack/react-router";

import { createFileRoute } from "@tanstack/react-router";
import { getUser } from "@/functions/get-user";
import { redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/tasks")({
  component: RouteComponent,
  beforeLoad: async () => {
    const session = await getUser();
    return { session };
  },
  loader: async ({ context }) => {
    if (!context.session) {
      throw redirect({
        to: "/login",
      });
    }
  },
});

function RouteComponent() {
  // TODO: Implement TaskDashboard component
  return <div>Tasks Dashboard - Coming Soon</div>;
}
