export const RESOLUTION_CATEGORIES = [
  { key: "health", label: "Health & Fitness", icon: "heart" },
  { key: "career", label: "Career & Work", icon: "briefcase" },
  { key: "learning", label: "Learning & Growth", icon: "book" },
  { key: "finance", label: "Finance", icon: "cash" },
  { key: "relationships", label: "Relationships", icon: "people" },
  { key: "personal", label: "Personal Development", icon: "person" },
  { key: "productivity", label: "Productivity", icon: "checkmark-circle" },
  { key: "other", label: "Other", icon: "ellipsis-horizontal" },
] as const;

export type ResolutionCategory = (typeof RESOLUTION_CATEGORIES)[number]["key"];

export function getCategoryColor(key: string): string {
  const colors: Record<string, string> = {
    health: "#EF4444",
    career: "#3B82F6",
    learning: "#8B5CF6",
    finance: "#22C55E",
    relationships: "#EC4899",
    personal: "#F97316",
    productivity: "#06B6D4",
    other: "#6B7280",
  };
  return colors[key] || colors.other;
}
