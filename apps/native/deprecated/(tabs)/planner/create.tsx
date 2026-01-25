import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect } from "react";
import { View, Text, TouchableOpacity, ActivityIndicator, ScrollView } from "react-native";
import { z } from "zod";
import { useForm, type AnyFieldApi } from "@tanstack/react-form";
import { useSemanticColors } from "@/utils/theme";
import { Card, TextField, RadioGroup, useToast } from "heroui-native";
import { Container } from "@/components/ui/container";
import { DayPickerField } from "@/components/ui/day-picker-field";
import { AppDateTimePicker } from "@/components/ui/DateTimePicker";
import { HugeiconsIcon } from "@hugeicons/react-native";
import {
  ArrowLeft01Icon,
  SparklesIcon,
  Flag01Icon,
  FlashIcon,
  Target01Icon,
  Calendar03Icon,
  Clock01Icon,
  PlusSignIcon,
  Cancel01Icon,
} from "@hugeicons/core-free-icons";
import { usePlanGeneration } from "@/hooks/usePlanGeneration";
import type { GenerateInput } from "@/hooks/usePlanGeneration";
import Animated, { FadeInDown, FadeInUp } from "react-native-reanimated";

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
    { value: "Simple", label: "Simple", description: "Fewer, manageable focus points" },
    { value: "Balanced", label: "Balanced", description: "Deep and light tasks mixed" },
    { value: "Ambitious", label: "Ambitious", description: "Aggressive target goals" },
  ];

const weekendPreferenceOptions: Array<{
  value: WeekendPreference;
  label: string;
  description: string;
}> = [
  { value: "Work", label: "Deep Work", description: "Utilize weekends for output" },
  { value: "Rest", label: "Full Rest", description: "Keep your weekends offline" },
  { value: "Mixed", label: "Hybrid", description: "Light maintenance only" },
];

function FieldInfo({ field }: { field: AnyFieldApi }) {
  if (!field.state.meta.isTouched || field.state.meta.isValid) return null;
  return (
    <Text className="text-xs font-sans-semibold text-danger mt-2 ml-1">
      {field.state.meta.errors.map((err: any) => String(err)).join(", ")}
    </Text>
  );
}

export default function CreatePlan() {
  const router = useRouter();
  const { template } = useLocalSearchParams<{ template?: string }>();
  const { generate, isGenerating, error, clearError, draft } = usePlanGeneration();
  const { toast } = useToast();

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
    },
    onSubmit: async ({ value }) => {
      clearError();
      const input: GenerateInput = {
        goalsText: value.goalsText,
        taskComplexity: value.taskComplexity,
        focusAreas: value.focusAreas,
        weekendPreference: value.weekendPreference,
        fixedCommitmentsJson: {
          commitments: value.commitments,
        },
      };

      try {
        await generate(input);
      } catch (err) {
        toast.show({
          variant: "danger",
          label: "Generation Failed",
          description: "Something went wrong. Please try again.",
        });
      }
    },
  });

  useEffect(() => {
    if (template) {
      try {
        const data = JSON.parse(template);
        form.setFieldValue("goalsText", data.goalsText || "");
        if (data.taskComplexity) form.setFieldValue("taskComplexity", data.taskComplexity);
        form.setFieldValue("focusAreas", data.focusAreas || "");
      } catch (e) {
        console.error("Failed to parse template:", e);
      }
    }
  }, [template]);

  useEffect(() => {
    if (draft) {
      toast.show({
        variant: "success",
        label: "Draft Ready!",
        description: "Your system has been generated.",
        actionLabel: "View",
        onActionPress: ({ hide }) => {
          hide();
          router.replace("/(tabs)/planner");
        },
      });
    }
  }, [draft]);

  const addCommitment = () => {
    const current = form.getFieldValue("commitments");
    form.setFieldValue("commitments", [
      ...current,
      { dayOfWeek: "Monday", startTime: "09:00", endTime: "10:00", description: "" },
    ]);
  };

  return (
    <Container className="bg-background">
      {/* Header */}
      <View className="px-6 pt-10 pb-4 flex-row items-center gap-x-4">
        <TouchableOpacity
          onPress={() => router.back()}
          className="w-12 h-12 rounded-2xl bg-surface border border-border/50 items-center justify-center"
        >
          <HugeiconsIcon icon={ArrowLeft01Icon} size={22} color="var(--foreground)" />
        </TouchableOpacity>
        <Text className="text-2xl font-sans-bold text-foreground">New Blueprint</Text>
      </View>

      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 120 }}
      >
        <View className="px-6 gap-y-10 mt-6">
          {/* Section 1: Goals */}
          <Section icon={Flag01Icon} title="Primary Objectives" delay={100}>
            <form.Field name="goalsText">
              {(field) => (
                <View>
                  <TextField variant="bordered" className="bg-surface/30">
                    <TextField.Input
                      placeholder="e.g. Mastering React Native, Marathon prep..."
                      onChangeText={field.handleChange}
                      value={field.state.value}
                      multiline
                      numberOfLines={4}
                      className="text-base font-sans p-4"
                    />
                  </TextField>
                  <FieldInfo field={field} />
                </View>
              )}
            </form.Field>
          </Section>

          {/* Section 2: Complexity */}
          <Section icon={FlashIcon} title="Dynamic Intensity" delay={200}>
            <form.Field name="taskComplexity">
              {(field) => (
                <View className="bg-surface/30 p-2 rounded-[24px] border border-border/30">
                  {taskComplexityOptions.map((opt) => (
                    <TouchableOpacity
                      key={opt.value}
                      onPress={() => field.setValue(opt.value)}
                      activeOpacity={0.7}
                      className={`p-4 rounded-[20px] flex-row items-center justify-between mb-1 ${
                        field.state.value === opt.value ? "bg-foreground" : "bg-transparent"
                      }`}
                    >
                      <View>
                        <Text
                          className={`font-sans-bold text-base ${field.state.value === opt.value ? "text-background" : "text-foreground"}`}
                        >
                          {opt.label}
                        </Text>
                        <Text
                          className={`font-sans text-xs mt-0.5 ${field.state.value === opt.value ? "text-background/70" : "text-muted-foreground"}`}
                        >
                          {opt.description}
                        </Text>
                      </View>
                      {field.state.value === opt.value && (
                        <HugeiconsIcon icon={SparklesIcon} size={20} color="var(--background)" />
                      )}
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </form.Field>
          </Section>

          {/* Section 3: Focus Areas */}
          <Section icon={Target01Icon} title="Focus Clusters" delay={300}>
            <form.Field name="focusAreas">
              {(field) => (
                <View>
                  <TextField variant="bordered" className="bg-surface/30">
                    <TextField.Input
                      placeholder="e.g. Engineering, Health, Focus"
                      onChangeText={field.handleChange}
                      value={field.state.value}
                      className="text-base font-sans px-4 py-3"
                    />
                  </TextField>
                  <FieldInfo field={field} />
                </View>
              )}
            </form.Field>
          </Section>

          {/* Section 4: Weekends */}
          <Section icon={Calendar03Icon} title="Weekend Protocol" delay={400}>
            <form.Field name="weekendPreference">
              {(field) => (
                <View className="flex-row gap-x-3">
                  {weekendPreferenceOptions.map((opt) => (
                    <TouchableOpacity
                      key={opt.value}
                      onPress={() => field.setValue(opt.value)}
                      className={`flex-1 p-4 rounded-2xl border items-center justify-center ${
                        field.state.value === opt.value
                          ? "bg-accent border-accent"
                          : "bg-surface border-border/30"
                      }`}
                    >
                      <Text
                        className={`text-xs font-sans-bold uppercase tracking-widest ${
                          field.state.value === opt.value ? "text-white" : "text-muted-foreground"
                        }`}
                      >
                        {opt.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </form.Field>
          </Section>

          {/* Section 5: Commitments */}
          <Section
            icon={Clock01Icon}
            title="Structural Constraints"
            delay={500}
            action={
              <TouchableOpacity onPress={addCommitment} className="p-2 bg-accent/10 rounded-xl">
                <HugeiconsIcon icon={PlusSignIcon} size={18} color="var(--accent)" />
              </TouchableOpacity>
            }
          >
            <form.Field name="commitments">
              {(field) => (
                <View className="gap-y-4">
                  {field.state.value.map((_, index) => (
                    <CommitmentRow key={index} index={index} form={form} />
                  ))}
                  {field.state.value.length === 0 && (
                    <Text className="text-center font-sans text-muted-foreground italic py-6">
                      No fixed commitments added.
                    </Text>
                  )}
                </View>
              )}
            </form.Field>
          </Section>
        </View>
      </ScrollView>

      {/* Floating Action Button */}
      <View className="absolute bottom-10 left-6 right-6">
        <form.Subscribe
          selector={(s) => [s.canSubmit, s.isSubmitting]}
          children={([canSubmit, isSubmitting]) => (
            <TouchableOpacity
              onPress={() => form.handleSubmit()}
              disabled={!canSubmit || isSubmitting || isGenerating}
              activeOpacity={0.8}
              className={`h-16 rounded-[24px] flex-row items-center justify-center gap-x-3 shadow-xl ${
                !canSubmit || isSubmitting || isGenerating
                  ? "bg-muted opacity-50 shadow-none"
                  : "bg-foreground shadow-black/20"
              }`}
            >
              {isGenerating || isSubmitting ? (
                <ActivityIndicator color="var(--background)" />
              ) : (
                <>
                  <Text className="text-background font-sans-bold text-lg">
                    Build Monthly System
                  </Text>
                  <HugeiconsIcon icon={SparklesIcon} size={20} color="var(--background)" />
                </>
              )}
            </TouchableOpacity>
          )}
        />
      </View>
    </Container>
  );
}

function Section({ icon, title, children, delay, action }: any) {
  return (
    <Animated.View entering={FadeInDown.delay(delay).duration(600)}>
      <View className="flex-row items-center justify-between mb-4 px-1">
        <View className="flex-row items-center gap-x-3">
          <View className="w-8 h-8 rounded-lg bg-surface items-center justify-center border border-border/30">
            <HugeiconsIcon icon={icon} size={16} color="var(--muted-foreground)" />
          </View>
          <Text className="text-base font-sans-bold text-foreground">{title}</Text>
        </View>
        {action}
      </View>
      {children}
    </Animated.View>
  );
}

function CommitmentRow({ index, form }: any) {
  return (
    <View className="p-4 bg-surface rounded-[24px] border border-border/30 gap-y-4">
      <View className="flex-row items-center justify-between">
        <form.Field name={`commitments.${index}.description`}>
          {(field: any) => (
            <TextField variant="ghost" className="flex-1 mr-4 h-10">
              <TextField.Input
                placeholder="Commitment name..."
                value={field.state.value}
                onChangeText={field.handleChange}
                className="text-base font-sans-semibold"
              />
            </TextField>
          )}
        </form.Field>
        <TouchableOpacity
          onPress={() => {
            const current = form.getFieldValue("commitments");
            const next = [...current];
            next.splice(index, 1);
            form.setFieldValue("commitments", next);
          }}
          className="w-8 h-8 rounded-full bg-danger/10 items-center justify-center"
        >
          <HugeiconsIcon icon={Cancel01Icon} size={16} color="var(--danger)" />
        </TouchableOpacity>
      </View>

      <View className="flex-row gap-x-2">
        <form.Field name={`commitments.${index}.dayOfWeek`}>
          {(field: any) => (
            <View className="flex-1">
              <DayPickerField value={field.state.value} onChange={field.handleChange} />
            </View>
          )}
        </form.Field>
        <form.Field name={`commitments.${index}.startTime`}>
          {(field: any) => (
            <TimeInput value={field.state.value} onChange={field.handleChange} label="Start" />
          )}
        </form.Field>
        <form.Field name={`commitments.${index}.endTime`}>
          {(field: any) => (
            <TimeInput value={field.state.value} onChange={field.handleChange} label="End" />
          )}
        </form.Field>
      </View>
    </View>
  );
}

function TimeInput({ value, onChange, label }: any) {
  const parseTime = (s: string) => {
    if (!s) return new Date();
    const [h, m] = s.split(":").map(Number);
    const d = new Date();
    d.setHours(h, m, 0, 0);
    return d;
  };
  const formatTime = (d: Date) => {
    return `${d.getHours().toString().padStart(2, "0")}:${d.getMinutes().toString().padStart(2, "0")}`;
  };

  return (
    <AppDateTimePicker
      label={label}
      mode="time"
      value={parseTime(value)}
      onChange={(d: any) => onChange(formatTime(d))}
    />
  );
}
