/**
 * Task Empty State Component
 *
 * Displayed when no tasks match the current filters.
 */

import { Button } from "@/components/ui/button";
import { ListTodo, Plus, RefreshCw } from "lucide-react";
import { Link } from "@tanstack/react-router";

interface TaskEmptyStateProps {
  hasFilters: boolean;
  onResetFilters: () => void;
}

export function TaskEmptyState({ hasFilters, onResetFilters }: TaskEmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mb-6">
        <ListTodo className="h-8 w-8 text-primary" />
      </div>

      {hasFilters ? (
        <>
          <h3 className="text-lg font-semibold mb-2">No tasks found</h3>
          <p className="text-muted-foreground text-sm max-w-sm mb-6">
            No tasks match your current filters. Try adjusting your search criteria or clearing the
            filters.
          </p>
          <Button variant="outline" onClick={onResetFilters} className="gap-2">
            <RefreshCw className="h-4 w-4" />
            Reset Filters
          </Button>
        </>
      ) : (
        <>
          <h3 className="text-lg font-semibold mb-2">No tasks yet</h3>
          <p className="text-muted-foreground text-sm max-w-sm mb-6">
            Generate your first AI-powered monthly plan to start tracking your tasks and goals.
          </p>
          <Button asChild className="gap-2">
            <Link to="/plan">
              <Plus className="h-4 w-4" />
              Create Your First Plan
            </Link>
          </Button>
        </>
      )}
    </div>
  );
}
