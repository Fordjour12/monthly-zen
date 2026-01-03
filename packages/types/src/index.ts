export interface TaskDescription {
  task_description: string;
  focus_area: string;
  start_time: string;
  end_time: string;
  difficulty_level: "simple" | "moderate" | "advanced";
  scheduling_reason: string;
}

export interface DailyTasks {
  [day: string]: TaskDescription[];
}

export interface WeeklyBreakdown {
  week: number;
  focus: string;
  goals: string[];
  daily_tasks: DailyTasks;
}

export interface StructuredAIResponse {
  monthly_summary?: string;
  weekly_breakdown?: WeeklyBreakdown[];
  personalization_notes?: string[];
  productivity_insights?: string[];
  potential_conflicts?: string[];
  success_metrics?: string[];
  energy_management?: string[];
}

export interface ExtractionMetadata {
  confidence: number;
  extractionNotes: string;
  detectedFormat: "json" | "text" | "mixed";
  parsingErrors: string[];
  missingFields: string[];
}

export interface AIResponseWithMetadata {
  rawContent: string;
  structuredData: StructuredAIResponse;
  metadata: ExtractionMetadata;
}

export interface TaskData {
  title: string;
  description?: string;
  dueDate: string;
  priority: "High" | "Medium" | "Low";
  category: string;
  estimatedHours?: number;
  weekNumber?: number;
  dayOfWeek?: string;
}

export type PartialAIResponse = Partial<StructuredAIResponse>;

export type Priority = "High" | "Medium" | "Low";
export type Complexity = "Simple" | "Balanced" | "Ambitious";
export type WeekendFocus = "Work" | "Rest" | "Mixed";

export interface PlanTask {
  id: string;
  title: string;
  description?: string;
  dueDate?: string;
  priority: Priority;
  category: string;
  estimatedHours?: number;
  completed: boolean;
}

export interface MonthlyPlan {
  id: string;
  title: string;
  month: string;
  goals: string[];
  tasks: PlanTask[];
  totalTasks: number;
  estimatedHours: number;
  confidence?: number;
  extractionNotes?: string;
}

// Resolution Types
export type ResolutionCategory =
  | "health"
  | "career"
  | "learning"
  | "finance"
  | "relationships"
  | "personal"
  | "productivity"
  | "other";

export type ResolutionType = "monthly" | "yearly";

export type ResolutionPriority = 1 | 2 | 3;

export interface Resolution {
  id: string;
  userId: string;
  text: string;
  category: ResolutionCategory;
  resolutionType: ResolutionType;
  priority: ResolutionPriority;
  startDate: string;
  targetDate?: string;
  isRecurring: boolean;
  recurringInterval?: "monthly" | "weekly";
  isAchieved: boolean;
  achievedAt?: string;
  archivedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ResolutionWithProgress extends Resolution {
  progressPercent: number;
  linkedTaskCount: number;
  completedTaskCount: number;
  tasks?: ResolutionTask[];
}

export interface ResolutionTask {
  id: number;
  description: string;
  isCompleted: boolean;
  weekOf: string;
}

export interface YearlySummary {
  year: number;
  totalResolutions: number;
  completed: number;
  inProgress: number;
  completionRate: number;
  averageProgress: number;
}
