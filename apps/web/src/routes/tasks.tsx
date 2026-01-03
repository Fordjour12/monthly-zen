import { createFileRoute } from "@tanstack/react-router";
import { getUser } from "@/functions/get-user";
import { redirect } from "@tanstack/react-router";
import { useHabits } from "@/hooks/useHabits";

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
  const { habits, stats, isLoading, toggleHabit, createHabit } = useHabits();

  if (isLoading) {
    return (
      <div className="p-8 text-center">
        <div className="text-lg">Loading habits...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <h1 className="text-3xl font-bold mb-2">Habits</h1>
      <p className="text-muted-foreground mb-8">Build consistency one day at a time</p>

      {/* Stats */}
      <div className="bg-card border rounded-xl p-4 mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
              <span className="text-xl">🔥</span>
            </div>
            <div>
              <div className="font-semibold">
                {stats.completedToday} of {stats.totalHabits} completed today
              </div>
              <div className="text-sm text-muted-foreground">
                {stats.completionRate}% weekly average
              </div>
            </div>
          </div>
          {stats.currentStreak > 0 && (
            <div className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-accent/10 text-accent">
              <span>🏆</span>
              <span className="font-semibold">{stats.currentStreak} day streak</span>
            </div>
          )}
        </div>
      </div>

      {/* Habits List */}
      {habits.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">🌱</div>
          <h2 className="text-xl font-semibold mb-2">No habits yet</h2>
          <p className="text-muted-foreground mb-4">
            Start building better habits by creating your first one.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {habits.map((habit) => (
            <div
              key={habit.id}
              className="flex items-center gap-4 p-4 bg-card border rounded-xl"
              style={{ borderLeftWidth: 4, borderLeftColor: habit.color }}
            >
              <button
                onClick={() => toggleHabit(habit.id)}
                className={`w-8 h-8 rounded-full border-2 flex items-center justify-center ${
                  habit.isCompletedToday ? "border-primary" : "border-border"
                }`}
                style={{
                  backgroundColor: habit.isCompletedToday ? habit.color : undefined,
                }}
              >
                {habit.isCompletedToday && <span className="text-white text-sm">✓</span>}
              </button>

              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-lg">{habit.icon}</span>
                  <span className="font-semibold">{habit.name}</span>
                </div>
                <div className="text-sm text-muted-foreground">
                  {habit.currentStreak > 0 && `🔥 ${habit.currentStreak} streak • `}
                  {habit.completionRate}% this week
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Habit Button */}
      <button
        onClick={() => {
          const name = prompt("Habit name:");
          if (name) {
            createHabit({
              name,
              frequency: "daily",
              color: "#3B82F6",
              icon: "🎯",
            });
          }
        }}
        className="w-full py-3 mt-6 bg-primary text-primary-foreground rounded-xl font-semibold"
      >
        Add New Habit
      </button>
    </div>
  );
}
