import React, { useState, useEffect, useRef } from "react";
import { View, Text, ScrollView, TouchableOpacity, TextInput } from "react-native";
import { Card, Button, Divider, Tabs, Skeleton } from "heroui-native";
import { Ionicons } from "@expo/vector-icons";
import { Container } from "@/components/ui/container";
import { useSemanticColors } from "@/utils/theme";
import BottomSheet, { BottomSheetView } from "@gorhom/bottom-sheet";
import CreateSheet from "./create-sheet";

// Updated categories
const CATEGORIES = [
  { key: "all", label: "All" },
  { key: "productivity", label: "Productivity" },
  { key: "wellness", label: "Wellness" },
  { key: "finance", label: "Finance" },
  { key: "learning", label: "Learning" },
  { key: "creativity", label: "Creativity" },
];

const TEMPLATES = [
  {
    id: "1",
    title: "Deep Work Sprint",
    description: "Maximize your output with 4 hours of uninterrupted deep work daily.",
    category: "productivity",
    complexity: "Ambitious",
    focusAreas: "Productivity, Skill Building",
    icon: "rocket",
  },
  {
    id: "2",
    title: "Morning Routine Mastery",
    description: "Build a rock-solid morning ritual including meditation and stretching.",
    category: "wellness",
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
    category: "productivity",
    complexity: "Balanced",
    focusAreas: "Skill Acquisition",
    icon: "language",
  },
  {
    id: "5",
    title: "Book Club Monthly",
    description: "Read and discuss one book per month with structured reading schedule.",
    category: "learning",
    complexity: "Simple",
    focusAreas: "Reading, Knowledge",
    icon: "book",
  },
  {
    id: "6",
    title: "Art Practice Challenge",
    description: "Daily sketch prompts and weekly project completion.",
    category: "creativity",
    complexity: "Balanced",
    focusAreas: "Creativity, Discipline",
    icon: "brush",
  },
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

const TemplateCard = ({
  template,
  primary,
  onApply,
}: {
  template: TemplateData;
  primary: string;
  onApply: (template: TemplateData) => void;
}) => (
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
        <Button size="sm" className="bg-primary h-8 px-4" onPress={() => onApply(template)}>
          <Text className="text-white text-xs font-bold">Apply</Text>
        </Button>
      </View>
    </View>
  </Card>
);

export default function TemplatesTab() {
  const { primary } = useSemanticColors();
  const [activeCategory, setActiveCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<TemplateData | null>(null);
  const bottomSheetRef = useRef<BottomSheet>(null);

  // Simulate loading when category changes
  useEffect(() => {
    setIsLoading(true);
    const timer = setTimeout(() => setIsLoading(false), 800);
    return () => clearTimeout(timer);
  }, [activeCategory, searchQuery]);

  const filteredTemplates = TEMPLATES.filter((t) => {
    const matchesCategory = activeCategory === "all" || t.category === activeCategory;
    const matchesSearch =
      searchQuery === "" ||
      t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const handleApply = (template: TemplateData) => {
    setSelectedTemplate(template);
    bottomSheetRef.current?.expand();
  };

  const handleCreateNew = () => {
    setSelectedTemplate(null);
    bottomSheetRef.current?.expand();
  };

  const handleSheetClose = () => {
    setSelectedTemplate(null);
  };

  return (
    <Container>
      <ScrollView className="flex-1" contentContainerClassName="pb-24">
        <View className="px-4 pt-4 pb-2">
          <View className="flex-row justify-between items-center mb-2">
            <View>
              <Text className="text-3xl font-bold text-foreground">Discover</Text>
              <Text className="text-muted-foreground mt-1 text-xs">
                Find inspiration for your next monthly plan.
              </Text>
            </View>
            <Button variant="primary" onPress={handleCreateNew} className="rounded-none">
              <Ionicons name="add" size={20} color="white" />
              <Text className="text-white font-bold ml-1">Create</Text>
            </Button>
          </View>
        </View>

        {/* Search Bar */}
        <View className="px-4 mb-4">
          <View className="flex-row items-center bg-card border border-border rounded-lg px-3">
            <Ionicons name="search" size={20} color={primary} />
            <TextInput
              className="flex-1 p-3 text-foreground"
              placeholder="Search templates..."
              placeholderTextColor="#6b7280"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            {searchQuery !== "" && (
              <TouchableOpacity onPress={() => setSearchQuery("")}>
                <Ionicons name="close" size={20} color={primary} />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Category Tabs */}
        <View className="mb-4">
          <Tabs
            value={activeCategory}
            onValueChange={setActiveCategory}
            variant="pill"
            className="px-4"
          >
            <Tabs.List className="rounded-none">
              <Tabs.ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <Tabs.Indicator className="bg-primary" />
                {CATEGORIES.map((cat) => (
                  <Tabs.Trigger key={cat.key} value={cat.key}>
                    <Tabs.Label
                      className={`${activeCategory === cat.key ? "text-accent font-bold" : "text-muted-foreground"}`}
                    >
                      {cat.label}
                    </Tabs.Label>
                  </Tabs.Trigger>
                ))}
              </Tabs.ScrollView>
            </Tabs.List>
          </Tabs>
        </View>

        {/* Template Cards */}
        <View className="px-4">
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
                <TemplateCard
                  key={template.id}
                  template={template}
                  primary={primary}
                  onApply={handleApply}
                />
              ))}

              {filteredTemplates.length === 0 && (
                <View className="items-center justify-center py-20">
                  <Ionicons name="search-outline" size={48} color={primary} />
                  <Text className="text-muted-foreground mt-4 text-lg">No templates found.</Text>
                  <Text className="text-muted-foreground text-sm">
                    Try adjusting your search or category.
                  </Text>
                </View>
              )}
            </>
          )}
        </View>
      </ScrollView>

      {/* Create Sheet Modal */}
      <BottomSheet
        ref={bottomSheetRef}
        snapPoints={["100%"]}
        index={-1}
        onChange={(index) => {
          if (index === -1) handleSheetClose();
        }}
        backgroundStyle={{ backgroundColor: "rgb(10, 10, 10)" }}
        handleIndicatorStyle={{ backgroundColor: "#6b7280" }}
      >
        <BottomSheetView className="flex-1">
          <CreateSheet
            template={selectedTemplate}
            onClose={() => bottomSheetRef.current?.close()}
          />
        </BottomSheetView>
      </BottomSheet>
    </Container>
  );
}
