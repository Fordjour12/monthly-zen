import { Ionicons } from "@expo/vector-icons";
import { Stack, useLocalSearchParams } from "expo-router";
import { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from "react-native";
import { z } from "zod";
import { useSemanticColors } from "@/utils/theme";
import { Card, TextField, Button, RadioGroup, Divider } from "heroui-native";
import { Container } from "@/components/ui/container";

const GeneratePlanFormDataSchema = z.object({
  goalsText: z.string().min(1, "Goals are required"),
  taskComplexity: z.enum(["Simple", "Balanced", "Ambitious"]),
  focusAreas: z.string().min(1, "Focus areas are required"),
  weekendPreference: z.enum(["Work", "Rest", "Mixed"]),
  fixedCommitmentsJson: z.object({
    commitments: z.array(
      z.object({
        dayOfWeek: z.string().min(1, "Day is required"),
        startTime: z.string().min(1, "Start time is required"),
        endTime: z.string().min(1, "End time is required"),
        description: z.string().min(1, "Description is required"),
      }),
    ),
  }),
});

const taskComplexityOptions = [
  { value: "Simple", label: "Simple", description: "Fewer, manageable tasks" },
  { value: "Balanced", label: "Balanced", description: "Mix of easy and challenging" },
  { value: "Ambitious", label: "Ambitious", description: "Challenging but rewarding" },
] as const;

const weekendPreferenceOptions = [
  { value: "Work", label: "Deep Work", description: "Focus on intensive tasks" },
  { value: "Rest", label: "Rest & Recharge", description: "Keep weekends free" },
  { value: "Mixed", label: "Light Tasks", description: "Easy activities only" },
] as const;

interface FormErrors {
  goalsText?: string;
  focusAreas?: string;
  fixedCommitments?: string;
}

export default function GeneratePlanScreen() {
  const { primary, danger } = useSemanticColors();

  const [goalsText, setGoalsText] = useState("");
  const [taskComplexity, setTaskComplexity] = useState<"Simple" | "Balanced" | "Ambitious">(
    "Balanced",
  );
  const [focusAreas, setFocusAreas] = useState("");
  const [weekendPreference, setWeekendPreference] = useState<"Work" | "Rest" | "Mixed">("Rest");
  const [commitments, setCommitments] = useState<
    Array<{
      dayOfWeek: string;
      startTime: string;
      endTime: string;
      description: string;
    }>
  >([]);

  const [errors, setErrors] = useState<FormErrors>({});

  const { template } = useLocalSearchParams<{ template?: string }>();

  useEffect(() => {
    if (template) {
      try {
        const data = JSON.parse(template);
        if (data.goalsText) setGoalsText(data.goalsText);
        if (data.taskComplexity) setTaskComplexity(data.taskComplexity);
        if (data.focusAreas) setFocusAreas(data.focusAreas);
        if (data.weekendPreference) setWeekendPreference(data.weekendPreference);
      } catch (e) {
        console.error("Failed to parse template data:", e);
      }
    }
  }, [template]);

  const validate = () => {
    const result = GeneratePlanFormDataSchema.safeParse({
      goalsText,
      taskComplexity,
      focusAreas,
      weekendPreference,
      fixedCommitmentsJson: { commitments },
    });

    if (!result.success) {
      const fieldErrors: FormErrors = {};
      result.error.issues.forEach((err) => {
        if (err.path[0] === "goalsText") fieldErrors.goalsText = err.message;
        if (err.path[0] === "focusAreas") fieldErrors.focusAreas = err.message;
        if (err.path[0] === "fixedCommitmentsJson")
          fieldErrors.fixedCommitments = "Please check your commitments";
      });
      setErrors(fieldErrors);
      return null;
    }
    setErrors({});
    return result.data;
  };

  const handleSubmit = () => {
    const data = validate();
    if (data) {
      console.log("Form Submitted:", data);
      Alert.alert("Success", "Plan generation started!");
    } else {
      Alert.alert("Error", "Please fix the errors in the form.");
    }
  };

  const addCommitment = () => {
    setCommitments([
      ...commitments,
      { dayOfWeek: "", startTime: "", endTime: "", description: "" },
    ]);
  };

  const removeCommitment = (index: number) => {
    const newCommitments = [...commitments];
    newCommitments.splice(index, 1);
    setCommitments(newCommitments);
  };

  const updateCommitment = (index: number, field: string, value: string) => {
    const newCommitments = [...commitments];
    newCommitments[index] = { ...newCommitments[index], [field]: value };
    setCommitments(newCommitments);
  };

  return (
    <Container>
      <Stack.Screen options={{ title: "Generate Plan", headerShown: false }} />
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1"
      >
        <ScrollView contentContainerClassName="p-4 pb-24">
          <View className="mb-6 mt-4">
            <Text className="text-3xl font-bold text-foreground mb-2">Create New Plan</Text>
            <Text className="text-muted-foreground">
              Configure your monthly plan with your goals and preferences.
            </Text>
          </View>

          <Card>
            <Card.Body className="p-4 space-y-6">
              <View className="space-y-4">
                <View className="flex-row items-center gap-2 mb-1">
                  <Ionicons name="flag" size={20} color={primary} />
                  <Text className="text-lg font-semibold text-foreground">Goals & Objectives</Text>
                </View>

                <TextField isInvalid={!!errors.goalsText}>
                  <TextField.Label>Your Goals</TextField.Label>
                  <TextField.Input
                    placeholder="e.g. Launch website, Read 2 books..."
                    onChangeText={setGoalsText}
                    value={goalsText}
                    multiline
                    numberOfLines={4}
                    textAlignVertical="top"
                  />
                  {errors.goalsText && (
                    <TextField.ErrorMessage>{errors.goalsText}</TextField.ErrorMessage>
                  )}
                </TextField>
              </View>

              <Divider />

              <View className="space-y-4">
                <View className="flex-row items-center gap-2 mb-1">
                  <Ionicons name="flash" size={20} color={primary} />
                  <Text className="text-lg font-semibold text-foreground">Task Complexity</Text>
                </View>

                <RadioGroup
                  value={taskComplexity}
                  onValueChange={(val) => setTaskComplexity(val as any)}
                >
                  {taskComplexityOptions.map((option) => (
                    <RadioGroup.Item key={option.value} value={option.value}>
                      <View>
                        <RadioGroup.Label>{option.label}</RadioGroup.Label>
                        <RadioGroup.Description>{option.description}</RadioGroup.Description>
                      </View>
                      <RadioGroup.Indicator />
                    </RadioGroup.Item>
                  ))}
                </RadioGroup>
              </View>

              <Divider />

              <View className="space-y-4">
                <View className="flex-row items-center gap-2 mb-1">
                  <Ionicons name="location" size={20} color={primary} />
                  <Text className="text-lg font-semibold text-foreground">Focus Areas</Text>
                </View>

                <TextField isInvalid={!!errors.focusAreas}>
                  <TextField.Label>Areas to Focus On</TextField.Label>
                  <TextField.Input
                    placeholder="e.g. Health, Career, Finance"
                    onChangeText={setFocusAreas}
                    value={focusAreas}
                  />
                  {errors.focusAreas && (
                    <TextField.ErrorMessage>{errors.focusAreas}</TextField.ErrorMessage>
                  )}
                </TextField>
              </View>

              <Divider />

              <View className="space-y-4">
                <View className="flex-row items-center gap-2 mb-1">
                  <Ionicons name="calendar-number" size={20} color={primary} />
                  <Text className="text-lg font-semibold text-foreground">Weekend Preference</Text>
                </View>

                <RadioGroup
                  value={weekendPreference}
                  onValueChange={(val) => setWeekendPreference(val as any)}
                >
                  {weekendPreferenceOptions.map((option) => (
                    <RadioGroup.Item key={option.value} value={option.value}>
                      <View>
                        <RadioGroup.Label>{option.label}</RadioGroup.Label>
                        <RadioGroup.Description>{option.description}</RadioGroup.Description>
                      </View>
                      <RadioGroup.Indicator />
                    </RadioGroup.Item>
                  ))}
                </RadioGroup>
              </View>

              <Divider />

              <View className="space-y-4">
                <View className="flex-row items-center justify-between mb-1">
                  <View className="flex-row items-center gap-2">
                    <Ionicons name="time" size={20} color={primary} />
                    <Text className="text-lg font-semibold text-foreground">Fixed Commitments</Text>
                  </View>
                  <Button size="sm" variant="ghost" onPress={addCommitment}>
                    <Button.Label className="text-primary">Add</Button.Label>
                    <Ionicons name="add" size={16} color={primary} />
                  </Button>
                </View>

                {commitments.length === 0 && (
                  <Text className="text-muted-foreground text-center py-4 italic">
                    No fixed commitments added.
                  </Text>
                )}

                {commitments.map((item, index) => (
                  <View
                    key={index}
                    className="p-3 border border-border rounded-lg bg-card/50 space-y-3 relative mb-2"
                  >
                    <TouchableOpacity
                      onPress={() => removeCommitment(index)}
                      className="absolute top-2 right-2 z-10 p-1"
                    >
                      <Ionicons name="close" size={20} color={danger || "#ef4444"} />
                    </TouchableOpacity>

                    <TextField>
                      <TextField.Label>Description</TextField.Label>
                      <TextField.Input
                        placeholder="e.g. Weekly Meeting"
                        onChangeText={(text) => updateCommitment(index, "description", text)}
                        value={item.description}
                      />
                    </TextField>

                    <View className="flex-row gap-2">
                      <View className="flex-1">
                        <TextField>
                          <TextField.Label>Day</TextField.Label>
                          <TextField.Input
                            placeholder="Mon"
                            onChangeText={(text) => updateCommitment(index, "dayOfWeek", text)}
                            value={item.dayOfWeek}
                          />
                        </TextField>
                      </View>
                      <View className="flex-1">
                        <TextField>
                          <TextField.Label>Start</TextField.Label>
                          <TextField.Input
                            placeholder="09:00"
                            onChangeText={(text) => updateCommitment(index, "startTime", text)}
                            value={item.startTime}
                          />
                        </TextField>
                      </View>
                      <View className="flex-1">
                        <TextField>
                          <TextField.Label>End</TextField.Label>
                          <TextField.Input
                            placeholder="10:00"
                            onChangeText={(text) => updateCommitment(index, "endTime", text)}
                            value={item.endTime}
                          />
                        </TextField>
                      </View>
                    </View>
                  </View>
                ))}
              </View>

              <Button onPress={handleSubmit} variant="primary" className="mt-6 h-12">
                <Button.Label className="text-white font-bold text-lg">Generate Plan</Button.Label>
                <Ionicons name="sparkles" size={20} color="white" />
              </Button>
            </Card.Body>
          </Card>
        </ScrollView>
      </KeyboardAvoidingView>
    </Container>
  );
}
