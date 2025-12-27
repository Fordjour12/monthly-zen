import React, { useState, useEffect } from "react";
import { View, Text, ScrollView, TouchableOpacity } from "react-native";
import { Card, Button, Divider, Tabs, Skeleton } from "heroui-native";
import { Ionicons } from "@expo/vector-icons";
import { Container } from "@/components/ui/container";
import { useSemanticColors } from "@/utils/theme";
import { Stack } from "expo-router";

// Mock data for categories and templates
const CATEGORIES = [
  { key: "all", label: "All" },
  { key: "career", label: "Career & Growth" },
  { key: "health", label: "Health & Wellness" },
  { key: "finance", label: "Finance" },
];

const TEMPLATES = [
  {
    id: "1",
    title: "Deep Work Sprint",
    description: "Maximize your output with 4 hours of uninterrupted deep work daily.",
    category: "career",
    complexity: "Ambitious",
    focusAreas: "Productivity, Skill Building",
    icon: "rocket",
  },
  {
    id: "2",
    title: "Morning Routine Mastery",
    description: "Build a rock-solid morning ritual including meditation and stretching.",
    category: "health",
    complexity: "Simple",
    focusAreas: "Wellness, Discipline",
    icon: "sunny",
  },
  {
    id: "3",
    title: "Financial Zen 101",
    description: "Master your budget with daily tracking and weekly audits.",
    category: "finance",
    complexity: "Balanced",
    focusAreas: "Savings, Awareness",
    icon: "cash",
  },
  {
    id: "4",
    title: "Language Learning Lab",
    description: "Consistent 30-minute daily practice using immersion techniques.",
    category: "career",
    complexity: "Balanced",
    focusAreas: "Skill Acquisition",
    icon: "language",
  },
];

const TemplateCard = ({ template, primary }: { template: any; primary: string }) => (
  <Card className="mb-4 overflow-hidden border border-border bg-card">
    <View className="p-4">
      <View className="flex-row justify-between items-start mb-2">
        <View className="flex-row items-center gap-2">
          <View className="w-10 h-10 rounded-full bg-primary/10 items-center justify-center">
            <Ionicons name={template.icon as any} size={20} color={primary} />
          </View>
          <View>
            <Text className="text-lg font-bold text-foreground">{template.title}</Text>
            <Text className="text-xs text-muted-foreground uppercase font-semibold">
              {template.complexity}
            </Text>
          </View>
        </View>
        <TouchableOpacity className="p-2">
          <Ionicons name="bookmark-outline" size={20} color={primary} />
        </TouchableOpacity>
      </View>

      <Text className="text-sm text-foreground mb-4 leading-5">{template.description}</Text>

      <Divider className="mb-4" />

      <View className="flex-row justify-between items-center">
        <View className="flex-row items-center gap-1">
          <Ionicons name="location" size={14} color={primary} />
          <Text className="text-xs text-muted-foreground">{template.focusAreas}</Text>
        </View>
        <Button size="sm" className="bg-primary h-8 px-4">
          <Text className="text-white text-xs font-bold">Apply</Text>
        </Button>
      </View>
    </View>
  </Card>
);

export default function ExploreScreen() {
  const { primary, accent } = useSemanticColors();
  const [activeCategory, setActiveCategory] = useState("all");
  const [isLoading, setIsLoading] = useState(false);

  // Simulate loading when category changes
  useEffect(() => {
    setIsLoading(true);
    const timer = setTimeout(() => setIsLoading(false), 800);
    return () => clearTimeout(timer);
  }, [activeCategory]);

  const filteredTemplates = TEMPLATES.filter(
    (t) => activeCategory === "all" || t.category === activeCategory,
  );

  return (
    <Container>
      <Stack.Screen options={{ title: "Discover", headerShown: false }} />

      <View className="px-4 pt-4 pb-2">
        <Text className="text-3xl font-bold text-foreground">Discover</Text>
        <Text className="text-muted-foreground mt-1">
          Find inspiration for your next monthly plan.
        </Text>
      </View>

      <View className="mt-4">
        <Tabs
          value={activeCategory}
          onValueChange={setActiveCategory}
          variant="line"
          className="px-4"
        >
          <Tabs.List className="border-b border-divider">
            <Tabs.ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <Tabs.Indicator className="bg-primary" />
              {CATEGORIES.map((cat) => (
                <Tabs.Trigger key={cat.key} value={cat.key} className="px-4 py-3">
                  <Tabs.Label
                    className={`${activeCategory === cat.key ? "text-primary font-bold" : "text-muted-foreground"}`}
                  >
                    {cat.label}
                  </Tabs.Label>
                </Tabs.Trigger>
              ))}
            </Tabs.ScrollView>
          </Tabs.List>
        </Tabs>
      </View>

      <ScrollView className="flex-1 px-4 pt-6" contentContainerClassName="pb-10">
        {isLoading ? (
          // Skeleton Loading State
          <View className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="mb-4 p-4 border border-border bg-card">
                <View className="flex-row items-center gap-3 mb-4">
                  <Skeleton className="size-12 rounded-full" />
                  <View className="flex-1 gap-2">
                    <Skeleton className="h-4 w-2/3 rounded" />
                    <Skeleton className="h-3 w-1/3 rounded" />
                  </View>
                </View>
                <Skeleton className="h-16 w-full rounded-lg mb-4" />
                <Divider className="mb-4" />
                <View className="flex-row justify-between items-center">
                  <Skeleton className="h-4 w-1/2 rounded" />
                  <Skeleton className="h-8 w-20 rounded" />
                </View>
              </Card>
            ))}
          </View>
        ) : (
          // Content State
          <>
            {filteredTemplates.map((template) => (
              <TemplateCard key={template.id} template={template} primary={primary} />
            ))}

            {filteredTemplates.length === 0 && (
              <View className="items-center justify-center py-20">
                <Ionicons name="search-outline" size={48} color={primary} />
                <Text className="text-muted-foreground mt-4 text-lg">
                  No templates found in this category.
                </Text>
              </View>
            )}
          </>
        )}
      </ScrollView>
    </Container>
  );
}
