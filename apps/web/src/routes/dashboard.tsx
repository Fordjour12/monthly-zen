import { useQuery } from "@tanstack/react-query";
import { createFileRoute, redirect, Link } from "@tanstack/react-router";
import { ListTodo, ArrowRight, CheckCircle2, Circle } from "lucide-react";

import { getUser } from "@/functions/get-user";
import { orpc } from "@/utils/orpc";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";

export const Route = createFileRoute("/dashboard")({
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
  const { session } = Route.useRouteContext();

  const privateData = useQuery(orpc.privateData.queryOptions());

  // Fetch tasks for quick stats
  const tasksQuery = useQuery(
    orpc.tasks.list.queryOptions({
      input: {},
    }),
  );

import type { Task } from "@/hooks/useTasks";

const tasks = (tasksQuery.data?.data as Task[]) || [];
const totalTasks = tasks.length;
const completedTasks = tasks.filter((t) => t.isCompleted).length;
const pendingTasks = totalTasks - completedTasks;
const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">Welcome back, {session?.user.name}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Tasks Quick Access Card */}
          <Card className="col-span-1">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
                    <ListTodo className="h-4 w-4 text-primary" />
                  </div>
                  <CardTitle>Tasks</CardTitle>
                </div>
              </div>
              <CardDescription>Your monthly plan tasks</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {tasksQuery.isLoading ? (
                <div className="animate-pulse space-y-3">
                  <div className="h-4 bg-muted rounded w-full" />
                  <div className="h-2 bg-muted rounded w-3/4" />
                </div>
              ) : totalTasks === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No tasks yet. Generate a plan to get started.
                </p>
              ) : (
                <>
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-primary" />
                      <span>{completedTasks} completed</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Circle className="h-4 w-4 text-muted-foreground" />
                      <span>{pendingTasks} pending</span>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>Progress</span>
                      <span>{completionRate}%</span>
                    </div>
                    <Progress value={completionRate} className="h-2" />
                  </div>
                </>
              )}
            </CardContent>
            <CardFooter className="border-t">
              <Button asChild variant="ghost" className="w-full justify-between">
                <Link to="/tasks">
                  View All Tasks
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </CardFooter>
          </Card>

          {/* API Status Card (existing) */}
          <Card className="col-span-1">
            <CardHeader>
              <CardTitle>API Status</CardTitle>
              <CardDescription>Connection to backend services</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm">{privateData.data?.message || "Loading..."}</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
