"use client";

import { useState } from "react";
import { format, addMonths, subMonths } from "date-fns";
import { AppSidebar } from "./components/app-sidebar";
import { TaskCalendarGrid, type ViewMode } from "./task-calendar-grid";
import { TaskDetailSheet } from "./task-detail-sheet";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
} from "@/components/ui/breadcrumb";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { ChevronLeft, ChevronRight, Flame, List } from "lucide-react";
import { orpc } from "@/utils/orpc";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

export default function CalendarPage() {
  const [selectedMonth, setSelectedMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedFocusAreas, setSelectedFocusAreas] = useState<string[]>([]);
  const [viewMode, setViewMode] = useState<ViewMode>("normal");
  const queryClient = useQueryClient();

  // Tasks Query
  const {
    data: tasksResult,
    isLoading,
    error,
  } = useQuery(
    orpc.calendar.getTasks.queryOptions({
      input: { month: format(selectedMonth, "yyyy-MM") },
    }),
  );

  // Habit Stats Query
  const { data: habitStatsResult } = useQuery(
    orpc.calendar.getHabitStats.queryOptions({
      input: { month: format(selectedMonth, "yyyy-MM") },
    }),
  );

  const tasks = tasksResult?.success ? tasksResult.data : [];
  const habitStats = habitStatsResult?.success ? habitStatsResult.data : [];

  // Task Update Mutation
  const updateTaskMutation = useMutation(
    orpc.calendar.updateTaskStatus.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["calendar", "getTasks"] });
        toast.success("Task updated");
      },
      onError: (err) => {
        toast.error(err.message || "Failed to update task");
      },
    }),
  );

  const filteredTasks = tasks
    .map((task) => ({
      ...task,
      startTime: new Date(task.startTime),
      endTime: new Date(task.endTime),
      completedAt: task.completedAt ? new Date(task.completedAt) : null,
    }))
    .filter((task) => {
      if (selectedFocusAreas.length === 0) return true;
      return selectedFocusAreas.includes(task.focusArea);
    });

  const handleMonthChange = (newMonth: Date) => {
    setSelectedMonth(newMonth);
    setSelectedDate(null);
  };

  const handlePreviousMonth = () => {
    setSelectedMonth((prev) => subMonths(prev, 1));
    setSelectedDate(null);
  };

  const handleNextMonth = () => {
    setSelectedMonth((prev) => addMonths(prev, 1));
    setSelectedDate(null);
  };

  const handleTodayClick = () => {
    const today = new Date();
    setSelectedMonth(today);
    setSelectedDate(today);
  };

  const handleFocusAreaToggle = (area: string) => {
    setSelectedFocusAreas((prev) =>
      prev.includes(area) ? prev.filter((a) => a !== area) : [...prev, area],
    );
  };

  const handleTaskToggle = (taskId: number, isCompleted: boolean) => {
    updateTaskMutation.mutate({ taskId, isCompleted });
  };

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">Error loading calendar</h2>
          <p className="text-foreground mb-4">{(error as Error).message}</p>
          <Button
            onClick={() => queryClient.invalidateQueries({ queryKey: ["calendar", "getTasks"] })}
          >
            Retry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <SidebarProvider>
      <AppSidebar
        selectedFocusAreas={selectedFocusAreas}
        onToggleFocusArea={handleFocusAreaToggle}
        onTodayClick={handleTodayClick}
      />
      <SidebarInset>
        <header className="bg-background sticky top-0 flex h-16 shrink-0 items-center gap-2 border-b px-4 z-10">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 data-[orientation=vertical]:h-4" />

          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={handlePreviousMonth} disabled={isLoading}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" onClick={handleNextMonth} disabled={isLoading}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

          <Breadcrumb className="flex-1">
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbPage className="font-semibold text-lg">
                  {format(selectedMonth, "MMMM yyyy")}
                </BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>

          <div className="flex items-center gap-2">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant={viewMode === "normal" ? "default" : "outline"}
                    size="icon"
                    onClick={() => setViewMode("normal")}
                  >
                    <List className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Normal View</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant={viewMode === "heatmap" ? "default" : "outline"}
                    size="icon"
                    onClick={() => setViewMode("heatmap")}
                  >
                    <Flame className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Heatmap View</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>

          {isLoading && (
            <div className="text-sm text-muted-foreground animate-pulse">Syncing...</div>
          )}
        </header>

        <div className="flex flex-1 p-4 overflow-hidden">
          <TaskCalendarGrid
            tasks={filteredTasks}
            selectedMonth={selectedMonth}
            onMonthChange={handleMonthChange}
            onDateSelect={setSelectedDate}
            filteredFocusAreas={selectedFocusAreas}
            viewMode={viewMode}
            habitStats={habitStats}
          />
        </div>
      </SidebarInset>

      {selectedDate && (
        <TaskDetailSheet
          isOpen={!!selectedDate}
          onClose={() => setSelectedDate(null)}
          date={selectedDate}
          tasks={filteredTasks.filter(
            (task) => format(task.startTime, "yyyy-MM-dd") === format(selectedDate, "yyyy-MM-dd"),
          )}
          onTaskToggle={handleTaskToggle}
        />
      )}
    </SidebarProvider>
  );
}
