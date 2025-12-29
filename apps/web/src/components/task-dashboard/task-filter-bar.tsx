/**
 * Task Filter Bar Component
 *
 * Horizontal filter controls for the task dashboard with status tabs,
 * focus area filter, difficulty filter, search, and sort controls.
 */

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowUpDown, Search, X } from "lucide-react";
import type { TaskFilters, TaskStatus, DifficultyLevel, SortBy } from "@/hooks/useTasks";

interface TaskFilterBarProps {
  filters: TaskFilters;
  focusAreas: string[];
  onUpdateFilter: <K extends keyof TaskFilters>(key: K, value: TaskFilters[K]) => void;
  onResetFilters: () => void;
  onToggleSort: () => void;
}

export function TaskFilterBar({
  filters,
  focusAreas,
  onUpdateFilter,
  onResetFilters,
  onToggleSort,
}: TaskFilterBarProps) {
  const hasActiveFilters = filters.focusArea || filters.difficultyLevel || filters.search;

  return (
    <div className="space-y-4">
      {/* Status Tabs */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <Tabs
          value={filters.status || "all"}
          onValueChange={(value) => onUpdateFilter("status", value as TaskStatus)}
        >
          <TabsList variant="line">
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="pending">Pending</TabsTrigger>
            <TabsTrigger value="completed">Completed</TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Search Input */}
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search tasks..."
            value={filters.search || ""}
            onChange={(e) => onUpdateFilter("search", e.target.value)}
            className="pl-8 h-8"
          />
          {filters.search && (
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-1 top-1/2 -translate-y-1/2 h-6 w-6"
              onClick={() => onUpdateFilter("search", undefined)}
            >
              <X className="h-3 w-3" />
            </Button>
          )}
        </div>
      </div>

      {/* Secondary Filters Row */}
      <div className="flex items-center gap-3 flex-wrap">
        {/* Focus Area Filter */}
        <Select
          value={filters.focusArea || "all"}
          onValueChange={(value) =>
            onUpdateFilter("focusArea", value === "all" ? undefined : value)
          }
        >
          <SelectTrigger size="sm" className="w-40">
            <SelectValue placeholder="Focus Area" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Areas</SelectItem>
            {focusAreas.map((area) => (
              <SelectItem key={area} value={area}>
                {area}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Difficulty Filter */}
        <Select
          value={filters.difficultyLevel || "all"}
          onValueChange={(value) =>
            onUpdateFilter(
              "difficultyLevel",
              value === "all" ? undefined : (value as DifficultyLevel),
            )
          }
        >
          <SelectTrigger size="sm" className="w-36">
            <SelectValue placeholder="Difficulty" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Levels</SelectItem>
            <SelectItem value="simple">Simple</SelectItem>
            <SelectItem value="moderate">Moderate</SelectItem>
            <SelectItem value="advanced">Advanced</SelectItem>
          </SelectContent>
        </Select>

        {/* Sort By */}
        <Select
          value={filters.sortBy || "date"}
          onValueChange={(value) => onUpdateFilter("sortBy", value as SortBy)}
        >
          <SelectTrigger size="sm" className="w-36">
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="date">Date</SelectItem>
            <SelectItem value="difficulty">Difficulty</SelectItem>
            <SelectItem value="focusArea">Focus Area</SelectItem>
          </SelectContent>
        </Select>

        {/* Sort Order Toggle */}
        <Button variant="outline" size="sm" onClick={onToggleSort} className="gap-1.5">
          <ArrowUpDown className="h-3.5 w-3.5" />
          {filters.sortOrder === "asc" ? "Asc" : "Desc"}
        </Button>

        {/* Reset Filters */}
        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onResetFilters}
            className="text-muted-foreground"
          >
            <X className="h-3.5 w-3.5 mr-1" />
            Clear
          </Button>
        )}
      </div>
    </div>
  );
}
