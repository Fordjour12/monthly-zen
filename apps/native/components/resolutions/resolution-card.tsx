/**
 * Resolution Card Component
 *
 * Displays a single resolution with progress tracking and completion toggle
 */

import React, { useCallback } from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import type { ResolutionWithProgress } from "@monthly-zen/types";

// Resolution categories (mirrored from packages/db/src/constants/resolution-categories.ts)
const RESOLUTION_CATEGORIES = [
  { key: "health", label: "Health & Fitness", icon: "heart" },
  { key: "career", label: "Career & Work", icon: "briefcase" },
  { key: "learning", label: "Learning & Growth", icon: "book" },
  { key: "finance", label: "Finance", icon: "cash" },
  { key: "relationships", label: "Relationships", icon: "people" },
  { key: "personal", label: "Personal Development", icon: "person" },
  { key: "productivity", label: "Productivity", icon: "checkmark-circle" },
  { key: "other", label: "Other", icon: "ellipsis-horizontal" },
] as const;

type ResolutionCategory = (typeof RESOLUTION_CATEGORIES)[number]["key"];

function getCategoryColor(key: string): string {
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

interface ResolutionCardProps {
  resolution: ResolutionWithProgress;
  onToggleComplete: (id: number) => void;
  onEdit?: (resolution: ResolutionWithProgress) => void;
  onDelete?: (id: number) => void;
  onViewDetails?: (resolution: ResolutionWithProgress) => void;
}

export function ResolutionCard({
  resolution,
  onToggleComplete,
  onEdit,
  onDelete,
  onViewDetails,
}: ResolutionCardProps) {
  const category = RESOLUTION_CATEGORIES.find((c) => c.key === resolution.category);
  const categoryColor = getCategoryColor(resolution.category);
  const progressPercent = Math.min(
    100,
    Math.round((resolution.progress / resolution.targetCount) * 100),
  );
  const isCompleted = resolution.progress >= resolution.targetCount;

  const handleToggle = useCallback(() => {
    onToggleComplete(resolution.id);
  }, [resolution.id, onToggleComplete]);

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={[styles.iconContainer, { backgroundColor: categoryColor + "20" }]}>
          <Ionicons name={category?.icon as any} size={24} color={categoryColor} />
        </View>
        <View style={styles.info}>
          <Text style={styles.title}>{resolution.title}</Text>
          <Text style={styles.category}>{category?.label || resolution.category}</Text>
        </View>
        <TouchableOpacity
          onPress={handleToggle}
          style={[
            styles.checkbox,
            {
              borderColor: isCompleted ? categoryColor : "#525252",
              backgroundColor: isCompleted ? categoryColor : "transparent",
            },
          ]}
        >
          {isCompleted && <Ionicons name="checkmark" size={18} color="white" />}
        </TouchableOpacity>
      </View>

      <View style={styles.progressSection}>
        <View style={styles.progressHeader}>
          <Text style={styles.progressLabel}>
            {resolution.progress} / {resolution.targetCount} completed
          </Text>
          <Text style={styles.progressPercent}>{progressPercent}%</Text>
        </View>
        <View style={styles.progressBar}>
          <View
            style={[
              styles.progressFill,
              {
                width: `${progressPercent}%`,
                backgroundColor: categoryColor,
              },
            ]}
          />
        </View>
      </View>

      {(onEdit || onDelete || onViewDetails) && (
        <View style={styles.actions}>
          {onViewDetails && (
            <TouchableOpacity onPress={() => onViewDetails(resolution)} style={styles.actionButton}>
              <Ionicons name="stats-chart" size={18} color="#a3a3a3" />
              <Text style={styles.actionText}>Details</Text>
            </TouchableOpacity>
          )}
          {onEdit && (
            <TouchableOpacity onPress={() => onEdit(resolution)} style={styles.actionButton}>
              <Ionicons name="create-outline" size={18} color="#a3a3a3" />
              <Text style={styles.actionText}>Edit</Text>
            </TouchableOpacity>
          )}
          {onDelete && (
            <TouchableOpacity onPress={() => onDelete(resolution.id)} style={styles.actionButton}>
              <Ionicons name="trash-outline" size={18} color="#EF4444" />
              <Text style={[styles.actionText, { color: "#EF4444" }]}>Delete</Text>
            </TouchableOpacity>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#262626",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#404040",
    padding: 16,
    marginBottom: 12,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 9999,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  info: {
    flex: 1,
  },
  title: {
    fontSize: 18,
    fontWeight: "600",
    color: "#f5f5f5",
    marginBottom: 4,
  },
  category: {
    fontSize: 14,
    color: "#a3a3a3",
  },
  checkbox: {
    width: 32,
    height: 32,
    borderRadius: 9999,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  progressSection: {
    marginBottom: 12,
  },
  progressHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  progressLabel: {
    fontSize: 14,
    color: "#a3a3a3",
  },
  progressPercent: {
    fontSize: 14,
    fontWeight: "600",
    color: "#f5f5f5",
  },
  progressBar: {
    height: 8,
    backgroundColor: "rgba(115, 115, 115, 0.3)",
    borderRadius: 4,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: 4,
  },
  actions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 16,
    borderTopWidth: 1,
    borderTopColor: "#404040",
    paddingTop: 12,
    marginTop: 4,
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    padding: 4,
  },
  actionText: {
    fontSize: 14,
    color: "#a3a3a3",
  },
});
