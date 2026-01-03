import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Modal,
  Pressable,
  StyleSheet,
} from "react-native";
import { useRouter } from "expo-router";
import { Container } from "@/components/ui/container";
import { Ionicons } from "@expo/vector-icons";

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

const COACH_TONES = ["encouraging", "direct", "analytical", "friendly"] as const;
type CoachTone = (typeof COACH_TONES)[number];

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

interface ResolutionInput {
  title: string;
  category: ResolutionCategory;
  targetCount: number;
}

export default function GoalsScreen() {
  const router = useRouter();
  const [goals, setGoals] = useState({
    goal1: "",
    goal2: "",
    goal3: "",
  });
  const [resolutions, setResolutions] = useState<ResolutionInput[]>([]);
  const [showResolutionModal, setShowResolutionModal] = useState(false);
  const [newResolution, setNewResolution] = useState<ResolutionInput>({
    title: "",
    category: "personal",
    targetCount: 12,
  });

  const [preferences, setPreferences] = useState({
    coachName: "Coach",
    coachTone: "encouraging" as CoachTone,
  });

  const isNextDisabled = !goals.goal1.trim() && !goals.goal2.trim() && !goals.goal3.trim();

  const handleNext = () => {
    // Save resolutions to local storage (will be synced to server later)
    if (resolutions.length > 0) {
      // @ts-ignore - Storage API
      try {
        localStorage.setItem("pendingResolutions", JSON.stringify(resolutions));
      } catch (e) {
        // localStorage not available in React Native
        console.log("Could not save resolutions to storage");
      }
    }
    router.push("/onboarding/generating");
  };

  const addResolution = () => {
    if (newResolution.title.trim()) {
      setResolutions([...resolutions, { ...newResolution }]);
      setNewResolution({ title: "", category: "personal", targetCount: 12 });
      setShowResolutionModal(false);
    }
  };

  const removeResolution = (index: number) => {
    setResolutions(resolutions.filter((_, i) => i !== index));
  };

  const getCategoryLabel = (key: ResolutionCategory) => {
    return RESOLUTION_CATEGORIES.find((c) => c.key === key)?.label || key;
  };

  return (
    <Container>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.container}
      >
        <ScrollView
          style={styles.scrollContent}
          contentContainerStyle={styles.scrollContentContainer}
        >
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="chevron-back" size={24} color="#525252" />
          </TouchableOpacity>

          <Text style={styles.title}>What are your top 3 goals this month?</Text>
          <Text style={styles.subtitle}>
            These will help us generate a balanced plan tailored for you.
          </Text>

          <View style={styles.goalsContainer}>
            {[1, 2, 3].map((num) => (
              <View key={num} style={styles.goalItem}>
                <Text style={styles.goalLabel}>Goal {num}</Text>
                <View style={styles.goalInputContainer}>
                  <TextInput
                    style={styles.goalInput}
                    placeholder={`e.g. ${num === 1 ? "Read 2 books" : num === 2 ? "Go to gym 3x/week" : "Finish project X"}`}
                    placeholderTextColor="#a3a3a3"
                    multiline
                    value={goals[`goal${num}` as keyof typeof goals]}
                    onChangeText={(text) => setGoals({ ...goals, [`goal${num}`]: text })}
                  />
                </View>
              </View>
            ))}
          </View>

          {/* Yearly Resolutions Section */}
          <View style={styles.resolutionsSection}>
            <View style={styles.resolutionsHeader}>
              <View>
                <Text style={styles.resolutionsTitle}>Yearly Resolutions</Text>
                <Text style={styles.resolutionsSubtitle}>
                  Add resolutions to track throughout the year
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => setShowResolutionModal(true)}
                style={styles.addButton}
              >
                <Text style={styles.addButtonText}>+ Add</Text>
              </TouchableOpacity>
            </View>

            {resolutions.length === 0 ? (
              <View style={styles.emptyState}>
                <Ionicons name="trophy-outline" size={40} color="#a3a3a3" />
                <Text style={styles.emptyStateText}>
                  No resolutions added yet.{"\n"}Add your yearly goals below.
                </Text>
              </View>
            ) : (
              <View style={styles.resolutionsList}>
                {resolutions.map((res, index) => (
                  <View key={index} style={styles.resolutionCard}>
                    <View style={styles.resolutionInfo}>
                      <View style={styles.resolutionIcon}>
                        <Ionicons
                          name={
                            RESOLUTION_CATEGORIES.find((c) => c.key === res.category)?.icon as any
                          }
                          size={20}
                          color={getCategoryColor(res.category)}
                        />
                      </View>
                      <View style={styles.resolutionText}>
                        <Text style={styles.resolutionTitle}>{res.title}</Text>
                        <Text style={styles.resolutionMeta}>
                          {getCategoryLabel(res.category)} • {res.targetCount} times/year
                        </Text>
                      </View>
                    </View>
                    <TouchableOpacity onPress={() => removeResolution(index)}>
                      <Ionicons name="close-circle" size={24} color="#EF4444" />
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            )}
          </View>

          {/* Coach Preferences Section */}
          <View style={styles.preferencesSection}>
            <Text style={styles.preferencesTitle}>Customize Your Coach</Text>
            <Text style={styles.preferencesSubtitle}>
              Personalize how your AI coach interacts with you
            </Text>

            <View style={styles.preferenceCard}>
              <Text style={styles.inputLabel}>Coach Name</Text>
              <View style={styles.modalInputContainer}>
                <TextInput
                  style={styles.goalInput}
                  placeholder="e.g., Alex, Coach Zen"
                  placeholderTextColor="#a3a3a3"
                  value={preferences.coachName}
                  onChangeText={(text) => setPreferences((prev) => ({ ...prev, coachName: text }))}
                />
              </View>

              <Text style={styles.inputLabel}>Coach Tone</Text>
              <View style={styles.toneContainer}>
                {COACH_TONES.map((tone) => {
                  const isSelected = preferences.coachTone === tone;
                  return (
                    <TouchableOpacity
                      key={tone}
                      onPress={() =>
                        setPreferences((prev) => ({ ...prev, coachTone: tone as CoachTone }))
                      }
                      style={[styles.toneButton, isSelected && styles.toneButtonSelected]}
                    >
                      <Text
                        style={[styles.toneButtonText, isSelected && styles.toneButtonTextSelected]}
                      >
                        {tone.charAt(0).toUpperCase() + tone.slice(1)}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              <Text style={styles.toneDescription}>
                {preferences.coachTone === "encouraging" &&
                  "Empathetic, celebrates progress, uses positive reinforcement"}
                {preferences.coachTone === "direct" && "Concise, action-focused, minimal fluff"}
                {preferences.coachTone === "analytical" &&
                  "Data-driven, metrics-focused, structured"}
                {preferences.coachTone === "friendly" && "Casual, conversational, informal"}
              </Text>
            </View>
          </View>
        </ScrollView>

        <View style={styles.footer}>
          <TouchableOpacity
            onPress={handleNext}
            disabled={isNextDisabled}
            style={[styles.generateButton, isNextDisabled && styles.generateButtonDisabled]}
          >
            <Text style={styles.generateButtonText}>Generate My Plan</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>

      {/* Resolution Modal */}
      <Modal
        visible={showResolutionModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowResolutionModal(false)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setShowResolutionModal(false)}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add Resolution</Text>
              <TouchableOpacity onPress={() => setShowResolutionModal(false)}>
                <Ionicons name="close" size={24} color="#525252" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={styles.inputLabel}>Resolution Title</Text>
              <View style={styles.modalInputContainer}>
                <TextInput
                  style={styles.modalInput}
                  placeholder="e.g. Exercise regularly"
                  placeholderTextColor="#a3a3a3"
                  value={newResolution.title}
                  onChangeText={(text) => setNewResolution({ ...newResolution, title: text })}
                />
              </View>

              <Text style={styles.inputLabel}>Category</Text>
              <View style={styles.categoryContainer}>
                {RESOLUTION_CATEGORIES.map((cat) => {
                  const isSelected = newResolution.category === cat.key;
                  return (
                    <TouchableOpacity
                      key={cat.key}
                      onPress={() =>
                        setNewResolution({
                          ...newResolution,
                          category: cat.key as ResolutionCategory,
                        })
                      }
                      style={[
                        styles.categoryButton,
                        isSelected && {
                          borderColor: "#3B82F6",
                          backgroundColor: "rgba(59, 130, 246, 0.1)",
                        },
                      ]}
                    >
                      <View style={styles.categoryButtonContent}>
                        <Ionicons
                          name={cat.icon as any}
                          size={16}
                          color={getCategoryColor(cat.key)}
                        />
                        <Text
                          style={[styles.categoryButtonText, isSelected && { color: "#3B82F6" }]}
                        >
                          {cat.label}
                        </Text>
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>

              <Text style={styles.inputLabel}>Target Count (times per year)</Text>
              <View style={styles.counterContainer}>
                <TouchableOpacity
                  onPress={() =>
                    setNewResolution({
                      ...newResolution,
                      targetCount: Math.max(1, newResolution.targetCount - 1),
                    })
                  }
                  style={styles.counterButton}
                >
                  <Ionicons name="remove" size={24} color="#525252" />
                </TouchableOpacity>
                <Text style={styles.counterValue}>{newResolution.targetCount}</Text>
                <TouchableOpacity
                  onPress={() =>
                    setNewResolution({
                      ...newResolution,
                      targetCount: newResolution.targetCount + 1,
                    })
                  }
                  style={styles.counterButton}
                >
                  <Ionicons name="add" size={24} color="#525252" />
                </TouchableOpacity>
              </View>

              <TouchableOpacity
                onPress={addResolution}
                disabled={!newResolution.title.trim()}
                style={[
                  styles.addResolutionButton,
                  !newResolution.title.trim() && styles.addResolutionButtonDisabled,
                ]}
              >
                <Text style={styles.addResolutionButtonText}>Add Resolution</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </Pressable>
      </Modal>
    </Container>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flex: 1,
  },
  scrollContentContainer: {
    paddingBottom: 80,
  },
  backButton: {
    marginBottom: 32,
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(115, 115, 115, 0.2)",
    borderRadius: 9999,
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    color: "#f5f5f5",
    marginBottom: 16,
  },
  subtitle: {
    fontSize: 18,
    color: "#a3a3a3",
    marginBottom: 32,
  },
  goalsContainer: {
    gap: 16,
    marginBottom: 32,
  },
  goalItem: {
    gap: 8,
  },
  goalLabel: {
    fontSize: 14,
    fontWeight: "500",
    color: "#a3a3a3",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginLeft: 4,
  },
  goalInputContainer: {
    backgroundColor: "#262626",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#404040",
    paddingHorizontal: 16,
    paddingVertical: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  goalInput: {
    fontSize: 18,
    color: "#f5f5f5",
  },
  resolutionsSection: {
    borderTopWidth: 1,
    borderColor: "#404040",
    paddingTop: 24,
    marginBottom: 16,
  },
  resolutionsHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  resolutionsTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#f5f5f5",
  },
  resolutionsSubtitle: {
    fontSize: 14,
    color: "#a3a3a3",
  },
  addButton: {
    backgroundColor: "#3B82F6",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 9999,
  },
  addButtonText: {
    color: "white",
    fontWeight: "600",
  },
  emptyState: {
    backgroundColor: "rgba(115, 115, 115, 0.3)",
    borderRadius: 16,
    padding: 24,
    alignItems: "center",
  },
  emptyStateText: {
    color: "#a3a3a3",
    textAlign: "center",
    marginTop: 8,
    lineHeight: 20,
  },
  resolutionsList: {
    gap: 12,
  },
  resolutionCard: {
    backgroundColor: "#262626",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#404040",
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  resolutionInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
  },
  resolutionIcon: {
    width: 40,
    height: 40,
    borderRadius: 9999,
    alignItems: "center",
    justifyContent: "center",
  },
  resolutionText: {
    flex: 1,
  },
  resolutionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#f5f5f5",
  },
  resolutionMeta: {
    fontSize: 14,
    color: "#a3a3a3",
  },
  footer: {
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  generateButton: {
    height: 64,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#3B82F6",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    backgroundColor: "#3B82F6",
  },
  generateButtonDisabled: {
    backgroundColor: "rgba(115, 115, 115, 0.3)",
    shadowOpacity: 0,
  },
  generateButtonText: {
    color: "white",
    fontSize: 20,
    fontWeight: "700",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  modalContent: {
    backgroundColor: "#262626",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 40,
    maxHeight: "80%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 24,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#f5f5f5",
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: "500",
    color: "#a3a3a3",
    marginBottom: 8,
  },
  modalInputContainer: {
    backgroundColor: "rgba(115, 115, 115, 0.3)",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#404040",
    paddingHorizontal: 16,
    paddingVertical: 16,
    marginBottom: 16,
  },
  modalInput: {
    fontSize: 18,
    color: "#f5f5f5",
  },
  categoryContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 16,
  },
  categoryButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 9999,
    borderWidth: 1,
    borderColor: "#404040",
  },
  categoryButtonContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  categoryButtonText: {
    fontSize: 14,
    color: "#a3a3a3",
  },
  counterContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    marginBottom: 24,
  },
  counterButton: {
    width: 48,
    height: 48,
    borderRadius: 9999,
    backgroundColor: "rgba(115, 115, 115, 0.3)",
    alignItems: "center",
    justifyContent: "center",
  },
  counterValue: {
    fontSize: 28,
    fontWeight: "700",
    color: "#f5f5f5",
    width: 64,
    textAlign: "center",
  },
  addResolutionButton: {
    height: 56,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#3B82F6",
  },
  addResolutionButtonDisabled: {
    backgroundColor: "rgba(115, 115, 115, 0.3)",
  },
  addResolutionButtonText: {
    color: "white",
    fontSize: 18,
    fontWeight: "700",
  },
  preferencesSection: {
    borderTopWidth: 1,
    borderColor: "#404040",
    paddingTop: 24,
    marginBottom: 16,
  },
  preferencesTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#f5f5f5",
    marginBottom: 8,
  },
  preferencesSubtitle: {
    fontSize: 14,
    color: "#a3a3a3",
    marginBottom: 16,
  },
  preferenceCard: {
    backgroundColor: "#262626",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#404040",
    padding: 16,
  },
  toneContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 12,
  },
  toneButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 9999,
    borderWidth: 1,
    borderColor: "#404040",
    backgroundColor: "transparent",
  },
  toneButtonSelected: {
    borderColor: "#3B82F6",
    backgroundColor: "rgba(59, 130, 246, 0.1)",
  },
  toneButtonText: {
    fontSize: 14,
    color: "#a3a3a3",
    textTransform: "capitalize",
  },
  toneButtonTextSelected: {
    color: "#3B82F6",
    fontWeight: "600",
  },
  toneDescription: {
    fontSize: 12,
    color: "#737373",
    fontStyle: "italic",
  },
});
