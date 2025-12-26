"use client";

import { useState, useEffect } from "react";
import { format, addMonths, subMonths } from "date-fns";
import { AppSidebar } from "./components/app-sidebar";
import { TaskCalendarGrid } from "./task-calendar-grid";
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
import { ChevronLeft, ChevronRight } from "lucide-react";

interface CalendarTask {
  id: number;
  taskDescription: string;
  focusArea: string;
  startTime: Date;
  endTime: Date;
  difficultyLevel: "simple" | "moderate" | "advanced";
  isCompleted: boolean;
}

export default function CalendarPage() {
  const [selectedMonth, setSelectedMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedFocusAreas, setSelectedFocusAreas] = useState<string[]>([]);

  const [tasks, setTasks] = useState<CalendarTask[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchTasks = async (month: Date) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(
        "/api/calendar/tasks?" +
          new URLSearchParams({
            month: format(month, "yyyy-MM"),
          }),
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to fetch tasks");
      }

      const result = await response.json();
      const tasksWithDates = result.data.map((task: any) => ({
        ...task,
        startTime: new Date(task.startTime),
        endTime: new Date(task.endTime),
      }));

      setTasks(tasksWithDates);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
      console.error("Error fetching tasks:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks(selectedMonth);
  }, [selectedMonth]);

  const filteredTasks = tasks.filter((task) => {
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
    setSelectedMonth(new Date());
    setSelectedDate(new Date());
  };

  const handleFocusAreaToggle = (area: string) => {
    setSelectedFocusAreas((prev) =>
      prev.includes(area) ? prev.filter((a) => a !== area) : [...prev, area],
    );
  };

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">Error loading calendar</h2>
          <p className="text-muted-foreground mb-4">{error}</p>
          <Button onClick={() => fetchTasks(selectedMonth)}>Retry</Button>
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
        <header className="bg-background sticky top-0 flex h-16 shrink-0 items-center gap-2 border-b px-4">
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
                <BreadcrumbPage>{format(selectedMonth, "MMMM yyyy")}</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>

          {isLoading && <div className="text-sm text-muted-foreground">Loading...</div>}
        </header>

        <div className="flex flex-1 p-4">
          <TaskCalendarGrid
            tasks={filteredTasks}
            selectedMonth={selectedMonth}
            onMonthChange={handleMonthChange}
            onDateSelect={setSelectedDate}
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
          onTaskUpdate={() => fetchTasks(selectedMonth)}
        />
      )}
    </SidebarProvider>
  );
}
