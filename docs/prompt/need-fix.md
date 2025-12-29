In apps/native/components/tasks/task-filter-bar.tsx around lines 13 to 19, the
props focusAreas and onResetFilters are declared but never used; either remove
them from TaskFilterBarProps if not needed, or implement their functionality:
add a focus-area selector control that uses focusAreas to render options and
calls onUpdateFilter with the selected focus area, and add a "Reset Filters"
button that calls onResetFilters (and optionally resets local state) to clear
filters; update prop usage and tests accordingly.

In packages/api/src/routers/tasks.ts around lines 125 to 130, the result of
db.updateTaskStatus is not checked for null/undefined; if the update failed
(e.g., task removed concurrently) you must guard against updatedTask being
falsy. After calling db.updateTaskStatus, add a null check and handle it by
returning a failure response (success: false) with an appropriate message and
status (e.g., 404 or "Task not found") or throw the router's expected error
type; otherwise proceed to return the success payload. Ensure the branch is
covered and no code assumes updatedTask is always defined.

In packages/db/src/queries/plan-generation.ts around lines 49 to 57, the code
currently substitutes invalid start_time/end_time with new Date(), causing tasks
to be scheduled at now; instead detect invalid dates (isNaN(startTime.getTime())
or isNaN(endTime.getTime())) and skip adding that task to tasksToSave while
emitting a warning-level log (or metrics) that includes the task id/planId and
which date was invalid; alternatively, if business rules require preserving the
task, set startTime/endTime to null (sentinel) and persist accordingly —
implement the skip-with-warning approach unless a sentinel/null is expected by
downstream code.
