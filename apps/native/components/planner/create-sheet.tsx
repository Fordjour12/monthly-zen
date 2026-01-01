import React, { useEffect } from "react";
import { View, Text, TouchableOpacity, ScrollView } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { z } from "zod";
import { useForm, type AnyFieldApi } from "@tanstack/react-form";
import { useSemanticColors } from "@/utils/theme";
import { Card, TextField, Button, RadioGroup, Divider } from "heroui-native";
import { DayPickerField } from "@/components/ui/day-picker-field";
import { AppDateTimePicker } from "@/components/ui/DateTimePicker";
import { useRouter } from "expo-router";

const GeneratePlanFormDataSchema = z.object({
  goalsText: z.string().min(1, "Goals are required"),
  taskComplexity: z.enum(["Simple", "Balanced", "Ambitious"]),
  focusAreas: z.string().min(1, "Focus areas are required"),
  weekendPreference: z.enum(["Work", "Rest", "Mixed"]),
  commitments: z.array(
    z.object({
      dayOfWeek: z.string().min(1, "Day is required"),
      startTime: z.string().min(1, "Start time is required"),
      endTime: z.string().min(1, "End time is required"),
      description: z.string().min(1, "Description is required"),
    }),
  ),
});

type TaskComplexity = "Simple" | "Balanced" | "Ambitious";
type WeekendPreference = "Work" | "Rest" | "Mixed";

const taskComplexityOptions: Array<{ value: TaskComplexity; label: string; description: string }> =
  [
    { value: "Simple", label: "Simple", description: "Fewer, manageable tasks" },
    { value: "Balanced", label: "Balanced", description: "Mix of easy and challenging" },
    { value: "Ambitious", label: "Ambitious", description: "Challenging but rewarding" },
  ];

const weekendPreferenceOptions: Array<{
  value: WeekendPreference;
  label: string;
  description: string;
}> = [
  { value: "Work", label: "Deep Work", description: "Focus on intensive tasks" },
  { value: "Rest", label: "Rest & Recharge", description: "Keep weekends free" },
  { value: "Mixed", label: "Light Tasks", description: "Easy activities only" },
];

interface TemplateData {
  id: string;
  title: string;
  description: string;
  category: string;
  complexity: string;
  focusAreas: string;
  icon: string;
}

interface CreateSheetProps {
  template: TemplateData | null;
  onClose: () => void;
}

function FieldInfo({ field }: { field: AnyFieldApi }) {
  return (
    <>
      {field.state.meta.isTouched && !field.state.meta.isValid && (
        <Text className="text-sm text-danger">
          {field.state.meta.errors.map((err: unknown) => String(err)).join(",")}
        </Text>
      )}
    </>
  );
}

export default function CreateSheet({ template, onClose }: CreateSheetProps) {
  const { primary, danger } = useSemanticColors();
  const router = useRouter();

  const form = useForm({
    defaultValues: {
      goalsText: "",
      taskComplexity: "Balanced" as TaskComplexity,
      focusAreas: "",
      weekendPreference: "Rest" as WeekendPreference,
      commitments: [] as Array<{
        dayOfWeek: string;
        startTime: string;
        endTime: string;
        description: string;
      }>,
    },
    validators: {
      onChange: GeneratePlanFormDataSchema,
      onBlur: GeneratePlanFormDataSchema,
      onSubmit: GeneratePlanFormDataSchema,
    },
    onSubmit: async ({ value }) => {
      console.log("Form Submitted:", value);
      onClose();
      // Navigate to plans tab after successful submission
      router.setParams({ tab: "plans" });
    },
  });

  // Pre-fill form if template is provided
  useEffect(() => {
    if (template) {
      form.setFieldValue("goalsText", template.description || "");
      form.setFieldValue("focusAreas", template.focusAreas || "");
      if (template.complexity) {
        const complexityMap: Record<string, TaskComplexity> = {
          Simple: "Simple",
          Balanced: "Balanced",
          Ambitious: "Ambitious",
        };
        form.setFieldValue("taskComplexity", complexityMap[template.complexity] || "Balanced");
      }
    }
  }, [template]);

  const addCommitment = () => {
    const currentCommitments = form.getFieldValue("commitments");
    form.setFieldValue("commitments", [
      ...(currentCommitments || []),
      { dayOfWeek: "", startTime: "", endTime: "", description: "" },
    ]);
  };

  return (
    <View className="flex-1 bg-background">
      {/* Header */}
      <View className="flex-row justify-between items-center p-4 border-b border-border">
        <Text className="text-xl font-bold text-foreground">
          {template ? `Create from: ${template.title}` : "Create New Plan"}
        </Text>
        <TouchableOpacity onPress={onClose} className="p-2">
          <Ionicons name="close" size={24} color={primary} />
        </TouchableOpacity>
      </View>

      <ScrollView
        className="flex-1"
        contentContainerClassName="p-4 pb-10"
        keyboardShouldPersistTaps="handled"
      >
        <Card className="mx-2">
          <Card.Body className="p-1.5">
            <View className="mb-4">
              <View className="flex-row items-center gap-2 mb-1">
                <Ionicons name="flag" size={20} color={primary} />
                <Text className="text-lg font-semibold text-foreground">Goals & Objectives</Text>
              </View>

              <form.Field name="goalsText">
                {(field) => (
                  <TextField isInvalid={field.state.meta.errors.length > 0}>
                    <TextField.Label>Your Goals</TextField.Label>
                    <TextField.Input
                      placeholder="e.g. Launch website, Read 2 books..."
                      onChangeText={field.handleChange}
                      value={field.state.value}
                      multiline
                      numberOfLines={4}
                      textAlignVertical="top"
                    />
                    <FieldInfo field={field} />
                  </TextField>
                )}
              </form.Field>
            </View>

            <Divider orientation="horizontal" className="my-2" thickness={2} variant="thick" />

            <View className="mb-4">
              <View className="flex-row items-center gap-2 mb-1">
                <Ionicons name="flash" size={20} color={primary} />
                <Text className="text-lg font-semibold text-foreground">Task Complexity</Text>
              </View>

              <form.Field name="taskComplexity">
                {(field) => (
                  <RadioGroup
                    value={field.state.value}
                    onValueChange={(val) =>
                      field.setValue(val as "Simple" | "Balanced" | "Ambitious")
                    }
                  >
                    {taskComplexityOptions.map((option) => (
                      <RadioGroup.Item key={option.value} value={option.value}>
                        <View className="mb-1">
                          <RadioGroup.Label>{option.label}</RadioGroup.Label>
                          <RadioGroup.Description className="text-muted-foreground">
                            {option.description}
                          </RadioGroup.Description>
                        </View>
                        <RadioGroup.Indicator />
                      </RadioGroup.Item>
                    ))}
                  </RadioGroup>
                )}
              </form.Field>
            </View>

            <Divider orientation="horizontal" className="my-2" thickness={2} variant="thick" />

            <View className="mb-4">
              <View className="flex-row items-center gap-2 mb-1">
                <Ionicons name="location" size={20} color={primary} />
                <Text className="text-lg font-semibold text-foreground">Focus Areas</Text>
              </View>

              <form.Field name="focusAreas">
                {(field) => (
                  <TextField isInvalid={field.state.meta.errors.length > 0}>
                    <TextField.Label>Areas to Focus On</TextField.Label>
                    <TextField.Input
                      placeholder="e.g. Health, Career, Finance"
                      onChangeText={field.handleChange}
                      value={field.state.value}
                    />
                    <FieldInfo field={field} />
                  </TextField>
                )}
              </form.Field>
            </View>

            <Divider orientation="horizontal" className="my-2" thickness={2} variant="thick" />

            <View className="mb-4">
              <View className="flex-row items-center gap-2 mb-1">
                <Ionicons name="calendar-number" size={20} color={primary} />
                <Text className="text-lg font-semibold text-foreground">Weekend Preference</Text>
              </View>

              <form.Field name="weekendPreference">
                {(field) => (
                  <RadioGroup
                    value={field.state.value}
                    onValueChange={(val) => field.setValue(val as "Work" | "Rest" | "Mixed")}
                  >
                    {weekendPreferenceOptions.map((option) => (
                      <RadioGroup.Item key={option.value} value={option.value}>
                        <View className="mb-1">
                          <RadioGroup.Label>{option.label}</RadioGroup.Label>
                          <RadioGroup.Description className="text-muted-foreground">
                            {option.description}
                          </RadioGroup.Description>
                        </View>
                        <RadioGroup.Indicator />
                      </RadioGroup.Item>
                    ))}
                  </RadioGroup>
                )}
              </form.Field>
            </View>

            <Divider orientation="horizontal" className="my-2" thickness={2} variant="thick" />

            <View className="mb-4">
              <View className="flex-row items-center justify-between mb-1">
                <View className="flex-row items-center gap-2">
                  <Ionicons name="time" size={20} color={primary} />
                  <Text className="text-lg font-semibold text-foreground">Fixed Commitments</Text>
                </View>
                <Button size="sm" variant="ghost" onPress={addCommitment}>
                  <Button.Label className="text-accent">Add</Button.Label>
                  <Ionicons name="add" size={16} color={primary} />
                </Button>
              </View>

              <form.Field name="commitments">
                {(field) => (
                  <>
                    {field.state.value.length === 0 && (
                      <Text className="text-muted-foreground text-center py-4 italic">
                        No fixed commitments added.
                      </Text>
                    )}

                    {field.state.value.map((_item, index) => (
                      <CommitmentItem key={index} index={index} danger={danger} form={form} />
                    ))}
                  </>
                )}
              </form.Field>
            </View>

            <form.Subscribe
              selector={(state) => [state.canSubmit, state.isSubmitting]}
              children={([canSubmit, isSubmitting]) => (
                <Button
                  onPress={() => form.handleSubmit()}
                  variant="primary"
                  className="mt-6 h-12"
                  isDisabled={!canSubmit || isSubmitting}
                >
                  <Text className="text-white font-bold text-lg">
                    {isSubmitting ? "Generating..." : "Generate Plan"}
                  </Text>
                  <Ionicons name="sparkles" size={20} color="white" />
                </Button>
              )}
            />
          </Card.Body>
        </Card>
      </ScrollView>
    </View>
  );
}

function CommitmentItem({ index, danger, form }: { index: number; danger?: string; form: any }) {
  const parseTimeString = (timeStr: string): Date | null => {
    if (!timeStr) return null;
    const [hours, minutes] = timeStr.split(":").map(Number);
    const date = new Date();
    date.setHours(hours, minutes, 0, 0);
    return date;
  };

  const formatTimeToString = (date: Date | null): string => {
    if (!date) return "";
    const hours = date.getHours().toString().padStart(2, "0");
    const minutes = date.getMinutes().toString().padStart(2, "0");
    return `${hours}:${minutes}`;
  };

  return (
    <View className="p-3 border border-border rounded-lg bg-card/50 space-y-3 relative mb-2">
      <form.Field name={`commitments.${index}.description`}>
        {(field: AnyFieldApi) => (
          <>
            <TouchableOpacity
              onPress={() => {
                const currentCommitments = field.form.getFieldValue("commitments");
                if (currentCommitments) {
                  const newCommitments = [...currentCommitments];
                  newCommitments.splice(index, 1);
                  field.form.setFieldValue("commitments", newCommitments);
                }
              }}
              className="absolute top-2 right-2 z-10 p-1"
            >
              <Ionicons name="close" size={20} color={danger || "#ef4444"} />
            </TouchableOpacity>
            <TextField>
              <TextField.Label>Description</TextField.Label>
              <TextField.Input
                placeholder="e.g. Weekly Meeting"
                onChangeText={field.handleChange}
                value={field.state.value}
              />
            </TextField>
          </>
        )}
      </form.Field>

      <View className="flex-row gap-2">
        <form.Field name={`commitments.${index}.dayOfWeek`}>
          {(field: AnyFieldApi) => (
            <DayPickerField value={field.state.value} onChange={(val) => field.setValue(val)} />
          )}
        </form.Field>

        <form.Field name={`commitments.${index}.startTime`}>
          {(field: AnyFieldApi) => (
            <AppDateTimePicker
              label="Start"
              mode="time"
              value={field.state.value ? parseTimeString(field.state.value) : null}
              onChange={(date) => field.setValue(formatTimeToString(date))}
            />
          )}
        </form.Field>

        <form.Field name={`commitments.${index}.endTime`}>
          {(field: AnyFieldApi) => (
            <AppDateTimePicker
              label="End"
              mode="time"
              value={field.state.value ? parseTimeString(field.state.value) : null}
              onChange={(date) => field.setValue(formatTimeToString(date))}
            />
          )}
        </form.Field>
      </View>
    </View>
  );
}
